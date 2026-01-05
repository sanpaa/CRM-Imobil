/**
 * WhatsApp Service
 * Application layer - Business logic for WhatsApp operations
 */

class WhatsAppService {
    constructor(
        whatsappClientManager,
        whatsappConnectionRepository,
        whatsappMessageRepository,
        whatsappAutoClientRepository,
        userRepository,
        clientRepository
    ) {
        this.whatsappClientManager = whatsappClientManager;
        this.whatsappConnectionRepository = whatsappConnectionRepository;
        this.whatsappMessageRepository = whatsappMessageRepository;
        this.whatsappAutoClientRepository = whatsappAutoClientRepository;
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
    }

    /**
     * Initialize WhatsApp connection for a company
     */
    async initializeConnection(userId, userData = null) {
        try {
            // If userData is provided (from middleware), use it directly
            // Otherwise try to fetch from database
            let user = userData;
            
            if (!user) {
                user = await this.userRepository.findById(userId);
            }
            
            if (!user || !user.company_id) {
                throw new Error('User or company not found');
            }

            const companyId = user.company_id;

            // Create connection record
            await this.whatsappConnectionRepository.upsert(companyId, userId, {
                is_connected: false
            });

            // Create a promise to wait for QR code generation
            const qrCodePromise = new Promise((resolve) => {
                // Set a timeout to resolve after 30 seconds even if QR code is not generated
                const timeout = setTimeout(() => {
                    resolve(null);
                }, 30000);

                // Initialize client with event callbacks
                this.whatsappClientManager.initializeClient(
                    companyId,
                    userId,
                    // onQRCode callback
                    async (qrCode) => {
                        try {
                            await this.whatsappConnectionRepository.updateStatus(companyId, {
                                is_connected: false
                            });
                            clearTimeout(timeout);
                            resolve(qrCode);
                        } catch (error) {
                            console.error(`[WhatsAppService] Error updating QR code status: ${error.message}`);
                            clearTimeout(timeout);
                            resolve(null);
                        }
                    },
                    // onReady callback
                    async (phoneNumber) => {
                        try {
                            await this.whatsappConnectionRepository.updateStatus(companyId, {
                                is_connected: true,
                                phone_number: phoneNumber,
                                last_connected_at: new Date().toISOString()
                            });
                        } catch (error) {
                            console.error(`[WhatsAppService] Error updating ready status: ${error.message}`);
                        }
                    },
                    // onMessage callback
                    async (message) => {
                        try {
                            await this.handleIncomingMessage(message, companyId);
                        } catch (error) {
                            console.error(`[WhatsAppService] Error handling message: ${error.message}`);
                        }
                    },
                    // onDisconnect callback
                    async (reason) => {
                        try {
                            await this.whatsappConnectionRepository.updateStatus(companyId, {
                                is_connected: false
                            });
                        } catch (error) {
                            console.error(`[WhatsAppService] Error updating disconnect status: ${error.message}`);
                        }
                    }
                );
            });

            // Wait for QR code to be generated
            const qrCode = await qrCodePromise;

            if (qrCode) {
                return {
                    message: 'WhatsApp initialization started. Please scan the QR code.',
                    status: 'qr_ready',
                    qr_code: qrCode
                };
            } else {
                return {
                    message: 'WhatsApp initialization started. Please scan the QR code.',
                    status: 'connecting'
                };
            }
        } catch (error) {
            console.error(`[WhatsAppService] Error initializing connection: ${error.message}`);
            throw error;
        }
    }

    /**
     * Handle incoming message
     */
    async handleIncomingMessage(message, companyId) {
        try {
            // Ignore group messages and messages from me
            if (message.isGroup || message.fromMe) {
                return;
            }

            // Get connection
            const connection = await this.whatsappConnectionRepository.findByCompanyId(companyId);
            if (!connection) {
                console.warn(`[WhatsAppService] No connection found for company: ${companyId}`);
                return;
            }

            // Get contact info
            const contact = await message.getContact();
            const fromNumber = contact.id.user;
            const contactName = contact.pushname || contact.name || fromNumber;

            // Save message
            await this.whatsappMessageRepository.saveMessage({
                connection_id: connection.id,
                company_id: companyId,
                from_number: fromNumber,
                to_number: message.to,
                body: message.body,
                message_id: message.id._serialized,
                is_group: message.isGroup,
                is_from_me: message.fromMe,
                contact_name: contactName,
                timestamp: new Date(message.timestamp * 1000).toISOString()
            });

            console.log(`[WhatsAppService] Message saved from ${fromNumber} for company: ${companyId}`);

            // Check if client already exists
            const existingClient = await this.clientRepository.findByPhoneNumber(companyId, fromNumber);

            // Create client automatically if doesn't exist
            if (!existingClient) {
                await this.createClientFromWhatsApp(
                    companyId,
                    connection.id,
                    contactName,
                    fromNumber
                );
            }
        } catch (error) {
            console.error(`[WhatsAppService] Error processing message: ${error.message}`);
        }
    }

