/**
 * Client Routes
 * Presentation layer - HTTP endpoints for client/lead operations
 */
const express = require('express');
const router = express.Router();

function createClientRoutes(clientService) {
    // Get all clients with pagination and filters
    router.get('/', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const filters = {
                searchText: req.query.search || '',
                companyId: req.query.companyId || '',
                name: req.query.name || '',
                email: req.query.email || '',
                phone: req.query.phone || '',
                createdAfter: req.query.createdAfter || '',
                createdBefore: req.query.createdBefore || '',
            };

            const result = await clientService.getPaginated(filters, page, limit);
            res.json(result);
        } catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({ error: 'Failed to fetch clients' });
        }
    });

    // Get single client
    router.get('/:id', async (req, res) => {
        try {
            const client = await clientService.getClientById(req.params.id);
            res.json(client);
        } catch (error) {
            if (error.message === 'Client not found') {
                return res.status(404).json({ error: 'Client not found' });
            }
            console.error('Error fetching client:', error);
            res.status(500).json({ error: 'Failed to fetch client' });
        }
    });

    // Create new client
    router.post('/', async (req, res) => {
        try {
            const client = await clientService.createClient(req.body);
            if (!client) {
                return res.status(503).json({ 
                    error: 'Database not available. Client cannot be created in offline mode.',
                    details: 'O banco de dados Supabase não está configurado.'
                });
            }
            res.status(201).json(client);
        } catch (error) {
            console.error('Error creating client:', error);
            res.status(500).json({ error: 'Failed to create client' });
        }
    });

    // Update client
    router.put('/:id', async (req, res) => {
        try {
            const client = await clientService.updateClient(req.params.id, req.body);
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }
            res.json(client);
        } catch (error) {
            if (error.message === 'Client not found') {
                return res.status(404).json({ error: 'Client not found' });
            }
            console.error('Error updating client:', error);
            res.status(500).json({ error: 'Failed to update client' });
        }
    });

    // Delete client
    router.delete('/:id', async (req, res) => {
        try {
            await clientService.deleteClient(req.params.id);
            res.json({ message: 'Client deleted successfully' });
        } catch (error) {
            if (error.message === 'Client not found') {
                return res.status(404).json({ error: 'Client not found' });
            }
            console.error('Error deleting client:', error);
            res.status(500).json({ error: 'Failed to delete client' });
        }
    });

    return router;
}

module.exports = createClientRoutes;
