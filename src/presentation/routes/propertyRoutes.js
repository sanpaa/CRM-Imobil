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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;

        const filters = {
        searchText: req.query.search || '',
        city: req.query.city || '',
        type: req.query.type || '',
        priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
        priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
        bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
        };

        const result = await propertyService.getPaginated(filters, page, limit);

        res.json(result);
    } catch (error) {
        console.error(error);
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
            if (!property) {
                return res.status(503).json({ 
                    error: 'Database not available. Property cannot be created in offline mode. Please configure SUPABASE_URL and SUPABASE_KEY environment variables.',
                    details: 'O banco de dados Supabase não está configurado. Configure as variáveis de ambiente para habilitar criação de imóveis.',
                    documentation: 'Veja DATABASE_SETUP.md (local) ou DEPLOY_RENDER.md (Render) para instruções completas.'
                });
            }
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
            if (!property) {
                return res.status(503).json({ 
                    error: 'Database not available. Property cannot be updated in offline mode. Please configure SUPABASE_URL and SUPABASE_KEY environment variables.',
                    details: 'O banco de dados Supabase não está configurado. Configure as variáveis de ambiente para habilitar atualização de imóveis.',
                    documentation: 'Veja DATABASE_SETUP.md (local) ou DEPLOY_RENDER.md (Render) para instruções completas.'
                });
            }
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
