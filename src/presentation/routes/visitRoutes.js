/**
 * Visit Routes
 * Presentation layer - HTTP endpoints for visit operations
 */
const express = require('express');
const router = express.Router();
const { generateVisitPDF } = require('../../utils/pdfGenerator');
const { getTenantId } = require('../middleware/tenantMiddleware');

function createVisitRoutes(visitService, googleCalendarService, authMiddleware) {
    // Get all visits with pagination and filters
    router.get('/', async (req, res) => {
        try {
            // If no pagination parameters, return all visits
            if (!req.query.page && !req.query.limit) {
                const visits = await visitService.getAllVisits();
                return res.json(visits.map(v => v.toJSON()));
            }

            // Otherwise, use pagination with filters
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20;

            const filters = {
                searchText: req.query.search || '',
                status: req.query.status || '',
                dateFrom: req.query.dateFrom || '',
                dateTo: req.query.dateTo || '',
                client: req.query.client || '',
                propertyCode: req.query.propertyCode || '',
                broker: req.query.broker || '',
                owner: req.query.owner || '',
                imobiliaria: req.query.imobiliaria || '',
            };

            const result = await visitService.getPaginated(filters, page, limit);
            
            // Map entities to JSON
            result.data = result.data.map(v => v.toJSON());
            
            res.json(result);
        } catch (error) {
            console.error('Error fetching visits:', error);
            res.status(500).json({ error: 'Failed to fetch visits' });
        }
    });

    // Get single visit
    router.get('/:id', async (req, res) => {
        try {
            const visit = await visitService.getVisitById(req.params.id);
            res.json(visit.toJSON());
        } catch (error) {
            if (error.message === 'Visit not found') {
                return res.status(404).json({ error: 'Visit not found' });
            }
            console.error('Error fetching visit:', error);
            res.status(500).json({ error: 'Failed to fetch visit' });
        }
    });

    // Create new visit
    router.post('/', async (req, res) => {
        try {
            const visit = await visitService.createVisit(req.body);
            if (!visit) {
                return res.status(503).json({ 
                    error: 'Database not available. Visit cannot be created in offline mode. Please configure SUPABASE_URL and SUPABASE_KEY environment variables.',
                    details: 'O banco de dados Supabase não está configurado. Configure as variáveis de ambiente para habilitar criação de visitas.',
                    documentation: 'Veja DATABASE_SETUP.md para instruções completas.'
                });
            }
            res.status(201).json(visit.toJSON());
        } catch (error) {
            if (error.message.startsWith('Validation failed')) {
                return res.status(400).json({ error: error.message });
            }
            console.error('Error creating visit:', error);
            res.status(500).json({ error: 'Failed to create visit' });
        }
    });

    // Update visit
    router.put('/:id', async (req, res) => {
        try {
            const visit = await visitService.updateVisit(req.params.id, req.body);
            if (!visit) {
                return res.status(503).json({ 
                    error: 'Database not available. Visit cannot be updated in offline mode. Please configure SUPABASE_URL and SUPABASE_KEY environment variables.',
                    details: 'O banco de dados Supabase não está configurado. Configure as variáveis de ambiente para habilitar atualização de visitas.',
                    documentation: 'Veja DATABASE_SETUP.md para instruções completas.'
                });
            }
            res.json(visit.toJSON());
        } catch (error) {
            if (error.message === 'Visit not found') {
                return res.status(404).json({ error: 'Visit not found' });
            }
            if (error.message.startsWith('Validation failed')) {
                return res.status(400).json({ error: error.message });
            }
            console.error('Error updating visit:', error);
            res.status(500).json({ error: 'Failed to update visit' });
        }
    });

    // Delete visit
    router.delete('/:id', async (req, res) => {
        try {
            await visitService.deleteVisit(req.params.id);
            res.json({ message: 'Visit deleted successfully' });
        } catch (error) {
            if (error.message === 'Visit not found') {
                return res.status(404).json({ error: 'Visit not found' });
            }
            console.error('Error deleting visit:', error);
            res.status(500).json({ error: 'Failed to delete visit' });
        }
    });

    // Generate PDF for a visit
    router.post('/:id/generate-pdf', async (req, res) => {
        try {
            const visit = await visitService.getVisitById(req.params.id);
            const visitData = visit.toJSON();
            
            // Generate PDF
            const pdfBuffer = await generateVisitPDF(visitData);
            
            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="roteiro-visita-${req.params.id}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            
            // Send PDF
            res.send(pdfBuffer);
        } catch (error) {
            if (error.message === 'Visit not found') {
                return res.status(404).json({ error: 'Visit not found' });
            }
            console.error('Error generating PDF:', error);
            res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
        }
    });

    // Generate PDF from POST data (without saving to database)
    router.post('/generate-pdf-direct', async (req, res) => {
        try {
            const visitData = req.body;
            
            // Validate required fields
            if (!visitData.dataVisita || !visitData.horaVisita) {
                return res.status(400).json({ 
                    error: 'Missing required fields: dataVisita and horaVisita are required' 
                });
            }
            
            // Generate PDF
            const pdfBuffer = await generateVisitPDF(visitData);
            
            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="roteiro-visita.pdf"');
            res.setHeader('Content-Length', pdfBuffer.length);
            
            // Send PDF
            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
        }
    });

    // Sync visit to Google Calendar
    const syncHandlers = [];
    if (authMiddleware) {
        syncHandlers.push(authMiddleware);
    }
    syncHandlers.push(async (req, res) => {
        try {
            if (!googleCalendarService) {
                return res.status(500).json({ error: 'Google Calendar integration not configured' });
            }

            const companyId = getTenantId(req);
            const userId = req.user?.id;
            if (!companyId) {
                return res.status(403).json({ error: 'Tenant context required' });
            }
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const visit = await visitService.getVisitById(req.params.id);
            const options = {
                title: req.body?.title,
                details: req.body?.details,
                start: req.body?.start,
                end: req.body?.end,
                timezone: req.body?.timezone,
                durationMinutes: req.body?.durationMinutes,
                calendarId: req.body?.calendarId
            };

            const result = await googleCalendarService.syncVisit(companyId, userId, visit.toJSON(), options);
            res.json({ success: true, ...result });
        } catch (error) {
            if (error.message === 'Visit not found') {
                return res.status(404).json({ error: 'Visit not found' });
            }
            console.error('Error syncing visit:', error);
            res.status(500).json({ error: 'Failed to sync visit', message: error.message });
        }
    });
    router.post('/:id/sync', ...syncHandlers);

    return router;
}

module.exports = createVisitRoutes;
