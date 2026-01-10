# WhatsApp Integration - Architecture Diagrams

## 1. Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Mobile/Web)                                │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │  Authentication (JWT)      │
                    │  Authorization Check       │
                    └─────────────┬──────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────────┐
│                         Express Server (Port 3000)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  /api/whatsapp/initialize        POST   Initialize WhatsApp connection     │
│  /api/whatsapp/status            GET    Get connection status & QR code    │
│  /api/whatsapp/send              POST   Send WhatsApp message              │
│  /api/whatsapp/disconnect        POST   Disconnect WhatsApp                │
│  /api/whatsapp/messages          GET    Get received messages              │
│  /api/whatsapp/conversation/:id  GET    Get conversation with number       │
│  /api/whatsapp/auto-clients      GET    Get auto-created clients           │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
    ┌────▼─────┐         ┌───────▼──────┐         ┌───────▼────────┐
    │  Routes  │         │   Service    │         │   Repositories │
    ├──────────┤         ├──────────────┤         ├────────────────┤
    │• Input   │         │• Business    │         │• Database      │
    │  validation        │  Logic       │         │  Access        │
    │• Error   │         │• Auto-create │         │• Queries       │
    │  handling │        │  clients     │         │• Updates       │
    │• HTTP    │         │• Message     │         └────────────────┘
    │  status  │         │  processing  │
    │  codes   │         └──────┬───────┘
    └──────────┘                │
                       ┌────────▼──────────┐
                       │  Client Manager   │
                       ├───────────────────┤
                       │ • QR Code Gen     │
                       │ • Session Mgmt    │
                       │ • Event Handling  │
                       │ • Message Events  │
                       └────────────┬──────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │   whatsapp-web.js Library      │
                    ├────────────────────────────────┤
                    │ • Puppeteer Control            │
                    │ • WhatsApp Web Automation      │
                    │ • Client Instance              │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  Chromium Browser (Headless)   │
                    │  └─ WhatsApp Web Interface     │
                    └───────────────┬────────────────┘
                                    │
                       ┌────────────▼──────────────┐
                       │   Phone's WhatsApp App    │
                       └──────────────────────────┘
                                    │
    ┌───────────────────────────────▼────────────────────────────────┐
    │                    Supabase Database                           │
    ├───────────────────────────────────────────────────────────────┤
    │ ┌─────────────────────┐  ┌──────────────────┐  ┌────────────┐ │
    │ │  whatsapp_         │  │ whatsapp_        │  │ whatsapp_ │  │
    │ │  connections       │  │ messages         │  │ auto_     │  │
    │ │ ────────────────   │  │ ────────────────  │  │ clients   │  │
    │ │ • id              │  │ • id             │  │ ────────  │  │
    │ │ • company_id      │  │ • connection_id  │  │ • id      │  │
    │ │ • user_id         │  │ • company_id     │  │ • conn_id │  │
    │ │ • phone_number    │  │ • from_number    │  │ • client_ │  │
    │ │ • is_connected    │  │ • to_number      │  │   id      │  │
    │ │ • last_connected_ │  │ • body           │  │ • phone   │  │
    │ │   at              │  │ • message_id     │  │ • created_│  │
    │ │ • created_at      │  │ • timestamp      │  │   at      │  │
    │ │ • updated_at      │  │ • is_group       │  │           │  │
    │ │                   │  │ • is_from_me     │  │           │  │
    │ │                   │  │ • contact_name   │  │           │  │
    │ │                   │  │ • created_at     │  │           │  │
    │ └─────────────────────┘  └──────────────────┘  └────────────┘ │
    │                                                                 │
    │ Indexes:                                                        │
    │ • idx_whatsapp_connections_company                             │
    │ • idx_whatsapp_connections_user                                │
    │ • idx_whatsapp_connections_connected                           │
    │ • idx_whatsapp_messages_connection                             │
    │ • idx_whatsapp_messages_company                                │
    │ • idx_whatsapp_messages_from                                   │
    │ • idx_whatsapp_messages_timestamp                              │
    │ • idx_whatsapp_auto_clients_connection                         │
    └───────────────────────────────────────────────────────────────┘
