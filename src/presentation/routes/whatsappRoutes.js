/**
 * WhatsApp Routes
 * Presentation layer - HTTP endpoints for WhatsApp operations
 */

const express = require('express');
const router = express.Router();

function createWhatsappRoutes(whatsappService, authMiddleware) {
    /**
     * POST /api/whatsapp/initialize
     * Initialize WhatsApp connection
     */
    router.post('/initialize', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await whatsappService.initializeConnection(userId, req.user);
            
            res.json(result);
        } catch (error) {
            console.error('[WhatsApp Routes] Error initializing:', error);
            res.status(500).json({ 
                error: 'Failed to initialize WhatsApp',
                message: error.message 
            });
        }
    });

    /**
     * GET /api/whatsapp/status
     * Get WhatsApp connection status
     */
    router.get('/status', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const status = await whatsappService.getConnectionStatus(userId);
            
            res.json(status);
        } catch (error) {
            console.error('[WhatsApp Routes] Error getting status:', error);
            res.status(500).json({ 
                error: 'Failed to get WhatsApp status',
                message: error.message 
            });
        }
    });

    /**
     * POST /api/whatsapp/disconnect
     * Disconnect WhatsApp
     */
    router.post('/disconnect', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await whatsappService.disconnect(userId);
            
            res.json(result);
        } catch (error) {
            console.error('[WhatsApp Routes] Error disconnecting:', error);
            res.status(500).json({ 
                error: 'Failed to disconnect WhatsApp',
                message: error.message 
            });
        }
    });

    /**
     * POST /api/whatsapp/send
     * Send WhatsApp message
     */
    router.post('/send', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const { to, message } = req.body;

            if (!to || !message) {
                return res.status(400).json({ 
                    error: 'Missing required fields',
                    message: 'Fields "to" and "message" are required'
                });
            }

            const result = await whatsappService.sendMessage(userId, to, message);
            
            res.json(result);
        } catch (error) {
            console.error('[WhatsApp Routes] Error sending message:', error);
            res.status(500).json({ 
                error: 'Failed to send WhatsApp message',
                message: error.message 
            });
        }
    });

    /**
     * GET /api/whatsapp/messages
     * Get received messages
     */
    router.get('/messages', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const limit = Math.min(parseInt(req.query.limit) || 50, 100);
            const offset = parseInt(req.query.offset) || 0;

            const messages = await whatsappService.getMessages(userId, limit, offset);
            
            res.json({
                data: messages,
                limit,
                offset
            });
        } catch (error) {
            console.error('[WhatsApp Routes] Error fetching messages:', error);
            res.status(500).json({ 
                error: 'Failed to fetch WhatsApp messages',
                message: error.message 
            });
        }
    });

    /**
     * GET /api/whatsapp/conversation/:phoneNumber
     * Get conversation with specific number
     */
    router.get('/conversation/:phoneNumber', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const phoneNumber = req.params.phoneNumber;
            const limit = Math.min(parseInt(req.query.limit) || 50, 100);

            if (!phoneNumber) {
                return res.status(400).json({ 
                    error: 'Phone number is required'
                });
            }

            const messages = await whatsappService.getConversation(userId, phoneNumber, limit);
            
            res.json({
                phone_number: phoneNumber,
                data: messages
            });
        } catch (error) {
            console.error('[WhatsApp Routes] Error fetching conversation:', error);
            res.status(500).json({ 
                error: 'Failed to fetch conversation',
                message: error.message 
            });
        }
    });

    /**
     * GET /api/whatsapp/auto-clients
     * Get automatically created clients from WhatsApp messages
     */
    router.get('/auto-clients', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.id;
            const autoClients = await whatsappService.getAutoClients(userId);
            
            res.json({
                data: autoClients
            });
        } catch (error) {
            console.error('[WhatsApp Routes] Error fetching auto clients:', error);
            res.status(500).json({ 
                error: 'Failed to fetch auto-created clients',
                message: error.message 
            });
        }
    });

    return router;
}

module.exports = createWhatsappRoutes;
