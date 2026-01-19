/**
 * Search Routes
 * Presentation layer - Global search endpoint
 */

const express = require('express');
const { getTenantId } = require('../middleware/tenantMiddleware');

function createSearchRoutes(searchService, authMiddleware, rateLimiter) {
    const router = express.Router();

    const middlewares = [authMiddleware];
    if (rateLimiter) {
        middlewares.push(rateLimiter);
    }

    router.get('/', ...middlewares, async (req, res) => {
        try {
            const term = req.query.q || '';
            const tenantId = getTenantId(req);

            if (!tenantId) {
                return res.status(403).json({ error: 'Tenant context required' });
            }

            const result = await searchService.search({
                tenantId,
                user: req.user,
                term
            });

            res.json(result);
        } catch (error) {
            console.error('[Search Routes] Error executing search:', error);
            res.status(500).json({ error: 'Failed to execute search' });
        }
    });

    return router;
}

module.exports = createSearchRoutes;
