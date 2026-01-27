/**
 * Google Calendar Routes
 * Presentation layer - HTTP endpoints for Google Calendar integration
 */

const express = require('express');
const router = express.Router();

function createGoogleCalendarRoutes(googleCalendarService, authMiddleware) {
    /**
     * GET /api/google/status
     * Get Google Calendar connection status
     */
    router.get('/status', authMiddleware, async (req, res) => {
        try {
            const companyId = req.user?.company_id || req.tenantId;
            const userId = req.user?.id;
            if (!companyId) {
                return res.status(403).json({ error: 'Tenant context required' });
            }
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const status = await googleCalendarService.getStatus(companyId, userId);
            res.json(status);
        } catch (error) {
            console.error('[Google Calendar Routes] Error getting status:', error);
            res.status(500).json({
                error: 'Failed to get Google Calendar status',
                message: error.message
            });
        }
    });

    /**
     * POST /api/google/connect
     * Start OAuth connection, returns authUrl
     */
    router.post('/connect', authMiddleware, async (req, res) => {
        try {
            const companyId = req.user?.company_id || req.tenantId;
            const userId = req.user?.id;
            if (!companyId || !userId) {
                return res.status(403).json({ error: 'Tenant context required' });
            }

            const authUrl = await googleCalendarService.createAuthUrl(userId, companyId);
            res.json({ authUrl });
        } catch (error) {
            console.error('[Google Calendar Routes] Error connecting:', error);
            res.status(500).json({
                error: 'Failed to connect Google Calendar',
                message: error.message
            });
        }
    });

    /**
     * GET /api/google/callback
     * OAuth callback endpoint
     */
    router.get('/callback', async (req, res) => {
        try {
            const { code, state } = req.query;
            if (!code || !state) {
                return res.status(400).send('Missing code or state');
            }

            await googleCalendarService.handleOAuthCallback(String(code), String(state));

            const successRedirect = process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT;
            if (successRedirect) {
                return res.redirect(successRedirect);
            }

            res.status(200).send('Google Calendar connected. You can close this window.');
        } catch (error) {
            console.error('[Google Calendar Routes] Error in callback:', error);
            const failureRedirect = process.env.GOOGLE_OAUTH_FAILURE_REDIRECT;
            if (failureRedirect) {
                return res.redirect(failureRedirect);
            }
            res.status(500).send('Failed to connect Google Calendar. You can close this window.');
        }
    });

    /**
     * POST /api/google/disconnect
     * Disconnect Google Calendar
     */
    router.post('/disconnect', authMiddleware, async (req, res) => {
        try {
            const companyId = req.user?.company_id || req.tenantId;
            const userId = req.user?.id;
            if (!companyId) {
                return res.status(403).json({ error: 'Tenant context required' });
            }
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const result = await googleCalendarService.disconnect(companyId, userId);
            res.json(result);
        } catch (error) {
            console.error('[Google Calendar Routes] Error disconnecting:', error);
            res.status(500).json({
                error: 'Failed to disconnect Google Calendar',
                message: error.message
            });
        }
    });

    return router;
}

module.exports = createGoogleCalendarRoutes;
