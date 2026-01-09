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

// Configuration constants
const QR_TIMEOUT_MS = 60000;           // 60 seconds - time before QR code flag reset
const KEEPALIVE_INTERVAL_MS = 30000;   // 30 seconds - how often to check connection health
const KEEPALIVE_LOG_INTERVAL_MS = 300000; // 5 minutes - how often to log successful keepalive
const SESSION_RESTORE_DELAY_MS = 1000; // 1 second - delay between session restoration attempts
const SESSION_RESTORE_MAX_RETRIES = 3; // Maximum retries for session restoration

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
                        }, QR_TIMEOUT_MS);
                        
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
                            instance.phoneNumber = phoneNumber; // Store phone number for easy access
                            
                            // Start keepalive mechanism to prevent idle disconnection
                            // Check connection every 30 seconds
                            if (instance.keepaliveInterval) {
                                clearInterval(instance.keepaliveInterval);
                            }
                            instance.keepaliveInterval = setInterval(async () => {
                                try {
                                    // Check if instance is still valid and client exists
                                    // Clean up interval if instance becomes invalid
                                    if (!instance.isReady || !instance.client) {
                                        console.log(`[WhatsApp] ⚠️ Keepalive: Client instance invalid for ${companyId}. Cleaning up.`);
                                        clearInterval(instance.keepaliveInterval);
                                        instance.keepaliveInterval = null;
                                        return;
                                    }
                                    
                                    // Baileys manages connection internally via connection.update events
                                    // We should rely on those events rather than probing socket state
                                    // Only log periodically to confirm keepalive is running
                                    const now = Date.now();
                                    const shouldLog = !instance.lastKeepaliveLog || 
                                                    (now - instance.lastKeepaliveLog) >= KEEPALIVE_LOG_INTERVAL_MS;
                                    if (shouldLog) {
                                        console.log(`[WhatsApp] 💚 Keepalive: Connection active for ${companyId}`);
                                        instance.lastKeepaliveLog = now;
                                    }
                                    
                                    // Reset error counter on successful check
                                    instance.keepaliveErrorCount = 0;
                                } catch (error) {
                                    console.error(`[WhatsApp] Keepalive error for ${companyId}:`, error.message);
                                    
                                    // Track consecutive errors to prevent log spam
                                    instance.keepaliveErrorCount = (instance.keepaliveErrorCount || 0) + 1;
                                    
                                    // Clear interval after 5 consecutive errors to prevent resource waste
                                    if (instance.keepaliveErrorCount >= 5) {
                                        console.error(`[WhatsApp] ⚠️ Keepalive: Too many errors for ${companyId}. Stopping keepalive.`);
                                        clearInterval(instance.keepaliveInterval);
                                        instance.keepaliveInterval = null;
                                    }
                                }
                            }, KEEPALIVE_INTERVAL_MS); // Every 30 seconds
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
                phoneNumber: null,
                keepaliveInterval: null,
                keepaliveErrorCount: 0,
                lastKeepaliveLog: null
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
     * Check if session files exist for a company
     */
    async hasSessionFiles(companyId) {
        try {
            const sessionPath = path.join(this.sessionsPath, `session-${companyId}`);
            const credsPath = path.join(sessionPath, 'creds.json');
            
            // Check if creds.json exists (indicates a saved session)
            try {
                await fs.access(credsPath);
                return true;
            } catch {
                return false;
            }
        } catch (error) {
            console.error(`[WhatsApp] Error checking session files: ${error.message}`);
            return false;
        }
    }

    /**
     * Restore session from disk without user interaction
     * This is called when we have session files but no active client in memory
     * @param {string} companyId - Company ID
     * @param {string} userId - User ID
     * @param {number} retryCount - Current retry attempt (default 0)
     * @returns {Promise<boolean>} - True if restoration started successfully
     */
    async restoreSession(companyId, userId, retryCount = 0) {
        console.log(`[WhatsApp] 🔄 Attempting to restore session for company: ${companyId} (attempt ${retryCount + 1})`);
        
        try {
            // Check if session files exist
            const hasSession = await this.hasSessionFiles(companyId);
            if (!hasSession) {
                console.log(`[WhatsApp] ℹ️ No session files found for company: ${companyId}`);
                return false;
            }

            console.log(`[WhatsApp] ✅ Session files found, restoring connection...`);
            
            // Initialize client with existing session (no forceClean)
            // This will use the saved credentials and should auto-connect
            await this.initializeClient(
                companyId,
                userId,
                null,  // onQRCode - not needed for restore
                null,  // onReady - will be handled by connection.update
                null,  // onMessage - will be handled by messages.upsert
                null,  // onDisconnect
                false, // forceClean = false to keep existing session
                0      // retryCount = 0
            );
            
            console.log(`[WhatsApp] 📡 Session restoration initiated for company: ${companyId}`);
            return true;
        } catch (error) {
            console.error(`[WhatsApp] ❌ Error restoring session for ${companyId}: ${error.message}`);
            
            // Retry logic with exponential backoff
            if (retryCount < SESSION_RESTORE_MAX_RETRIES) {
                const delay = SESSION_RESTORE_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
                console.log(`[WhatsApp] 🔄 Retrying session restore for ${companyId} in ${delay}ms (attempt ${retryCount + 1}/${SESSION_RESTORE_MAX_RETRIES})`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.restoreSession(companyId, userId, retryCount + 1);
            } else {
                console.error(`[WhatsApp] ❌ Max restore attempts reached for ${companyId}. Marking as failed.`);
                
                // Update database to reflect restoration failure
                try {
                    await this.whatsappConnectionRepository.updateStatus(companyId, {
                        is_connected: false
                    });
                } catch (dbError) {
                    console.error(`[WhatsApp] Error updating DB after failed restore: ${dbError.message}`);
                }
                
                return false;
            }
        }
    }

    /**
     * Get client status
     */
    async getStatus(companyId) {
        const instance = this.clients.get(companyId);

        if (!instance) {
            try {
                const connection = await this.whatsappConnectionRepository.findByCompanyId(companyId);
                
                // Check if session files exist on disk
                const hasSession = await this.hasSessionFiles(companyId);
                
                if (hasSession) {
                    console.log(`[WhatsApp] 🔍 Found session files for ${companyId}, attempting restore...`);
                    
                    // Attempt to restore the session
                    const userId = connection?.user_id;
                    if (userId) {
                        // Start restoration asynchronously (don't wait)
                        this.restoreSession(companyId, userId).catch(err => {
                            console.error(`[WhatsApp] Session restore failed: ${err.message}`);
                        });
                        
                        // Return connecting status while restoration happens
                        return {
                            status: 'connecting',
                            is_connected: false,
                            message: 'Restoring connection from saved session...'
                        };
                    }
                }
                
                // If connection shows as connected in DB but no instance and no session files, clean it
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
                // Use stored phone number or extract from Baileys client
                const phoneNumber = instance.phoneNumber || 
                                   instance.client.user?.id?.split(':')[0] || 
                                   instance.client.user?.id;
                return {
                    status: 'connected',
                    is_connected: true,
                    phone_number: phoneNumber
                };
            } catch (error) {
                // If there's any error, still return connected status with stored phone number
                return {
                    status: 'connected',
                    is_connected: true,
                    phone_number: instance.phoneNumber
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

    /**
     * Restore all sessions from disk on server startup
     * This ensures WhatsApp connections persist across server restarts
     */
    async restoreAllSessions() {
        console.log('[WhatsApp] 🔄 Checking for existing sessions to restore...');
        
        try {
            // Ensure sessions directory exists
            await fs.mkdir(this.sessionsPath, { recursive: true });
            
            // Read all session directories
            const entries = await fs.readdir(this.sessionsPath, { withFileTypes: true });
            const sessionDirs = entries.filter(entry => 
                entry.isDirectory() && entry.name.startsWith('session-')
            );
            
            if (sessionDirs.length === 0) {
                console.log('[WhatsApp] ℹ️ No existing sessions found');
                return;
            }
            
            console.log(`[WhatsApp] 📂 Found ${sessionDirs.length} session(s) to restore`);
            
            // Get all connections from database (not just active ones)
            const connections = await this.whatsappConnectionRepository.findAll();
            const connectionMap = new Map(
                connections.map(conn => [conn.company_id, conn])
            );
            
            // Restore each session
            for (const sessionDir of sessionDirs) {
                const companyId = sessionDir.name.replace('session-', '');
                
                try {
                    // Check if creds.json exists
                    const sessionPath = path.join(this.sessionsPath, sessionDir.name);
                    const credsPath = path.join(sessionPath, 'creds.json');
                    
                    await fs.access(credsPath);
                    
                    // Get connection info
                    const connection = connectionMap.get(companyId) || 
                                     await this.whatsappConnectionRepository.findByCompanyId(companyId);
                    
                    if (connection?.user_id) {
                        console.log(`[WhatsApp] 🔄 Restoring session for company: ${companyId}`);
                        
                        // Restore session (don't await - let them connect in background)
                        // Error handling is already built into restoreSession with retry logic
                        this.restoreSession(companyId, connection.user_id).catch(err => {
                            console.error(`[WhatsApp] ⚠️ Failed to restore session for ${companyId}: ${err.message}`);
                            // Error is already logged and DB updated in restoreSession
                        });
                        
                        // Small delay between restorations to avoid overwhelming the system
                        await new Promise(resolve => setTimeout(resolve, SESSION_RESTORE_DELAY_MS));
                    } else {
                        console.log(`[WhatsApp] ⚠️ No connection record found for company: ${companyId}`);
                    }
                } catch (error) {
                    console.error(`[WhatsApp] ⚠️ Error restoring session for ${companyId}: ${error.message}`);
                }
            }
            
            console.log('[WhatsApp] ✅ Session restoration process completed');
        } catch (error) {
            console.error('[WhatsApp] ❌ Error during session restoration:', error.message);
        }
    }
}

module.exports = WhatsAppClientManager;