```

## 2. Message Reception Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  Contact sends WhatsApp message to connected account             │
└────────────────────────┬─────────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │ WhatsApp Web.js     │
              │ (running via        │
              │  Puppeteer)         │
              └──────────┬──────────┘
                         │
         ┌───────────────▼───────────────┐
         │ 'message' Event Triggered     │
         │ {                             │
         │   id, from, to, body, etc.    │
         │ }                             │
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │ WhatsAppService.                │
         │ handleIncomingMessage()        │
         └───────┬───────────────────────┘
                 │
     ┌───────────▼────────────────┐
     │ Extract contact info:      │
     │ • Phone number             │
     │ • Contact name             │
     │ • Is group? Skip if yes    │
     │ • From me? Skip if yes     │
     └───────────┬────────────────┘
                 │
     ┌───────────▼─────────────────┐
     │ Save message to database    │
     │ • connection_id             │
     │ • from_number               │
     │ • contact_name              │
     │ • body                      │
     │ • timestamp                 │
     └───────────┬─────────────────┘
                 │
     ┌───────────▼────────────────────────┐
     │ Check if client exists:            │
     │ findByPhoneNumber(company, phone)  │
     └───────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌───▼────┐        ┌───▼──────┐
    │ EXISTS │        │ NOT FOUND │
    ├────────┤        ├──────────┤
    │ Done   │        │ Create   │
    │        │        │ New      │
    │        │        │ Client:  │
    │        │        │ • name   │
    │        │        │ • phone  │
    │        │        │ • source │
    │        │        │ • status │
    │        │        │ • notes  │
    │        │        └───┬──────┘
    │        │            │
    │        │ ┌──────────▼─────────┐
    │        │ │ Record in         │
    │        │ │ whatsapp_auto_    │
    │        │ │ clients           │
    │        │ └──────────────────┘
    │        │            │
    └────────┴────────────┴───┐
                             │
                     ┌───────▼────────┐
                     │ Message fully  │
                     │ processed ✓    │
                     └────────────────┘
```

## 3. Connection Lifecycle

```
START
  │
  ├─ /initialize (POST)
  │  └─ WhatsAppClientManager.initializeClient()
  │     └─ Create Client instance (whatsapp-web.js)
  │        └─ Puppeteer launches Chromium
  │           └─ Opens WhatsApp Web
  │
  ├─ Wait for 'qr' event
  │  └─ whatsappClientManager.on('qr', (qr) => {
  │     ├─ Generate QR code (base64)
  │     ├─ Save to database
  │     └─ Return to API response
  │
  ├─ /status (GET)
  │  └─ Returns:
  │     └─ { status: 'qr_ready', qr_code: '...' }
  │
  ├─ User scans QR code with phone
  │  └─ WhatsApp phone verifies scan
  │
  ├─ 'authenticated' event fires
  │  └─ Session data saved locally in sessions/
  │
  ├─ 'ready' event fires
  │  └─ WhatsAppClientManager.on('ready', () => {
  │     ├─ Set isReady = true
  │     ├─ Get phone number
  │     └─ Update database: is_connected = true
  │
  ├─ /status (GET)
  │  └─ Returns:
  │     └─ { status: 'connected', is_connected: true, phone_number: '...' }
  │
  ├─ Client connected! ✓
  │  ├─ Can receive messages
  │  ├─ Can send messages
  │  └─ Sessions persisted
  │
  ├─ /send (POST) - Send message
  │  └─ whatsappClientManager.sendMessage()
  │     └─ client.sendMessage(chatId, text)
  │
  ├─ on('message', (msg) => {
  │  └─ handleIncomingMessage()
  │
  ├─ /disconnect (POST)
  │  └─ whatsappClientManager.destroyClient()
  │     └─ client.destroy()
  │        └─ Puppeteer closes Chromium
  │           └─ Sessions preserved for reconnection
  │
  └─ is_connected = false
     └─ Status: 'disconnected'

ERROR PATHS:
  • auth_failure → destroyClient()
  • disconnected → Update DB → destroyClient()
```

## 4. Data Flow - Complete Request Cycle

```
USER REQUEST
  │
  ├─ Headers: { Authorization: Bearer TOKEN }
  │
  ├─ POST /api/whatsapp/send
  │  Body: { to: "5511999999999", message: "Hello" }
  │
  └─▶ Express Server
     │
     ├─▶ authMiddleware
     │  ├─ Verify JWT token
     │  ├─ Get user.id from token
     │  └─ Continue if valid
     │
     └─▶ whatsappController.sendMessage()
        │
        ├─ Extract userId from request
        │
        ├─▶ WhatsAppService.sendMessage(userId, to, message)
        │  │
        │  ├─ Get user from repository
        │  │  └─ userRepository.findById(userId)
        │  │
        │  ├─ Get user's company_id
        │  │
        │  ├─▶ whatsappClientManager.sendMessage(companyId, to, message)
        │  │  │
        │  │  ├─ getClient(companyId)
        │  │  │  └─ Get cached client instance
        │  │  │
        │  │  ├─ Format phone number for WhatsApp
        │  │  │  └─ "5511999999999" → "5511999999999@c.us"
        │  │  │
        │  │  └─▶ client.sendMessage(chatId, text)
        │  │     │
        │  │     └─▶ Puppeteer clicks WhatsApp
        │  │        ├─ Find recipient
        │  │        ├─ Type message
        │  │        └─ Send (Ctrl+Enter)
        │  │
        │  └─ Return { message: "sent" }
        │
        └─▶ Response: 200 OK
           { message: "Message sent successfully" }

ASYNC - Message arrives from contact
         ├─▶ on('message') event
         ├─▶ handleIncomingMessage()
         ├─▶ Save to database
         ├─▶ Check/create client
         └─▶ Complete ✓
```

