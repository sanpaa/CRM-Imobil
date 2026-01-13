#!/usr/bin/env node

/**
 * WhatsApp Integration Setup Guide
 * 
 * This guide explains how to integrate WhatsApp into your existing Express server
 */

const path = require('path');

console.log(`
╔════════════════════════════════════════════════════════════════════════════════╗
║                     WHATSAPP INTEGRATION SETUP GUIDE                           ║
╚════════════════════════════════════════════════════════════════════════════════╝

✅ FILES CREATED:
  
  📁 Infrastructure Layer:
     • src/infrastructure/repositories/SupabaseWhatsappConnectionRepository.js
     • src/infrastructure/repositories/SupabaseWhatsappMessageRepository.js
     • src/infrastructure/repositories/SupabaseWhatsappAutoClientRepository.js
  
  📁 Application Layer:
     • src/application/services/WhatsAppService.js
  
  📁 Utils Layer:
     • src/utils/whatsappClientManager.js
  
  📁 Presentation Layer:
     • src/presentation/routes/whatsappRoutes.js

📋 NEXT STEPS:

1️⃣  DATABASE SETUP
    Run the following SQL commands in your Supabase dashboard:

    CREATE TABLE whatsapp_connections (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      phone_number TEXT,
      is_connected BOOLEAN DEFAULT false,
      session_data JSONB,
      last_connected_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(company_id)
    );

    CREATE INDEX idx_whatsapp_connections_company ON whatsapp_connections(company_id);
    CREATE INDEX idx_whatsapp_connections_user ON whatsapp_connections(user_id);
    CREATE INDEX idx_whatsapp_connections_connected ON whatsapp_connections(is_connected);

    CREATE TABLE whatsapp_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      from_number TEXT NOT NULL,
      to_number TEXT NOT NULL,
      body TEXT,
      message_id TEXT UNIQUE,
      is_group BOOLEAN DEFAULT false,
      is_from_me BOOLEAN DEFAULT false,
      contact_name TEXT,
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_whatsapp_messages_connection ON whatsapp_messages(connection_id);
    CREATE INDEX idx_whatsapp_messages_company ON whatsapp_messages(company_id);
    CREATE INDEX idx_whatsapp_messages_from ON whatsapp_messages(from_number);
    CREATE INDEX idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);

    CREATE TABLE whatsapp_auto_clients (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      phone_number TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(connection_id, phone_number)
    );

    CREATE INDEX idx_whatsapp_auto_clients_connection ON whatsapp_auto_clients(connection_id);

2️⃣  INSTALL NPM PACKAGES
    npm install whatsapp-web.js qrcode puppeteer

3️⃣  UPDATE YOUR SERVER FILE
    In your main server file (e.g., server.js or index.js in the root), add:

    ─────────────────────────────────────────────────────────────────────
    // Import WhatsApp components
    const WhatsAppClientManager = require('./src/utils/whatsappClientManager');
    const {
        SupabaseWhatsappConnectionRepository,
        SupabaseWhatsappMessageRepository,
        SupabaseWhatsappAutoClientRepository
    } = require('./src/infrastructure/repositories');
    const { WhatsAppService } = require('./src/application/services');
    const { createWhatsappRoutes } = require('./src/presentation/routes');
    const supabase = require('./src/infrastructure/database/supabase'); // Your Supabase client

    // Initialize WhatsApp components
    const whatsappConnectionRepo = new SupabaseWhatsappConnectionRepository(supabase);
    const whatsappMessageRepo = new SupabaseWhatsappMessageRepository(supabase);
    const whatsappAutoClientRepo = new SupabaseWhatsappAutoClientRepository(supabase);
    
    const whatsappClientManager = new WhatsAppClientManager(whatsappConnectionRepo);
    
    const whatsappService = new WhatsAppService(
        whatsappClientManager,
        whatsappConnectionRepo,
        whatsappMessageRepo,
        whatsappAutoClientRepo,
        userRepository,        // Your existing UserRepository
        clientRepository       // Your existing ClientRepository
    );

    // Add WhatsApp routes to Express
    app.use('/api/whatsapp', createWhatsappRoutes(whatsappService, authMiddleware));
    ─────────────────────────────────────────────────────────────────────

4️⃣  VERIFY CLIENT REPOSITORY METHOD
    Your ClientRepository needs these methods:
    
    • findByPhoneNumber(companyId, phoneNumber) - Find existing client
    • create(clientData) - Create new client

    Example:
    ─────────────────────────────────────────────────────────────────────
    async findByPhoneNumber(companyId, phoneNumber) {
        const { data, error } = await this.supabase
            .from('clients')
            .select('*')
            .eq('company_id', companyId)
            .eq('phone', phoneNumber)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    }

    async create(clientData) {
        const { data, error } = await this.supabase
            .from('clients')
            .insert(clientData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
    ─────────────────────────────────────────────────────────────────────

5️⃣  CREATE SESSIONS DIRECTORY
    Create a 'sessions' folder in your project root for WhatsApp authentication files.

6️⃣  TEST THE INTEGRATION
    
    POST /api/whatsapp/initialize
    Authorization: Bearer YOUR_TOKEN
    {
        // Auto-populated from authenticated user
    }
    Response: { message: "WhatsApp initialization started...", status: "connecting" }

    GET /api/whatsapp/status
    Authorization: Bearer YOUR_TOKEN
    Response: { status: "qr_ready", is_connected: false, qr_code: "data:image/png..." }

    POST /api/whatsapp/send
    Authorization: Bearer YOUR_TOKEN
    {
        "to": "5511999999999",
        "message": "Hello from WhatsApp!"
    }

📚 API ENDPOINTS:

POST /api/whatsapp/initialize
  Description: Initialize WhatsApp connection
  Auth: Required
  Body: (auto from user)
  Response: { message: string, status: "connecting" }

GET /api/whatsapp/status
  Description: Get current connection status
  Auth: Required
  Response: { status: string, is_connected: bool, qr_code?: string, phone_number?: string }

POST /api/whatsapp/disconnect
  Description: Disconnect WhatsApp
  Auth: Required
  Response: { message: "Disconnected successfully" }

POST /api/whatsapp/send
  Description: Send a message
  Auth: Required
  Body: { to: string, message: string }
  Response: { message: "Message sent successfully" }

GET /api/whatsapp/messages?limit=50&offset=0
  Description: Get received messages
  Auth: Required
  Query: limit, offset
  Response: { data: Message[], limit: number, offset: number }

GET /api/whatsapp/conversation/:phoneNumber?limit=50
  Description: Get conversation with specific number
  Auth: Required
  Query: limit
  Response: { phone_number: string, data: Message[] }

GET /api/whatsapp/auto-clients
  Description: Get auto-created clients
  Auth: Required
  Response: { data: AutoClient[] }

🔒 SECURITY CONSIDERATIONS:

✓ All routes require authentication (JWT token)
✓ Only company members can access their WhatsApp data
✓ Phone numbers are securely stored in database
✓ Session files are stored locally and never uploaded

⚠️  IMPORTANT NOTES:

• WhatsApp Web Integration: whatsapp-web.js uses Puppeteer to automate WhatsApp Web
• Requires Chrome/Chromium installed on the server
• Respects WhatsApp's Terms of Service for reasonable automation
• Sessions persist - you don't need to scan QR code every time
• Rate limiting recommended for production

📦 ENVIRONMENT VARIABLES:

No additional environment variables needed. Uses existing:
  • SUPABASE_URL
  • SUPABASE_SERVICE_KEY

🐛 TROUBLESHOOTING:

Problem: QR Code not appearing
Solution: Check server logs, verify Puppeteer is installed correctly
  npm install puppeteer

Problem: Session not persisting
Solution: Ensure 'sessions' folder exists and has write permissions
  mkdir sessions
  chmod 755 sessions

Problem: Clients not auto-created
Solution: Verify clients table structure matches expectations
  Check: company_id, name, phone, email, source, status, notes columns

🚀 NEXT FEATURES TO ADD:

• Webhook notifications when messages arrive
• Support for media (images, audio, video)
• Message templates
• Automated responses
• Contact synchronization
• Message scheduling

📖 DOCUMENTATION:

WhatsApp Web.js: https://wwebjs.dev/
Supabase: https://supabase.com/docs
Puppeteer: https://pptr.dev/

═════════════════════════════════════════════════════════════════════════════════
`);

console.log('Setup guide complete! Follow the steps above to integrate WhatsApp.');
