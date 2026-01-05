/**
 * WHATSAPP INTEGRATION - QUICK REFERENCE
 * 
 * This is a quick cheat sheet for the WhatsApp implementation.
 */

// ============================================================================
// 1. INSTALLATION
// ============================================================================

// Run in your project root:
// npm install whatsapp-web.js qrcode puppeteer

// Create sessions folder:
// mkdir sessions


// ============================================================================
// 2. DATABASE SETUP
// ============================================================================

// Run WHATSAPP_DATABASE_SETUP.sql in Supabase dashboard
// Creates 3 tables:
//   - whatsapp_connections
//   - whatsapp_messages
//   - whatsapp_auto_clients


// ============================================================================
// 3. SERVER INTEGRATION
// ============================================================================

// In your server.js, add:

const WhatsAppClientManager = require('./src/utils/whatsappClientManager');
const {
    SupabaseWhatsappConnectionRepository,
    SupabaseWhatsappMessageRepository,
    SupabaseWhatsappAutoClientRepository
} = require('./src/infrastructure/repositories');
const { WhatsAppService } = require('./src/application/services');
const { createWhatsappRoutes } = require('./src/presentation/routes');

const whatsappConnectionRepo = new SupabaseWhatsappConnectionRepository(supabase);
const whatsappMessageRepo = new SupabaseWhatsappMessageRepository(supabase);
const whatsappAutoClientRepo = new SupabaseWhatsappAutoClientRepository(supabase);

const whatsappClientManager = new WhatsAppClientManager(whatsappConnectionRepo);

const whatsappService = new WhatsAppService(
    whatsappClientManager,
    whatsappConnectionRepo,
    whatsappMessageRepo,
    whatsappAutoClientRepo,
    userRepository,
    clientRepository  // Must have findByPhoneNumber() and create()
);

app.use('/api/whatsapp', createWhatsappRoutes(whatsappService, authMiddleware));


// ============================================================================
// 4. API ENDPOINTS
// ============================================================================

/*
POST /api/whatsapp/initialize
  Init WhatsApp for logged-in user
  Returns: { message, status }

GET /api/whatsapp/status
  Get connection status & QR code
  Returns: { status, is_connected, qr_code?, phone_number? }

POST /api/whatsapp/disconnect
  Disconnect WhatsApp
  Returns: { message }

POST /api/whatsapp/send
  Send message
  Body: { to: "5511999999999", message: "Hello" }
  Returns: { message }

GET /api/whatsapp/messages?limit=50&offset=0
  Get all messages
  Returns: { data: Message[], limit, offset }

GET /api/whatsapp/conversation/:phoneNumber
  Get conversation with number
  Returns: { phone_number, data: Message[] }

GET /api/whatsapp/auto-clients
  Get auto-created clients
  Returns: { data: AutoClient[] }
*/


// ============================================================================
// 5. ARCHITECTURE LAYERS
// ============================================================================

/*
Presentation Layer:
  └─ src/presentation/routes/whatsappRoutes.js
     • HTTP request handling
     • Input validation
     • Error responses

Application Layer:
  └─ src/application/services/WhatsAppService.js
     • Business logic
     • Client auto-creation
     • Message processing

Utils Layer:
  └─ src/utils/whatsappClientManager.js
     • WhatsApp client lifecycle
     • Event handling
     • Session management

Infrastructure Layer:
  └─ src/infrastructure/repositories/
     • SupabaseWhatsappConnectionRepository.js
     • SupabaseWhatsappMessageRepository.js
     • SupabaseWhatsappAutoClientRepository.js
     └─ Database access
*/


// ============================================================================
// 6. CLIENT AUTO-CREATION FLOW
// ============================================================================

/*
Message arrives from new number (e.g., "5511999999999")
        ↓
WhatsAppService.handleIncomingMessage()
        ↓
Check: Does client with phone="5511999999999" exist?
        ├─ YES: Save message only
        └─ NO: Create new client
              ├─ Name: Contact name from WhatsApp
              ├─ Phone: "5511999999999"
              ├─ Source: "whatsapp" (automatic)
              ├─ Status: "lead" (automatic)
              └─ Record in whatsapp_auto_clients
*/


// ============================================================================
// 7. STATUS FLOW
// ============================================================================

/*
disconnected (initial)
        ↓
connecting (after POST /initialize)
        ↓
qr_ready (QR code generated)
        ↓
connected (user scanned QR code)
        ↓
[Connected - receiving messages]
        ↓
disconnected (on disconnect or error)
*/


// ============================================================================
// 8. FILE LOCATIONS
// ============================================================================

/*
Created files:
  src/infrastructure/repositories/SupabaseWhatsappConnectionRepository.js
  src/infrastructure/repositories/SupabaseWhatsappMessageRepository.js
  src/infrastructure/repositories/SupabaseWhatsappAutoClientRepository.js
  src/application/services/WhatsAppService.js
  src/utils/whatsappClientManager.js
  src/presentation/routes/whatsappRoutes.js

Documentation:
  WHATSAPP_README.md                           (Main docs)
  WHATSAPP_SETUP.js                            (Setup guide)
  WHATSAPP_DATABASE_SETUP.sql                  (Database schema)
  WHATSAPP_SERVER_INTEGRATION_EXAMPLE.js       (Server example)
  WHATSAPP_QUICK_REFERENCE.js                  (This file)
*/