## 5. Data Schema Relationships

```
┌──────────────────────────┐
│    companies (existing)  │
│  ─────────────────────   │
│  id (UUID) PRIMARY KEY   │
│  name                    │
│  custom_domain           │
└────────────┬─────────────┘
             │ 1:N
             │
┌────────────▼─────────────────────────┐
│    whatsapp_connections              │
│  ───────────────────────────────     │
│  id (UUID) PRIMARY KEY               │
│  company_id (FK) UNIQUE ◄─ 1:1      │
│  user_id (FK)                        │
│  phone_number                        │
│  is_connected (BOOLEAN)              │
│  last_connected_at (TIMESTAMP)       │
│  created_at, updated_at              │
└────────────┬─────────────────────────┘
             │ 1:N
    ┌────────┴───────┐
    │                │
    │        ┌───────▼──────────────────┐
    │        │ whatsapp_messages        │
    │        │ ───────────────────────  │
    │        │ id (UUID) PRIMARY KEY    │
    │        │ connection_id (FK)       │
    │        │ company_id (FK)          │
    │        │ from_number              │
    │        │ to_number                │
    │        │ body                     │
    │        │ message_id (UNIQUE)      │
    │        │ timestamp                │
    │        │ created_at               │
    │        └──────────────────────────┘
    │
    │        ┌────────────────────────────┐
    │        │ whatsapp_auto_clients      │
    │        │ ────────────────────────   │
    │        │ id (UUID) PRIMARY KEY      │
    │        │ connection_id (FK)         │
    │        │ client_id (FK)             │
    │        │ phone_number               │
    │        │ created_at                 │
    │        │ UNIQUE(connection_id,      │
    │        │         phone_number)      │
    │        └────────────┬────────────────┘
    │                     │ N:1
    │                     │
    │        ┌────────────▼──────────────┐
    │        │  clients (existing)       │
    │        │ ──────────────────────    │
    │        │  id (UUID) PRIMARY KEY    │
    │        │  company_id (FK)          │
    │        │  name                     │
    │        │  phone                    │
    │        │  email                    │
    │        │  source (whatsapp)        │
    │        │  status (lead)            │
    │        │  notes                    │
    │        │  created_at               │
    │        └───────────────────────────┘
    │
    └──────────────────────────────────────────►
                                    (existing)
```

## 6. Request/Response Examples

```
REQUEST 1: Initialize WhatsApp
────────────────────────────

POST /api/whatsapp/initialize
Authorization: Bearer eyJhbGc...
Content-Type: application/json

RESPONSE 200 OK
────────────────
{
  "message": "WhatsApp initialization started. Please scan the QR code.",
  "status": "connecting"
}


REQUEST 2: Get Status (with QR)
──────────────────────────────

GET /api/whatsapp/status
Authorization: Bearer eyJhbGc...

RESPONSE 200 OK
──────────────
{
  "status": "qr_ready",
  "is_connected": false,
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAAC..."
}


REQUEST 3: Send Message
──────────────────────

POST /api/whatsapp/send
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "to": "5511999999999",
  "message": "Hello! This is a test message."
}

RESPONSE 200 OK
──────────────
{
  "message": "Message sent successfully"
}


REQUEST 4: Get Messages
──────────────────────

GET /api/whatsapp/messages?limit=10&offset=0
Authorization: Bearer eyJhbGc...

RESPONSE 200 OK
──────────────
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "connection_id": "uuid...",
      "company_id": "uuid...",
      "from_number": "5511999999999",
      "to_number": "5521987654321",
      "body": "Hey! How are you?",
      "message_id": "wamid.HBEUGBJKJBKJBKJBJKBJKBkjbkjbkjb",
      "is_group": false,
      "is_from_me": false,
      "contact_name": "John Doe",
      "timestamp": "2024-01-03T15:30:00Z",
      "created_at": "2024-01-03T15:30:05Z"
    }
  ],
  "limit": 10,
  "offset": 0
}


REQUEST 5: Get Conversation
───────────────────────────

GET /api/whatsapp/conversation/5511999999999?limit=20
Authorization: Bearer eyJhbGc...

RESPONSE 200 OK
──────────────
{
  "phone_number": "5511999999999",
  "data": [
    { /* message 1 */ },
    { /* message 2 */ },
    ...
  ]
}


ERROR RESPONSE: Not Connected
──────────────────────────────

POST /api/whatsapp/send
(When not connected)

RESPONSE 500 Internal Server Error
─────────────────────────────────
{
  "error": "Failed to send WhatsApp message",
  "message": "WhatsApp is not connected for this company"
}
```

---

**These diagrams show:**
- Complete system architecture
- Message reception flow
- Connection lifecycle
- Data flow through all layers
- Database relationships
- Request/response examples

Print or bookmark these for quick reference!
