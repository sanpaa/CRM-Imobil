/**
 * Tenant Context Middleware
 * Automatically injects tenant_id into request context from authenticated user
 * Ensures all queries are scoped to the correct tenant for data isolation
 */

const supabase = require('../../infrastructure/database/supabase');

/**
 * Extract tenant ID from authenticated user
 * @param {Object} req - Express request object
 * @returns {string|null} - Tenant ID or null
 */
function extractTenantId(req) {
    // Option 1: From authenticated user's company_id
    if (req.user && req.user.company_id) {
        return req.user.company_id;
    }
    
    // Option 2: From custom header (for API integrations)
    if (req.headers['x-tenant-id']) {
        return req.headers['x-tenant-id'];
    }
    if (req.headers['x-company-id']) {
        return req.headers['x-company-id'];
    }
    
    // Option 3: From subdomain (e.g., tenant1.crm.com)
    const host = req.hostname;
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'crm') {
        // Would need to lookup tenant by subdomain - implement if needed
        return null;
    }
    
    return null;
}

/**
 * Middleware to inject tenant context into requests
 * This ensures automatic tenant isolation for all database operations
 */
const tenantMiddleware = async (req, res, next) => {
    try {
        const tenantId = extractTenantId(req);
        
        if (tenantId) {
            // Add tenant ID to request object for use in controllers
            req.tenantId = tenantId;
            
            // Set tenant context in Supabase session (for RLS if enabled)
            // This allows Postgres RLS policies to automatically filter by tenant
            if (supabase && supabase.rpc) {
                try {
                    await supabase.rpc('set_config', {
                        setting: 'app.current_tenant_id',
                        value: tenantId,
                        is_local: true
                    });
                } catch (err) {
                    // RLS not enabled or function doesn't exist - continue without it
                    console.debug('Tenant context not set in DB (RLS may not be enabled)');
                }
            }
            
            console.log(`[Tenant Context] Request scoped to tenant: ${tenantId}`);
        } else {
            // No tenant context - this might be a public endpoint
            console.log('[Tenant Context] No tenant context (public endpoint or unauthenticated)');
        }
        
        next();
    } catch (error) {
        console.error('[Tenant Middleware] Error:', error);
        // Don't block the request - continue without tenant context
        next();
    }
};

/**
 * Require tenant context - blocks requests without valid tenant
 * Use this on routes that MUST have tenant context
 */
const requireTenant = (req, res, next) => {
    if (!req.tenantId) {
        return res.status(403).json({
            success: false,
            error: 'Tenant context required. Please authenticate or provide valid tenant ID.'
        });
    }
    next();
};

/**
 * Verify user belongs to tenant
 * Prevents cross-tenant access even with valid authentication
 */
const verifyTenantAccess = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        
        if (!req.tenantId) {
            return res.status(403).json({
                success: false,
                error: 'Tenant context required'
            });
        }
        
        // Verify user belongs to this tenant
        if (req.user.company_id !== req.tenantId) {
            console.warn(`[Security] User ${req.user.id} attempted to access tenant ${req.tenantId} but belongs to ${req.user.company_id}`);
            return res.status(403).json({
                success: false,
                error: 'Access denied: You do not have permission to access this tenant'
            });
        }
        
        next();
    } catch (error) {
        console.error('[Tenant Verification] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error verifying tenant access'
        });
    }
};

/**
 * Helper function to get tenant ID from request
 * Use this in controllers that need tenant ID
 */
function getTenantId(req) {
    return (req.user && req.user.company_id) || req.tenantId || null;
}

/**
 * Helper function to validate if user can perform action based on subscription
 * Checks plan limits and features
 */
async function validateTenantLimits(tenantId, action, currentCount = null) {
    try {
        const { data, error } = await supabase
            .rpc('get_tenant_limits', { p_tenant_id: tenantId });
        
        if (error || !data || data.length === 0) {
            // No subscription found or error - allow by default (graceful degradation)
            console.warn(`[Limits] Could not fetch limits for tenant ${tenantId}`);
            return { allowed: true, reason: 'No limits configured' };
        }
        
        const limits = data[0];
        
        switch (action) {
            case 'create_user':
                if (limits.max_users && limits.current_users >= limits.max_users) {
                    return {
                        allowed: false,
                        reason: `User limit reached (${limits.current_users}/${limits.max_users}). Please upgrade your plan.`,
                        limit: limits.max_users,
                        current: limits.current_users
                    };
                }
                break;
                
            case 'create_property':
                if (limits.max_properties && limits.current_properties >= limits.max_properties) {
                    return {
                        allowed: false,
                        reason: `Property limit reached (${limits.current_properties}/${limits.max_properties}). Please upgrade your plan.`,
                        limit: limits.max_properties,
                        current: limits.current_properties
                    };
                }
                break;
                
            case 'check_feature':
                // currentCount parameter is used as feature name in this case
                const featureName = currentCount;
                if (limits.features && limits.features[featureName] === false) {
                    return {
                        allowed: false,
                        reason: `Feature '${featureName}' is not available in your ${limits.plan_name} plan.`,
                        plan: limits.plan_name
                    };
                }
                break;
        }
        
        return { allowed: true, limits };
    } catch (error) {
        console.error('[Limits Validation] Error:', error);
        // Allow by default on error (graceful degradation)
        return { allowed: true, reason: 'Error checking limits' };
    }
}

/**
 * Middleware to check limits before allowing action
 * Usage: checkLimits('create_user')
 */
function checkLimits(action) {
    return async (req, res, next) => {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            // No tenant context - skip limit check (public endpoint)
            return next();
        }
        
        const validation = await validateTenantLimits(tenantId, action);
        
        if (!validation.allowed) {
            return res.status(403).json({
                success: false,
                error: validation.reason,
                limit: validation.limit,
                current: validation.current,
                plan: validation.plan
            });
        }
        
        // Store limits in request for use in controller
        req.tenantLimits = validation.limits;
        next();
    };
}

module.exports = {
    tenantMiddleware,
    requireTenant,
    verifyTenantAccess,
    getTenantId,
    validateTenantLimits,
    checkLimits
};