    /**
     * Create client automatically from WhatsApp message
     */
    async createClientFromWhatsApp(companyId, connectionId, clientName, phoneNumber) {
        try {
            console.log(`[WhatsAppService] Creating client automatically: ${clientName} (${phoneNumber})`);

            // Create client
            const newClient = await this.clientRepository.create({
                company_id: companyId,
                name: clientName,
                phone: phoneNumber,
                email: null,
                source: 'whatsapp',
                status: 'lead',
                notes: `Cliente criado automaticamente via WhatsApp em ${new Date().toLocaleDateString('pt-BR')}`
            });

            // Register auto client record
            await this.whatsappAutoClientRepository.create(
                connectionId,
                newClient.id,
                phoneNumber
            );

            console.log(`[WhatsAppService] Client created successfully: ${newClient.id}`);
            
            return newClient;
        } catch (error) {
            console.error(`[WhatsAppService] Error creating client: ${error.message}`);
            // Don't throw - allow message processing to continue
            return null;
        }
    }

    /**
     * Get connection status
     */
    async getConnectionStatus(userId) {
        try {
            console.log(`[WhatsAppService] Getting status for user: ${userId}`);
            
            const user = await this.userRepository.findById(userId);
            console.log(`[WhatsAppService] User found:`, user ? 'Yes' : 'No');
            
            if (!user || !user.company_id) {
                console.error(`[WhatsAppService] User not found or missing company_id`);
                throw new Error('User or company not found');
            }

            const companyId = user.company_id;
            console.log(`[WhatsAppService] Company ID: ${companyId}`);
            
            const status = await this.whatsappClientManager.getStatus(companyId);
            console.log(`[WhatsAppService] Status:`, status);
            
            return status;
        } catch (error) {
            console.error(`[WhatsAppService] Error getting status:`, error);
            throw error;
        }
    }

    /**
     * Send message
     */
    async sendMessage(userId, to, messageText) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user || !user.company_id) {
                throw new Error('User or company not found');
            }

            const companyId = user.company_id;

            if (!to || !messageText) {
                throw new Error('Missing required fields: to, message');
            }

            await this.whatsappClientManager.sendMessage(companyId, to, messageText);
            
            return {
                message: 'Message sent successfully'
            };
        } catch (error) {
            console.error(`[WhatsAppService] Error sending message: ${error.message}`);
            throw error;
        }
    }

    /**
     * Disconnect WhatsApp
     */
    async disconnect(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user || !user.company_id) {
                throw new Error('User or company not found');
            }

            const companyId = user.company_id;
            
            await this.whatsappClientManager.destroyClient(companyId);
            await this.whatsappConnectionRepository.updateStatus(companyId, {
                is_connected: false
            });

            return {
                message: 'Disconnected successfully'
            };
        } catch (error) {
            console.error(`[WhatsAppService] Error disconnecting: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get messages
     */
    async getMessages(userId, limit = 50, offset = 0) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user || !user.company_id) {
                throw new Error('User or company not found');
            }

            const companyId = user.company_id;
            
            const messages = await this.whatsappMessageRepository.findByCompanyId(
                companyId,
                limit,
                offset
            );

            return messages;
        } catch (error) {
            console.error(`[WhatsAppService] Error getting messages: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get messages for a specific phone number
     */
    async getConversation(userId, phoneNumber, limit = 50) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user || !user.company_id) {
                throw new Error('User or company not found');
            }

            const companyId = user.company_id;
            
            const messages = await this.whatsappMessageRepository.findByPhoneNumber(
                companyId,
                phoneNumber,
                limit
            );

            return messages;
        } catch (error) {
            console.error(`[WhatsAppService] Error getting conversation: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get auto-created clients
     */
    async getAutoClients(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user || !user.company_id) {
                throw new Error('User or company not found');
            }

            const connection = await this.whatsappConnectionRepository.findByCompanyId(user.company_id);
            if (!connection) {
                return [];
            }

            return await this.whatsappAutoClientRepository.findByConnectionId(connection.id);
        } catch (error) {
            console.error(`[WhatsAppService] Error getting auto clients: ${error.message}`);
            throw error;
        }
    }
}

module.exports = WhatsAppService;
