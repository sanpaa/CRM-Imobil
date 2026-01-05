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
     * @param {boolean} forceClean - Se true, limpa sessão antiga antes de reconectar
     */
    async initializeConnection(userId, userData = null, forceClean = false) {
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

            // Initialize client with event callbacks (não espera)
            this.whatsappClientManager.initializeClient(
                companyId,
                userId,
                // onQRCode callback
                async (qrCode) => {
                    try {
                        await this.whatsappConnectionRepository.updateStatus(companyId, {
                            is_connected: false
                        });
                    } catch (error) {
                        console.error(`[WhatsAppService] Error updating QR code status: ${error.message}`);
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
                },
                forceClean  // Passa o parâmetro forceClean para o manager
            );

            // Retorna imediatamente - frontend faz polling em /status
            return {
                message: forceClean 
                    ? 'WhatsApp session cleaned and reconnecting. Use /status to get QR code.'
                    : 'WhatsApp initialization started. Use /status to get QR code.',
                status: 'connecting'
            };
        } catch (error) {
            console.error(`[WhatsAppService] Error initializing connection: ${error.message}`);
            throw error;
        }
    }

    /**
     * Handle incoming message
     */
    async handleIncomingMessage(message, companyId) {
        console.log('\n' + '='.repeat(80));
        console.log(`[WhatsAppService] 📨 NOVA MENSAGEM RECEBIDA`);
        console.log('='.repeat(80));
        
        try {
            console.log(`[WhatsAppService] Company ID: ${companyId}`);
            console.log(`[WhatsAppService] Message ID: ${message.id?._serialized || 'N/A'}`);
            console.log(`[WhatsAppService] Is Group: ${message.isGroup}`);
            console.log(`[WhatsAppService] From Me: ${message.fromMe}`);
            console.log(`[WhatsAppService] Body: ${message.body?.substring(0, 100)}...`);
            
            // Ignore group messages and messages from me
            if (message.isGroup) {
                console.log(`[WhatsAppService] ❌ Ignorando mensagem de grupo`);
                return;
            }
            
            if (message.fromMe) {
                console.log(`[WhatsAppService] ❌ Ignorando mensagem enviada por mim`);
                return;
            }

            // Get connection
            console.log(`[WhatsAppService] 🔍 Buscando conexão para company: ${companyId}`);
            const connection = await this.whatsappConnectionRepository.findByCompanyId(companyId);
            if (!connection) {
                console.error(`[WhatsAppService] ❌ ERRO: Conexão não encontrada para company: ${companyId}`);
                return;
            }
            console.log(`[WhatsAppService] ✅ Conexão encontrada: ${connection.id}`);

            // Get contact info (Baileys normalized payload)
            console.log(`[WhatsAppService] 📞 Obtendo informações do contato...`);
            const fromNumber = message.fromNumber || message.from?.split('@')[0];
            const contactName = message.pushName || fromNumber || 'WhatsApp Lead';
            
            console.log(`[WhatsAppService] 👤 Contato:`);
            console.log(`   - Número: ${fromNumber}`);
            console.log(`   - Nome: ${contactName}`);
            console.log(`   - Push Name: ${message.pushName || 'N/A'}`);

            // Save message
            console.log(`[WhatsAppService] 💾 Salvando mensagem no banco...`);
            const messageData = {
                connection_id: connection.id,
                company_id: companyId,
                from_number: fromNumber,
                to_number: message.to || null,
                body: message.body,
                message_id: message.id?._serialized || message.id,
                is_group: message.isGroup,
                is_from_me: message.fromMe,
                contact_name: contactName,
                timestamp: new Date((message.timestamp || Date.now() / 1000) * 1000).toISOString()
            };
            
            await this.whatsappMessageRepository.saveMessage(messageData);
            console.log(`[WhatsAppService] ✅ Mensagem salva com sucesso!`);

            // Check if client already exists
            console.log(`[WhatsAppService] 🔍 Verificando se cliente já existe...`);
            console.log(`   - Company ID: ${companyId}`);
            console.log(`   - Phone Number: ${fromNumber}`);
            
            const existingClient = await this.clientRepository.findByPhoneNumber(companyId, fromNumber);
            
            if (existingClient) {
                console.log(`[WhatsAppService] ℹ️ Cliente JÁ EXISTE:`);
                console.log(`   - ID: ${existingClient.id}`);
                console.log(`   - Nome: ${existingClient.name}`);
                console.log(`   - Telefone: ${existingClient.phone}`);
                console.log(`[WhatsAppService] ⏭️ Pulando criação de cliente`);
            } else {
                console.log(`[WhatsAppService] 🆕 Cliente NÃO existe. Criando novo...`);
                await this.createClientFromWhatsApp(
                    companyId,
                    connection.id,
                    contactName,
                    fromNumber
                );
            }
            
            console.log('='.repeat(80));
            console.log(`[WhatsAppService] ✅ Processamento concluído com sucesso!`);
            console.log('='.repeat(80) + '\n');
            
        } catch (error) {
            console.error('\n' + '='.repeat(80));
            console.error(`[WhatsAppService] ❌ ERRO AO PROCESSAR MENSAGEM`);
            console.error('='.repeat(80));
            console.error(`[WhatsAppService] Erro: ${error.message}`);
            console.error(`[WhatsAppService] Stack: ${error.stack}`);
            console.error('='.repeat(80) + '\n');
        }
    }

    /**
     * Create client automatically from WhatsApp message
     */
    async createClientFromWhatsApp(companyId, connectionId, clientName, phoneNumber) {
        console.log(`\n[WhatsAppService] 🔨 CRIANDO NOVO CLIENTE AUTOMATICAMENTE`);
        console.log(`   - Company ID: ${companyId}`);
        console.log(`   - Connection ID: ${connectionId}`);
        console.log(`   - Nome: ${clientName}`);
        console.log(`   - Telefone: ${phoneNumber}`);
        
        try {
            const clientData = {
                company_id: companyId,
                name: clientName,
                phone: phoneNumber,
                email: null,
                source: 'whatsapp',
                status: 'lead',
                notes: `Cliente criado automaticamente via WhatsApp em ${new Date().toLocaleDateString('pt-BR')}`
            };
            
            console.log(`[WhatsAppService] 📝 Dados do cliente:`, JSON.stringify(clientData, null, 2));
            console.log(`[WhatsAppService] 💾 Salvando cliente no banco...`);

            // Create client
            const newClient = await this.clientRepository.create(clientData);
            
            console.log(`[WhatsAppService] ✅ Cliente criado com ID: ${newClient.id}`);

            // Register auto client record
            console.log(`[WhatsAppService] 📝 Registrando em whatsapp_auto_clients...`);
            await this.whatsappAutoClientRepository.create(
                connectionId,
                newClient.id,
                phoneNumber
            );

            console.log(`[WhatsAppService] ✅ Cliente registrado em auto_clients`);
            console.log(`[WhatsAppService] 🎉 SUCESSO! Cliente ${newClient.id} criado e vinculado!\n`);
            
            return newClient;
        } catch (error) {
            console.error(`\n[WhatsAppService] ❌ ERRO AO CRIAR CLIENTE:`);
            console.error(`   - Erro: ${error.message}`);
            console.error(`   - Stack: ${error.stack}`);
            console.error(`   - Company ID: ${companyId}`);
            console.error(`   - Phone: ${phoneNumber}\n`);
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
     * Clean session (remove arquivos de sessão corrompidos)
     */
    async cleanSession(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user || !user.company_id) {
                throw new Error('User or company not found');
            }

            const companyId = user.company_id;
            console.log(`[WhatsAppService] 🧹 Cleaning session for company: ${companyId}`);
            
            await this.whatsappClientManager.cleanSession(companyId);

            return {
                message: 'Session cleaned successfully'
            };
        } catch (error) {
            console.error(`[WhatsAppService] Error cleaning session: ${error.message}`);
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
