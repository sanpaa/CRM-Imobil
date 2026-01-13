/**
 * Subscription Routes
 * API endpoints for managing subscriptions, plans, and tenant limits
 * Presentation Layer - Onion Architecture
 */

const express = require('express');
const SubscriptionService = require('../../application/services/SubscriptionService');
const { getTenantId } = require('../middleware/tenantMiddleware');

function createSubscriptionRoutes(subscriptionService) {
    const router = express.Router();

    /**
     * GET /api/subscriptions/plans
     * Get all available subscription plans
     * Public endpoint - no authentication required
     */
    router.get('/plans', async (req, res) => {
        try {
            const result = await subscriptionService.getPlans();
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error
                });
            }

            res.json({
                success: true,
                plans: result.plans
            });
        } catch (error) {
            console.error('Error fetching plans:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch subscription plans'
            });
        }
    });

    /**
     * GET /api/subscriptions/plans/:identifier
     * Get specific plan by ID or name
     * Public endpoint - no authentication required
     */
    router.get('/plans/:identifier', async (req, res) => {
        try {
            const { identifier } = req.params;
            const result = await subscriptionService.getPlan(identifier);
            
            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    error: result.error || 'Plan not found'
                });
            }

            res.json({
                success: true,
                plan: result.plan
            });
        } catch (error) {
            console.error('Error fetching plan:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch plan'
            });
        }
    });

    /**
     * GET /api/subscriptions/current
     * Get current tenant's subscription
     * Requires authentication
     */
    router.get('/current', async (req, res) => {
        try {
            const tenantId = getTenantId(req);
            
            if (!tenantId) {
                return res.status(403).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }

            const result = await subscriptionService.getTenantSubscription(tenantId);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error
                });
            }

            res.json({
                success: true,
                subscription: result.subscription
            });
        } catch (error) {
            console.error('Error fetching subscription:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch subscription'
            });
        }
    });

    /**
     * GET /api/subscriptions/limits
     * Get current tenant's limits and usage
     * Requires authentication
     */
    router.get('/limits', async (req, res) => {
        try {
            const tenantId = getTenantId(req);
            
            if (!tenantId) {
                return res.status(403).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }

            const result = await subscriptionService.getTenantLimits(tenantId);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error
                });
            }

            res.json({
                success: true,
                limits: result.limits
            });
        } catch (error) {
            console.error('Error fetching limits:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch limits'
            });
        }
    });

    /**
     * GET /api/subscriptions/usage
     * Get current tenant's usage statistics
     * Requires authentication
     */
    router.get('/usage', async (req, res) => {
        try {
            const tenantId = getTenantId(req);
            
            if (!tenantId) {
                return res.status(403).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }

            const result = await subscriptionService.getUsageStats(tenantId);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error
                });
            }

            res.json({
                success: true,
                stats: result.stats
            });
        } catch (error) {
            console.error('Error fetching usage stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch usage statistics'
            });
        }
    });

    /**
     * POST /api/subscriptions/subscribe
     * Create or update tenant subscription
     * Requires authentication and admin role
     */
    router.post('/subscribe', async (req, res) => {
        try {
            const tenantId = getTenantId(req);
            const { planId } = req.body;
            
            if (!tenantId) {
                return res.status(403).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }

            if (!planId) {
                return res.status(400).json({
                    success: false,
                    error: 'Plan ID is required'
                });
            }

            // Check if user is admin (optional - implement authorization as needed)
            if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only administrators can manage subscriptions'
                });
            }

            const result = await subscriptionService.createSubscription(tenantId, planId);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error
                });
            }

            res.json({
                success: true,
                subscription: result.subscription,
                message: 'Subscription created successfully'
            });
        } catch (error) {
            console.error('Error creating subscription:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create subscription'
            });
        }
    });

    /**
     * PUT /api/subscriptions/change-plan
     * Change tenant's subscription plan
     * Requires authentication and admin role
     */
    router.put('/change-plan', async (req, res) => {
        try {
            const tenantId = getTenantId(req);
            const { planId } = req.body;
            
            if (!tenantId) {
                return res.status(403).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }

            if (!planId) {
                return res.status(400).json({
                    success: false,
                    error: 'Plan ID is required'
                });
            }

            // Check if user is admin
            if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only administrators can manage subscriptions'
                });
            }

            const result = await subscriptionService.changePlan(tenantId, planId);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error
                });
            }

            res.json({
                success: true,
                subscription: result.subscription,
                message: 'Plan changed successfully'
            });
        } catch (error) {
            console.error('Error changing plan:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to change plan'
            });
        }
    });

    /**
     * POST /api/subscriptions/cancel
     * Cancel tenant's subscription
     * Requires authentication and admin role
     */
    router.post('/cancel', async (req, res) => {
        try {
            const tenantId = getTenantId(req);
            
            if (!tenantId) {
                return res.status(403).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }

            // Check if user is admin
            if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Only administrators can manage subscriptions'
                });
            }

            const result = await subscriptionService.cancelSubscription(tenantId);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error
                });
            }

            res.json({
                success: true,
                subscription: result.subscription,
                message: 'Subscription cancelled successfully'
            });
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to cancel subscription'
            });
        }
    });

    /**
     * GET /api/subscriptions/feature/:featureName
     * Check if tenant has access to a specific feature
     * Requires authentication
     */
    router.get('/feature/:featureName', async (req, res) => {
        try {
            const tenantId = getTenantId(req);
            const { featureName } = req.params;
            
            if (!tenantId) {
                return res.status(403).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }

            const result = await subscriptionService.hasFeatureAccess(tenantId, featureName);
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error
                });
            }

            res.json({
                success: true,
                hasAccess: result.hasAccess,
                planName: result.planName
            });
        } catch (error) {
            console.error('Error checking feature access:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check feature access'
            });
        }
    });

    return router;
}

module.exports = createSubscriptionRoutes;
