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

            // Clean session only when explicitly requested (avoid wiping auth on auto-retry)
            if (forceClean) {
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
            let qrTimeout = null;

            // QR Code event
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr, isOnline } = update;
                
                console.log(`[WhatsApp] 🔄 Connection update for ${companyId}:`, { 
                    connection, 
                    hasQR: !!qr,
                    isOnline,
                    statusCode: lastDisconnect?.error?.output?.statusCode
                });

                // QR Code - mostrar apenas na primeira vez
                if (qr && !qrGenerated) {
                    qrGenerated = true;
                    console.log(`[WhatsApp] 📱 QR Code generated for company: ${companyId}`);
                    
                    // Limpar timeout anterior se existir
                    if (qrTimeout) clearTimeout(qrTimeout);
                    
                    try {
                        const qrCodeDataUrl = await QRCode.toDataURL(qr);
                        const instance = this.clients.get(companyId);
                        if (instance) {
                            instance.qrCode = qrCodeDataUrl;
                        }
                        
                        if (onQRCode) {
                            onQRCode(qrCodeDataUrl);
                        }
                        
                        // QR válido por 60 segundos antes de solicitar novo QR do WhatsApp
                        // Não desconectamos, apenas resetamos o flag para gerar novo QR quando WhatsApp enviar
                        qrTimeout = setTimeout(() => {
                            console.log(`[WhatsApp] ⏰ QR timeout - aguardando novo QR do WhatsApp`);
                            qrGenerated = false;
                            // NÃO desconectar aqui - deixar o WhatsApp gerenciar o ciclo de QR
                        }, 60000);
                        
                    } catch (error) {
                        console.error(`[WhatsApp] Error generating QR: ${error.message}`);
                    }
                }

                // Connection connecting - mantém aguardando scan
                if (connection === 'connecting') {
                    console.log(`[WhatsApp] ⏳ Socket connecting... esperando scan do QR para ${companyId}`);
                }

                // Connection open (ready)
                if (connection === 'open' && !isReady) {
                    try {
                        // Limpar timeout do QR
                        if (qrTimeout) clearTimeout(qrTimeout);
                        
                        isReady = true;
                        qrGenerated = false;
                        
                        const phoneNumber = sock.user?.id?.split(':')[0] || 'unknown';
                        console.log(`[WhatsApp] ✅ Connected successfully! Phone: ${phoneNumber}`);
                        
                        const instance = this.clients.get(companyId);
                        if (instance) {
                            instance.isReady = true;
                            instance.qrCode = null;
                            
                            // Start keepalive mechanism to prevent idle disconnection
                            // Check connection every 30 seconds
                            if (instance.keepaliveInterval) {
                                clearInterval(instance.keepaliveInterval);
                            }
                            instance.keepaliveInterval = setInterval(async () => {
                                try {
                                    // Simple check - just verify socket is still connected
                                    if (sock && sock.ws && sock.ws.readyState === 1) {
                                        console.log(`[WhatsApp] 💚 Keepalive: Connection active for ${companyId}`);
                                    } else {
                                        console.log(`[WhatsApp] ⚠️ Keepalive: Socket appears disconnected for ${companyId}`);
                                        clearInterval(instance.keepaliveInterval);
                                    }
                                } catch (error) {
                                    console.error(`[WhatsApp] Keepalive error for ${companyId}:`, error.message);
                                }
                            }, 30000); // Every 30 seconds
                        }
                        
                        if (phoneNumber !== 'unknown') {
                            await this.whatsappConnectionRepository.updateStatus(companyId, {
                                is_connected: true,
                                phone_number: phoneNumber,
                                last_connected_at: new Date().toISOString()
                            });
                        }

                        if (onReady) {
                            onReady(phoneNumber);
                        }
                    } catch (error) {
                        console.error(`[WhatsApp] ❌ Error on connection open:`, error);
                        console.error(`[WhatsApp] Stack:`, error.stack);
                        isReady = false;
                    }
                }

                // Disconnected
                if (connection === 'close') {
                    // Limpar timeout
                    if (qrTimeout) clearTimeout(qrTimeout);
                    
                    // Limpar keepalive interval
                    const instance = this.clients.get(companyId);
                    if (instance?.keepaliveInterval) {
                        clearInterval(instance.keepaliveInterval);
                        instance.keepaliveInterval = null;
                    }
                    
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const reason = DisconnectReason[statusCode] || statusCode || 'unknown';
                    
                    console.log(`[WhatsApp] ⚠️ Disconnected (reason: ${reason}, code: ${statusCode})`);
                    
                    // Determine if we should reconnect based on disconnect reason
                    // Only reconnect for transient issues, not for deliberate logouts
                    const doNotReconnectReasons = [
                        DisconnectReason.loggedOut,           // 401 - User manually logged out
                        DisconnectReason.connectionReplaced,  // 412 - Logged in from another device
                        DisconnectReason.badSession          // 440 - Invalid session, needs re-auth
                    ];
                    
                    const shouldReconnect = !doNotReconnectReasons.includes(statusCode);
                    
                    isReady = false;
                    qrGenerated = false;
                    
                    try {
                        await this.whatsappConnectionRepository.updateStatus(companyId, {
                            is_connected: false
                        });
                    } catch (dbError) {
                        console.error(`[WhatsApp] Error updating DB on disconnect:`, dbError.message);
                    }

                    if (onDisconnect) {
                        onDisconnect(reason);
                    }

                    // Auto reconnect for transient issues (network problems, timeouts, etc.)
                    if (shouldReconnect && retryCount < maxRetries) {
                        console.log(`[WhatsApp] 🔄 Transient disconnect detected. Auto-reconnecting in 5s... (attempt ${retryCount + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        return this.initializeClient(companyId, userId, onQRCode, onReady, onMessage, onDisconnect, false, retryCount + 1);
                    } else if (!shouldReconnect) {
                        console.log(`[WhatsApp] 🚪 User-initiated disconnect (${reason}). Cleaning session for re-authentication.`);
                        try {
                            await this.cleanSession(companyId);
                        } catch (cleanError) {
                            console.error(`[WhatsApp] Error cleaning session:`, cleanError.message);
                        }
                    } else {
                        console.log(`[WhatsApp] ❌ Max reconnection attempts reached. Manual reconnection required.`);
                    }
                    
                    await this.destroyClient(companyId);
                }
            });

            // Tratamento de erros globais
            sock.ev.on('call', async (callEvent) => {
                console.log(`[WhatsApp] 📞 Call event:`, callEvent);
            });

            // Save credentials on update - CRITICAL: este evento dispara quando o usuário escaneia o QR
            sock.ev.on('creds.update', async () => {
                console.log(`[WhatsApp] 🔐 Credentials updated for ${companyId} - QR was likely scanned!`);
                try {
                    await saveCreds();
                } catch (error) {
                    console.error(`[WhatsApp] Error saving credentials:`, error.message);
                }
            });

            // Messages
            sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify') return;
                
                for (const msg of messages) {
                    if (!msg.message || msg.key.fromMe) continue;
                    
                    const remoteJid = msg.key.remoteJid || '';
                    const fromNumber = remoteJid.split('@')[0] || 'unknown';
                    const toNumber = sock?.user?.id?.split(':')[0] || sock?.user?.id || null;
                    const pushName = msg.pushName || msg.participant || fromNumber;
                    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                    const timestamp = msg.messageTimestamp || Math.floor(Date.now() / 1000);
                    const isGroup = remoteJid.endsWith('@g.us');

                    const normalizedMessage = {
                        id: { _serialized: msg.key.id },
                        body,
                        from: remoteJid,
                        fromNumber,
                        to: toNumber,
                        pushName,
                        timestamp,
                        fromMe: msg.key.fromMe,
                        isGroup,
                        remoteJid
                    };

                    if (onMessage) {
                        onMessage(normalizedMessage);
                    }
                }
            });

            // Event: Socket status (para debug)
            sock.ev.on('connection.status', (status) => {
                console.log(`[WhatsApp] 🔌 Connection status update for ${companyId}:`, status);
            });

            // Store instance
            this.clients.set(companyId, { 
                client: sock, 
                isReady: false, 
                companyId, 
                userId,
                qrCode: null,
                keepaliveInterval: null
            });
            
            console.log(`[WhatsApp] 🎯 Baileys client initialized (waiting for connection...)`);
            
            // Pequeno delay para garantir que todos os listeners estão ativos
            await new Promise(resolve => setTimeout(resolve, 500));

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
                // Clear keepalive interval
                if (instance.keepaliveInterval) {
                    clearInterval(instance.keepaliveInterval);
                    instance.keepaliveInterval = null;
                }
                
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
