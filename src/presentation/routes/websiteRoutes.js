/**
 * Website Layouts Routes
 * Handles CRUD operations for website layouts and components
 */

const express = require('express');

function createWebsiteRoutes(websiteService, authMiddleware) {
    const router = express.Router();

    // Get all layouts for a company
    router.get('/layouts', async (req, res) => {
        try {
            const { company_id, page_type } = req.query;
            
            if (!company_id) {
                return res.status(400).json({ error: 'company_id is required' });
            }

            const layouts = await websiteService.getLayouts(company_id, page_type);
            res.json(layouts);
        } catch (error) {
            console.error('Error fetching layouts:', error);
            res.status(500).json({ error: 'Failed to fetch layouts' });
        }
    });

    // Get active layout for a page type (MUST come before /:id route)
    router.get('/layouts/active', async (req, res) => {
        try {
            const { company_id, page_type } = req.query;
            
            if (!company_id || !page_type) {
                return res.status(400).json({ error: 'company_id and page_type are required' });
            }

            const layout = await websiteService.getActiveLayout(company_id, page_type);
            
            if (!layout) {
                return res.status(404).json({ 
                    error: 'Layout not found',
                    message: `No active layout found for company_id=${company_id} and page_type=${page_type}. Make sure a layout exists and is set as active.`
                });
            }

            res.json(layout);
        } catch (error) {
            console.error('Error fetching active layout:', error);
            res.status(500).json({ error: 'Failed to fetch active layout' });
        }
    });

    // Get a specific layout by ID
    router.get('/layouts/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const layout = await websiteService.getLayout(id);
            
            if (!layout) {
                return res.status(404).json({ error: 'Layout not found' });
            }

            res.json(layout);
        } catch (error) {
            console.error('Error fetching layout:', error);
            res.status(500).json({ error: 'Failed to fetch layout' });
        }
    });

    // Create a new layout (requires authentication)
    router.post('/layouts', authMiddleware, async (req, res) => {
        try {
            const layoutData = req.body;
            const layout = await websiteService.createLayout(layoutData);
            res.status(201).json(layout);
        } catch (error) {
            console.error('Error creating layout:', error);
            res.status(500).json({ error: 'Failed to create layout' });
        }
    });

    // Update a layout (requires authentication)
    router.put('/layouts/:id', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const layoutData = req.body;
            const layout = await websiteService.updateLayout(id, layoutData);
            res.json(layout);
        } catch (error) {
            console.error('Error updating layout:', error);
            res.status(500).json({ error: 'Failed to update layout' });
        }
    });

    // Delete a layout (requires authentication)
    router.delete('/layouts/:id', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            await websiteService.deleteLayout(id);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting layout:', error);
            res.status(500).json({ error: 'Failed to delete layout' });
        }
    });

    // Publish a layout (requires authentication)
    router.post('/layouts/:id/publish', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const layout = await websiteService.publishLayout(id);
            res.json(layout);
        } catch (error) {
            console.error('Error publishing layout:', error);
            res.status(500).json({ error: 'Failed to publish layout' });
        }
    });

    return router;
}

module.exports = createWebsiteRoutes;