// ============================================================================
// 9. TESTING WITH CURL
// ============================================================================

/*
# Initialize WhatsApp
curl -X POST http://localhost:3000/api/whatsapp/initialize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Check status (should return QR code)
curl -X GET http://localhost:3000/api/whatsapp/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send message (after connecting)
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Hello from API!"
  }'

# Get messages
curl -X GET "http://localhost:3000/api/whatsapp/messages?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get conversation with number
curl -X GET "http://localhost:3000/api/whatsapp/conversation/5511999999999" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get auto-created clients
curl -X GET http://localhost:3000/api/whatsapp/auto-clients \
  -H "Authorization: Bearer YOUR_TOKEN"

# Disconnect
curl -X POST http://localhost:3000/api/whatsapp/disconnect \
  -H "Authorization: Bearer YOUR_TOKEN"
*/


// ============================================================================
// 10. TROUBLESHOOTING
// ============================================================================

/*
Problem: "QR Code not showing"
  → Check: npm install puppeteer
  → Check: Chromium installation
  → Check: Server logs for errors
  → Check: Database connection

Problem: "Client not auto-created"
  → Check: clientRepository has findByPhoneNumber() and create()
  → Check: WhatsApp message was not a group message
  → Check: Server logs for errors
  → Check: clients table has correct columns

Problem: "WhatsApp is not connected"
  → Check: Initialize first with POST /initialize
  → Check: Scan QR code with phone
  → Check: status should be "connected"

Problem: "Sessions folder errors"
  → mkdir sessions
  → chmod 755 sessions
  → Check: Node process has write permission

Problem: "Puppeteer/Chrome errors"
  → npm install --save-dev puppeteer
  → On Linux: apt-get install chromium-browser
  → Or use Docker with Chrome pre-installed
*/


// ============================================================================
// 11. REQUIRED DEPENDENCIES
// ============================================================================

/*
npm install:
  - whatsapp-web.js       (Main library)
  - qrcode                (QR code generation)
  - puppeteer             (Chrome automation) - might be auto-installed
  - @supabase/supabase-js (Already have)
  - express               (Already have)

Dev dependencies (optional):
  - @types/express
  - @types/qrcode
*/


// ============================================================================
// 12. IMPORTANT NOTES
// ============================================================================

/*
✅ DO:
  - Use rate limiting on /send endpoint
  - Backup sessions folder regularly
  - Monitor Chromium memory usage
  - Add logging for debugging
  - Test with real WhatsApp account

❌ DON'T:
  - Send tons of messages (might trigger ban)
  - Use without understanding WhatsApp TOS
  - Deploy without HTTPS
  - Expose QR codes publicly
  - Leave sessions folder unprotected
  - Run multiple servers without load balancing

⚠️  LIMITS:
  - One connection per company
  - ~100-200MB RAM per connection
  - ~50-100 messages/hour (estimate, WhatsApp may limit)
  - Requires Chromium browser
*/


// ============================================================================
// 13. ENVIRONMENT SETUP
// ============================================================================

/*
No new environment variables needed!

Uses existing:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  PORT (optional, default: 3000)

Optional (for production):
  NODE_ENV=production
*/


// ============================================================================
// 14. REPOSITORY METHODS REQUIRED
// ============================================================================

/*
clientRepository.findByPhoneNumber(companyId, phoneNumber)
  Returns: Client object or null
  Used for: Checking if client exists before creating

clientRepository.create(clientData)
  Returns: Created client object
  Used for: Creating new client from WhatsApp message
  Data includes:
    {
      company_id: uuid,
      name: string,
      phone: string,
      email: null,
      source: "whatsapp",
      status: "lead",
      notes: string
    }
*/


// ============================================================================
// 15. DATABASE QUERIES (for debugging)
// ============================================================================

/*
-- Check connections
SELECT id, company_id, phone_number, is_connected, last_connected_at 
FROM whatsapp_connections;

-- Check recent messages
SELECT * FROM whatsapp_messages 
ORDER BY timestamp DESC 
LIMIT 20;

-- Check auto-created clients
SELECT wac.phone_number, c.name, wac.created_at 
FROM whatsapp_auto_clients wac 
JOIN clients c ON wac.client_id = c.id;

-- Check messages from number
SELECT * FROM whatsapp_messages 
WHERE from_number = '5511999999999' 
ORDER BY timestamp DESC;

-- Count messages per company
SELECT company_id, COUNT(*) as total_messages 
FROM whatsapp_messages 
GROUP BY company_id;
*/


// ============================================================================
// 16. PRODUCTION CHECKLIST
// ============================================================================

/*
□ Install dependencies: npm install whatsapp-web.js qrcode puppeteer
□ Run database setup SQL in Supabase
□ Create sessions/ folder: mkdir sessions
□ Integrate WhatsApp routes into server
□ Verify clientRepository has required methods
□ Test initialization: POST /api/whatsapp/initialize
□ Test status endpoint: GET /api/whatsapp/status
□ Scan QR code with phone
□ Test sending message: POST /api/whatsapp/send
□ Test message retrieval: GET /api/whatsapp/messages
□ Add rate limiting to /send endpoint
□ Add error logging
□ Test graceful shutdown (SIGTERM handling)
□ Deploy to production
□ Monitor server resources (Chromium memory)
□ Set up alerts for disconnections
□ Regular backup of sessions/ folder
*/


// ============================================================================
// END OF QUICK REFERENCE
// ============================================================================
