/**
 * Visit Routes
 * Presentation layer - HTTP endpoints for visit operations
 */
const express = require('express');
const router = express.Router();
const { generateVisitPDF } = require('../../utils/pdfGenerator');

function createVisitRoutes(visitService) {
    // Get all visits
    router.get('/', async (req, res) => {
        try {
            const visits = await visitService.getAllVisits();
            res.json(visits.map(v => v.toJSON()));
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

    return router;
}

module.exports = createVisitRoutes;
