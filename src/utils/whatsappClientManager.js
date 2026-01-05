/**
 * WhatsApp Client Manager (Baileys)
 * Utility layer - Manages WhatsApp connections using Baileys
 */

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const path = require('path');
const fs = require('fs').promises;
const QRCode = require('qrcode');

class WhatsAppClientManager {
    constructor(whatsappConnectionRepository) {
        this.clients = new Map();
        this.whatsappConnectionRepository = whatsappConnectionRepository;
        this.sessionsPath = path.join(process.cwd(), 'sessions');
    }

    /**
     * Clean session files for a company
     */
    async cleanSession(companyId) {
        try {
            const sessionPath = path.join(this.sessionsPath, `session-${companyId}`);
            await fs.rm(sessionPath, { recursive: true, force: true });
            console.log(`[WhatsApp] Session cleaned for company: ${companyId}`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`[WhatsApp] Error cleaning session: ${error.message}`);
            }
        }
    }

    /**
     * Initialize WhatsApp client using Baileys
     */
    async initializeClient(companyId, userId, onQRCode, onReady, onMessage, onDisconnect, forceClean = false, retryCount = 0) {
        try {
            const maxRetries = 2;
            console.log(`[WhatsApp] 🚀 Starting Baileys initialization for company: ${companyId} (attempt ${retryCount + 1}/${maxRetries + 1})`);
            
            // Remove existing client
            await this.destroyClient(companyId);

            // Clean session if needed
            if (forceClean || retryCount > 0) {
                console.log(`[WhatsApp] 🧹 Cleaning session for company: ${companyId}`);
                await this.cleanSession(companyId);
            }

            const sessionPath = path.join(this.sessionsPath, `session-${companyId}`);
            
            // Load auth state
            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
            
            // Get latest version
            const { version } = await fetchLatestBaileysVersion();
            
            console.log(`[WhatsApp] 📦 Creating Baileys socket (WA v${version.join('.')})...`);
            
            // Create socket with minimal config
            let sock;
            try {
                sock = makeWASocket({
                    version,
                    auth: state,
                    printQRInTerminal: false,
                    logger: pino({ level: 'silent' }), // Silent logger (economiza CPU)
                    browser: ['CRM Imobil', 'Chrome', '10.0'],
                    getMessage: async () => undefined // Não baixar mensagens antigas
                });
            } catch (socketError) {
                console.error(`[WhatsApp] ❌ Socket creation failed: ${socketError.message}`);
                throw socketError;
            }

            let qrGenerated = false;
            let isReady = false;

            // Credenciais atualizadas (quando o usuário escanear o QR)
            sock.ev.on('creds.update', async () => {
                console.log(`[WhatsApp] 🔐 Credentials updated for company: ${companyId}`);
                await saveCreds();
            });

            // QR Code event
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                console.log(`[WhatsApp] 🔄 Connection update for ${companyId}:`, {
                    connection,
                    hasQR: !!qr,
                    hasDisconnect: !!lastDisconnect,
                    isReady
                });

                // QR Code
                if (qr && !qrGenerated) {
                    qrGenerated = true;
                    console.log(`[WhatsApp] 📱 QR Code generated for company: ${companyId}`);
                    try {
                        const qrCodeDataUrl = await QRCode.toDataURL(qr);
                        const instance = this.clients.get(companyId);
                        if (instance) {
                            instance.qrCode = qrCodeDataUrl;
                        }
                        
                        if (onQRCode) {
                            onQRCode(qrCodeDataUrl);
                        }
                        
                        // QR code expira em 60s, permite regenerar
                        setTimeout(() => {
                            qrGenerated = false;
                            console.log(`[WhatsApp] ⏰ QR expired, can generate new one for company: ${companyId}`);
                        }, 60000);
                    } catch (error) {
                        console.error(`[WhatsApp] Error generating QR: ${error.message}`);
                    }
                } else if (qr && qrGenerated) {
                    console.log(`[WhatsApp] 🔄 New QR code available (previous expired)`);
                }

                // Connection open (ready)
                if (connection === 'open') {
                    // Só marca como conectado se realmente tiver usuário autenticado
                    if (sock.user && !isReady) {
                        isReady = true;
                        qrGenerated = false;
                        console.log(`[WhatsApp] ✅ Connected successfully for company: ${companyId}`);
                        
                        const instance = this.clients.get(companyId);
                        if (instance) {
                            instance.isReady = true;
                            instance.qrCode = null;
                        }

                        // Get phone number
                        const phoneNumber = sock.user.id.split(':')[0];
                        console.log(`[WhatsApp] 📱 Phone: ${phoneNumber}`);
                        
                        await this.whatsappConnectionRepository.updateStatus(companyId, {
                            is_connected: true,
                            phone_number: phoneNumber,
                            last_connected_at: new Date().toISOString()
                        });

                        if (onReady) {
                            onReady(phoneNumber);
                        }
                    } else if (!sock.user) {
                        console.log(`[WhatsApp] ⏳ Socket opened but waiting for authentication...`);
                    } else {
                        console.log(`[WhatsApp] 🔄 Connection refreshed for company: ${companyId}`);
                    }
                }

                // Disconnected
                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    const reason = DisconnectReason[statusCode] || statusCode || 'unknown';
                    
                    console.log(`[WhatsApp] ⚠️ Connection closed for company: ${companyId}, reason: ${reason}, shouldReconnect: ${shouldReconnect}`);
                    
                    await this.whatsappConnectionRepository.updateStatus(companyId, {
                        is_connected: false
                    });

                    if (onDisconnect) {
                        onDisconnect(reason);
                    }

                    // Auto reconnect if not logged out
                    if (shouldReconnect && retryCount < maxRetries) {
                        console.log(`[WhatsApp] 🔄 Auto-reconnecting in 5s...`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        return this.initializeClient(companyId, userId, onQRCode, onReady, onMessage, onDisconnect, false, retryCount + 1);
                    } else if (!shouldReconnect) {
                        console.log(`[WhatsApp] 🚪 Logged out - cleaning session`);
                        await this.cleanSession(companyId);
                    }
                    
                    await this.destroyClient(companyId);
                }
            });

            // Tratamento de erros globais
            sock.ev.on('call', async (callEvent) => {
                console.log(`[WhatsApp] 📞 Call event:`, callEvent);
            });

            // Save credentials on update
            sock.ev.on('creds.update', saveCreds);

            // Messages
            sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify') return;
                
                for (const msg of messages) {
                    if (!msg.message || msg.key.fromMe) continue;
                    
                    // Convert to whatsapp-web.js format for compatibility
                    const message = {
                        from: msg.key.remoteJid,
                        body: msg.message.conversation || 
                              msg.message.extendedTextMessage?.text || 
                              '',
                        timestamp: msg.messageTimestamp,
                        id: { _serialized: msg.key.id },
                        fromMe: msg.key.fromMe,
                        isGroup: msg.key.remoteJid?.endsWith('@g.us') || false
                    };

                    if (onMessage) {
                        onMessage(message);
                    }
                }
            });

            // Store instance
            this.clients.set(companyId, { 
                client: sock, 
                isReady: false, 
                companyId, 
                userId,
                qrCode: null 
            });
            
            console.log(`[WhatsApp] 🎯 Baileys client initialized (waiting for connection...)`);

            return true;
        } catch (error) {
            console.error(`[WhatsApp] ❌ Error initializing Baileys:`, error.message);
            
            const maxRetries = 2;
            if (retryCount < maxRetries) {
                console.log(`[WhatsApp] 🔄 Retrying in 5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                return this.initializeClient(companyId, userId, onQRCode, onReady, onMessage, onDisconnect, false, retryCount + 1);
            }
            
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
     * Send message via WhatsApp (Baileys)
     */
    async sendMessage(companyId, to, message) {
        const instance = this.clients.get(companyId);
        
        if (!instance || !instance.isReady) {
            throw new Error('WhatsApp is not connected for this company');
        }

        try {
            // Format phone number for Baileys
            const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
            
            await instance.client.sendMessage(jid, { text: message });
            console.log(`[WhatsApp] ✅ Message sent to ${to} for company: ${companyId}`);
            
            return { success: true };
        } catch (error) {
            console.error(`[WhatsApp] ❌ Error sending message: ${error.message}`);
            throw error;
        }
    }

    /**
     * Destroy client and cleanup (Baileys)
     */
    async destroyClient(companyId) {
        const instance = this.clients.get(companyId);
        
        if (instance) {
            try {
                // Baileys doesn't have destroy, just close connection
                if (instance.client) {
                    instance.client.end();
                }
                console.log(`[WhatsApp] ✅ Client closed for company: ${companyId}`);
            } catch (error) {
                console.error(`[WhatsApp] ❌ Error closing client: ${error.message}`);
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
