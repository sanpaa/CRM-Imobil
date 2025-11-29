/**
 * Property Routes
 * Presentation layer - HTTP endpoints for property operations
 */
const express = require('express');
const router = express.Router();

function createPropertyRoutes(propertyService) {
    // Get all properties
    router.get('/', async (req, res) => {
        try {
            const properties = await propertyService.getAllProperties();
            res.json(properties.map(p => p.toJSON()));
        } catch (error) {
            console.error('Error fetching properties:', error);
            res.status(500).json({ error: 'Failed to fetch properties' });
        }
    });

    // Get property statistics
    router.get('/stats', async (req, res) => {
        try {
            const stats = await propertyService.getStats();
            res.json(stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    });

    // Get single property
    router.get('/:id', async (req, res) => {
        try {
            const property = await propertyService.getPropertyById(req.params.id);
            res.json(property.toJSON());
        } catch (error) {
            if (error.message === 'Property not found') {
                return res.status(404).json({ error: 'Property not found' });
            }
            console.error('Error fetching property:', error);
            res.status(500).json({ error: 'Failed to fetch property' });
        }
    });

    // Create new property
    router.post('/', async (req, res) => {
        try {
            const property = await propertyService.createProperty(req.body);
            res.status(201).json(property.toJSON());
        } catch (error) {
            if (error.message.startsWith('Validation failed')) {
                return res.status(400).json({ error: error.message });
            }
            console.error('Error creating property:', error);
            res.status(500).json({ error: 'Failed to create property' });
        }
    });

    // Update property
    router.put('/:id', async (req, res) => {
        try {
            const property = await propertyService.updateProperty(req.params.id, req.body);
            res.json(property.toJSON());
        } catch (error) {
            if (error.message === 'Property not found') {
                return res.status(404).json({ error: 'Property not found' });
            }
            console.error('Error updating property:', error);
            res.status(500).json({ error: 'Failed to update property' });
        }
    });

    // Delete property
    router.delete('/:id', async (req, res) => {
        try {
            await propertyService.deleteProperty(req.params.id);
            res.json({ message: 'Property deleted successfully' });
        } catch (error) {
            if (error.message === 'Property not found') {
                return res.status(404).json({ error: 'Property not found' });
            }
            console.error('Error deleting property:', error);
            res.status(500).json({ error: 'Failed to delete property' });
        }
    });

    return router;
}

module.exports = createPropertyRoutes;
