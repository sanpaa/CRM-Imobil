/**
 * Subscription Service
 * Business logic for managing subscriptions, plans, and tenant limits
 * Application Layer - Onion Architecture
 */

const supabase = require('../../infrastructure/database/supabase');

class SubscriptionService {
    /**
     * Get all available subscription plans
     */
    async getPlans() {
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('is_active', true)
                .order('price_monthly', { ascending: true });

            if (error) {
                console.error('Error fetching plans:', error);
                return { success: false, error: error.message };
            }

            return { success: true, plans: data || [] };
        } catch (err) {
            console.error('Error in getPlans:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get a specific plan by ID or name
     */
    async getPlan(identifier) {
        try {
            let query = supabase
                .from('subscription_plans')
                .select('*');
            
            // Check if identifier is UUID or plan name
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(identifier)) {
                query = query.eq('id', identifier);
            } else {
                query = query.eq('name', identifier);
            }

            const { data, error } = await query.single();

            if (error) {
                console.error('Error fetching plan:', error);
                return { success: false, error: error.message };
            }

            return { success: true, plan: data };
        } catch (err) {
            console.error('Error in getPlan:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get tenant's current subscription
     */
    async getTenantSubscription(tenantId) {
        try {
            const { data, error } = await supabase
                .from('tenant_subscriptions')
                .select(`
                    *,
                    subscription_plans (*)
                `)
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .order('started_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No subscription found
                    return { success: true, subscription: null };
                }
                console.error('Error fetching subscription:', error);
                return { success: false, error: error.message };
            }

            return { success: true, subscription: data };
        } catch (err) {
            console.error('Error in getTenantSubscription:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get tenant limits and current usage
     */
    async getTenantLimits(tenantId) {
        try {
            const { data, error } = await supabase
                .rpc('get_tenant_limits', { p_tenant_id: tenantId });

            if (error) {
                console.error('Error fetching limits:', error);
                return { success: false, error: error.message };
            }

            if (!data || data.length === 0) {
                return { 
                    success: true, 
                    limits: null,
                    message: 'No active subscription found'
                };
            }

            return { success: true, limits: data[0] };
        } catch (err) {
            console.error('Error in getTenantLimits:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Create or update tenant subscription
     */
    async createSubscription(tenantId, planId) {
        try {
            // Deactivate existing subscriptions
            await supabase
                .from('tenant_subscriptions')
                .update({ status: 'cancelled' })
                .eq('tenant_id', tenantId)
                .eq('status', 'active');

            // Create new subscription
            const { data, error } = await supabase
                .from('tenant_subscriptions')
                .insert({
                    tenant_id: tenantId,
                    plan_id: planId,
                    status: 'active',
                    started_at: new Date().toISOString(),
                    auto_renew: true
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating subscription:', error);
                return { success: false, error: error.message };
            }

            return { success: true, subscription: data };
        } catch (err) {
            console.error('Error in createSubscription:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Upgrade/downgrade tenant plan
     */
    async changePlan(tenantId, newPlanId) {
        try {
            // Get current subscription
            const currentResult = await this.getTenantSubscription(tenantId);
            if (!currentResult.success) {
                return currentResult;
            }

            // If no current subscription, create new one
            if (!currentResult.subscription) {
                return await this.createSubscription(tenantId, newPlanId);
            }

            // Update current subscription to new plan
            const { data, error } = await supabase
                .from('tenant_subscriptions')
                .update({ 
                    plan_id: newPlanId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentResult.subscription.id)
                .select()
                .single();

            if (error) {
                console.error('Error changing plan:', error);
                return { success: false, error: error.message };
            }

            return { success: true, subscription: data };
        } catch (err) {
            console.error('Error in changePlan:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Cancel tenant subscription
     */
    async cancelSubscription(tenantId) {
        try {
            const { data, error } = await supabase
                .from('tenant_subscriptions')
                .update({ 
                    status: 'cancelled',
                    auto_renew: false,
                    updated_at: new Date().toISOString()
                })
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .select()
                .single();

            if (error) {
                console.error('Error cancelling subscription:', error);
                return { success: false, error: error.message };
            }

            return { success: true, subscription: data };
        } catch (err) {
            console.error('Error in cancelSubscription:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Check if tenant has access to a specific feature
     */
    async hasFeatureAccess(tenantId, featureName) {
        try {
            const limitsResult = await this.getTenantLimits(tenantId);
            
            if (!limitsResult.success || !limitsResult.limits) {
                // No subscription - allow by default (graceful degradation)
                return { success: true, hasAccess: true };
            }

            const features = limitsResult.limits.features || {};
            const hasAccess = features[featureName] === true;

            return { 
                success: true, 
                hasAccess,
                planName: limitsResult.limits.plan_name
            };
        } catch (err) {
            console.error('Error in hasFeatureAccess:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Check if tenant can add more users
     */
    async canAddUser(tenantId) {
        try {
            const limitsResult = await this.getTenantLimits(tenantId);
            
            if (!limitsResult.success || !limitsResult.limits) {
                // No limits - allow by default
                return { success: true, canAdd: true };
            }

            const limits = limitsResult.limits;
            const canAdd = limits.current_users < limits.max_users;

            return { 
                success: true, 
                canAdd,
                current: limits.current_users,
                max: limits.max_users
            };
        } catch (err) {
            console.error('Error in canAddUser:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Check if tenant can add more properties
     */
    async canAddProperty(tenantId) {
        try {
            const limitsResult = await this.getTenantLimits(tenantId);
            
            if (!limitsResult.success || !limitsResult.limits) {
                // No limits - allow by default
                return { success: true, canAdd: true };
            }

            const limits = limitsResult.limits;
            // max_properties = 0 means unlimited
            const canAdd = limits.max_properties === 0 || limits.current_properties < limits.max_properties;

            return { 
                success: true, 
                canAdd,
                current: limits.current_properties,
                max: limits.max_properties
            };
        } catch (err) {
            console.error('Error in canAddProperty:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get usage statistics for tenant
     */
    async getUsageStats(tenantId) {
        try {
            const limitsResult = await this.getTenantLimits(tenantId);
            
            if (!limitsResult.success) {
                return limitsResult;
            }

            if (!limitsResult.limits) {
                return {
                    success: true,
                    stats: {
                        users: { current: 0, max: 0, percentage: 0 },
                        properties: { current: 0, max: 0, percentage: 0 },
                        plan: null
                    }
                };
            }

            const limits = limitsResult.limits;
            
            return {
                success: true,
                stats: {
                    users: {
                        current: limits.current_users,
                        max: limits.max_users,
                        percentage: Math.round((limits.current_users / limits.max_users) * 100)
                    },
                    properties: {
                        current: limits.current_properties,
                        max: limits.max_properties || 'unlimited',
                        percentage: limits.max_properties > 0 
                            ? Math.round((limits.current_properties / limits.max_properties) * 100)
                            : 0
                    },
                    plan: limits.plan_name,
                    features: limits.features
                }
            };
        } catch (err) {
            console.error('Error in getUsageStats:', err);
            return { success: false, error: err.message };
        }
    }
}

module.exports = SubscriptionService;
