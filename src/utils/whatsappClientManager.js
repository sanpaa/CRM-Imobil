/**
 * WhatsApp Client Manager
 * Utility layer - Manages WhatsApp Web client instances
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');

class WhatsAppClientManager {
    constructor(whatsappConnectionRepository) {
        this.clients = new Map();
        this.whatsappConnectionRepository = whatsappConnectionRepository;
        this.sessionsPath = path.join(process.cwd(), 'sessions');
    }

    /**
     * Initialize WhatsApp client for a company
     */
    async initializeClient(companyId, userId, onQRCode, onReady, onMessage, onDisconnect) {
        try {
            // Remove existing client if present
            await this.destroyClient(companyId);

            const clientInstance = new Client({
                authStrategy: new LocalAuth({ 
                    clientId: companyId,
                    dataPath: this.sessionsPath
                }),
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                }
            });

            // QR Code event
            clientInstance.on('qr', async (qr) => {
                console.log(`[WhatsApp] QR Code generated for company: ${companyId}`);
                try {
                    const qrCodeDataUrl = await QRCode.toDataURL(qr);
                    this.clients.set(companyId, { client: clientInstance, qrCode: qrCodeDataUrl, isReady: false, companyId, userId });
                    
                    if (onQRCode) {
                        onQRCode(qrCodeDataUrl);
                    }
                } catch (error) {
                    console.error(`[WhatsApp] Error generating QR code: ${error.message}`);
                }
            });

            // Ready event
            clientInstance.on('ready', async () => {
                console.log(`[WhatsApp] Client ready for company: ${companyId}`);
                try {
                    const instance = this.clients.get(companyId);
                    if (instance) {
                        instance.isReady = true;
                        instance.qrCode = null;

                        const info = clientInstance.info;
                        const phoneNumber = info.wid.user;

                        await this.whatsappConnectionRepository.updateStatus(companyId, {
                            is_connected: true,
                            phone_number: phoneNumber,
                            last_connected_at: new Date().toISOString()
                        });

                        if (onReady) {
                            onReady(phoneNumber);
                        }
                    }
                } catch (error) {
                    console.error(`[WhatsApp] Error on ready event: ${error.message}`);
                }
            });

            // Authenticated event
            clientInstance.on('authenticated', async () => {
                console.log(`[WhatsApp] Client authenticated for company: ${companyId}`);
            });

            // Auth failure event
            clientInstance.on('auth_failure', async (msg) => {
                console.error(`[WhatsApp] Authentication failed for company: ${companyId} - ${msg}`);
                await this.destroyClient(companyId);
            });

            // Disconnected event
            clientInstance.on('disconnected', async (reason) => {
                console.log(`[WhatsApp] Client disconnected for company: ${companyId} - Reason: ${reason}`);
                
                try {
                    await this.whatsappConnectionRepository.updateStatus(companyId, {
                        is_connected: false
                    });

                    if (onDisconnect) {
                        onDisconnect(reason);
                    }
                } catch (error) {
                    console.error(`[WhatsApp] Error updating disconnect status: ${error.message}`);
                }

                await this.destroyClient(companyId);
            });

            // Message event
            clientInstance.on('message', async (message) => {
                if (onMessage) {
                    onMessage(message);
                }
            });

            // Store instance reference
            this.clients.set(companyId, { client: clientInstance, isReady: false, companyId, userId });
            
            // Initialize client
            await clientInstance.initialize();
            console.log(`[WhatsApp] Initialization started for company: ${companyId}`);

            return true;
        } catch (error) {
            console.error(`[WhatsApp] Error initializing client: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get active client for company
     */
    getClient(companyId) {
        const instance = this.clients.get(companyId);
        return instance?.isReady ? instance.client : null;
    }

    /**
     * Get client status
     */
    async getStatus(companyId) {
        const instance = this.clients.get(companyId);

        if (!instance) {
            try {
                const connection = await this.whatsappConnectionRepository.findByCompanyId(companyId);
                
                // Se há conexão no banco mas não em memória, limpar o banco
                if (connection?.is_connected) {
                    console.log(`[WhatsApp] Limpando conexão fantasma para company: ${companyId}`);
                    await this.whatsappConnectionRepository.updateStatus(companyId, {
                        is_connected: false
                    });
                }

                return {
                    status: 'disconnected',
                    is_connected: false,
                    message: 'Not connected. Click "Connect WhatsApp" to start.'
                };
            } catch (error) {
                return {
                    status: 'error',
                    is_connected: false,
                    message: error.message
                };
            }
        }

        if (instance.isReady) {
            try {
                const phoneNumber = instance.client.info?.wid.user;
                return {
                    status: 'connected',
                    is_connected: true,
                    phone_number: phoneNumber
                };
            } catch (error) {
                return {
                    status: 'connected',
                    is_connected: true
                };
            }
        }

        if (instance.qrCode) {
            return {
                status: 'qr_ready',
                is_connected: false,
                qr_code: instance.qrCode
            };
        }

        return {
            status: 'connecting',
            is_connected: false,
            message: 'Waiting for QR code...'
        };
    }

    /**
     * Send message via WhatsApp
     */
    async sendMessage(companyId, to, message) {
        const client = this.getClient(companyId);
        
        if (!client) {
            throw new Error('WhatsApp is not connected for this company');
        }

        try {
            // Format phone number for WhatsApp
            const chatId = to.includes('@') ? to : `${to}@c.us`;
            
            const result = await client.sendMessage(chatId, message);
            console.log(`[WhatsApp] Message sent to ${to} for company: ${companyId}`);
            
            return result;
        } catch (error) {
            console.error(`[WhatsApp] Error sending message: ${error.message}`);
            throw error;
        }
    }

    /**
     * Destroy client and cleanup
     */
    async destroyClient(companyId) {
        const instance = this.clients.get(companyId);
        
        if (instance) {
            try {
                await instance.client.destroy();
                console.log(`[WhatsApp] Client destroyed for company: ${companyId}`);
            } catch (error) {
                console.error(`[WhatsApp] Error destroying client: ${error.message}`);
            }
            
            this.clients.delete(companyId);
        }
    }

    /**
     * Destroy all clients
     */
    async destroyAll() {
        const promises = Array.from(this.clients.keys()).map(companyId => 
            this.destroyClient(companyId)
        );
        
        await Promise.all(promises);
        console.log('[WhatsApp] All clients destroyed');
    }

    /**
     * Get all active clients
     */
    getActiveClients() {
        const active = [];
        this.clients.forEach((instance, companyId) => {
            if (instance.isReady) {
                active.push(companyId);
            }
        });
        return active;
    }
}

module.exports = WhatsAppClientManager;
