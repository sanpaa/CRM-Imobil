/**
 * Store Settings Routes
 * Presentation layer - HTTP endpoints for store settings operations
 */
const express = require('express');
const router = express.Router();

function createStoreSettingsRoutes(storeSettingsService, authMiddleware) {
    // Get store settings (public)
    router.get('/', async (req, res) => {
        try {
            const settings = await storeSettingsService.getSettings();
            res.json(settings.toJSON ? settings.toJSON() : settings);
        } catch (error) {
            console.error('Error fetching store settings:', error);
            res.status(500).json({ error: 'Failed to fetch store settings' });
        }
    });

    // Update store settings (requires authentication)
    router.put('/', authMiddleware, async (req, res) => {
        try {
            const settings = await storeSettingsService.updateSettings(req.body);
            res.json(settings.toJSON());
        } catch (error) {
            if (error.message.startsWith('Validation failed')) {
                return res.status(400).json({ error: error.message });
            }
            console.error('Error updating store settings:', error);
            res.status(500).json({ error: 'Failed to update store settings' });
        }
    });

    // Initialize store settings (first-time setup)
    router.post('/initialize', authMiddleware, async (req, res) => {
        try {
            const settings = await storeSettingsService.initializeSettings(req.body);
            res.status(201).json(settings.toJSON());
        } catch (error) {
            if (error.message.startsWith('Validation failed')) {
                return res.status(400).json({ error: error.message });
            }
            console.error('Error initializing store settings:', error);
            res.status(500).json({ error: 'Failed to initialize store settings' });
        }
    });

    return router;
}

module.exports = createStoreSettingsRoutes;
