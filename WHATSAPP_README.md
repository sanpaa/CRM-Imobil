# WhatsApp Web Integration Guide

Complete WhatsApp integration for your CRM using `whatsapp-web.js`.

## Features

✅ **QR Code Authentication** - Secure user authentication via QR code scanning  
✅ **Session Management** - Persistent sessions that survive server restarts  
✅ **Auto Client Creation** - Automatically create clients from WhatsApp messages  
✅ **Message History** - Complete message tracking and storage  
✅ **Send Messages** - Send WhatsApp messages via API  
✅ **Conversation Tracking** - View conversation history with contacts  
✅ **Company Isolation** - Each company has separate WhatsApp connections  

## Installation

### 1. Install Dependencies

```bash
npm install whatsapp-web.js qrcode puppeteer
```

**Note:** Puppeteer requires:
- Node.js 14+ 
- ~300MB disk space for Chromium
- Linux: `libssl1.0` and other system packages (see Puppeteer docs)
- Windows/Mac: Usually works out of the box

### 2. Database Setup

Run the SQL commands in `WHATSAPP_DATABASE_SETUP.sql` in your Supabase dashboard:

```bash
# Or use Supabase CLI:
supabase db push < WHATSAPP_DATABASE_SETUP.sql
```

This creates 3 tables:
- `whatsapp_connections` - Connection status per company
- `whatsapp_messages` - All received messages
- `whatsapp_auto_clients` - Auto-created client mappings

### 3. Create Sessions Directory

```bash
mkdir sessions
```

This folder stores WhatsApp authentication files. Add to `.gitignore`:

```
sessions/
```

### 4. Integrate into Your Server

Edit your main server file (e.g., `server.js`):

```javascript
// Import WhatsApp components
const WhatsAppClientManager = require('./src/utils/whatsappClientManager');
const {
    SupabaseWhatsappConnectionRepository,
    SupabaseWhatsappMessageRepository,
    SupabaseWhatsappAutoClientRepository
} = require('./src/infrastructure/repositories');
const { WhatsAppService } = require('./src/application/services');
const { createWhatsappRoutes } = require('./src/presentation/routes');

// Initialize WhatsApp
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
    clientRepository
);

// Add to Express
app.use('/api/whatsapp', createWhatsappRoutes(whatsappService, authMiddleware));
```

**Important:** Make sure your `clientRepository` has these methods:

```javascript
async findByPhoneNumber(companyId, phoneNumber) {
    // Find client by phone number
}

async create(clientData) {
    // Create new client
}
```

## API Endpoints

All endpoints require `Authorization: Bearer YOUR_TOKEN` header.

### Initialize WhatsApp Connection

```
POST /api/whatsapp/initialize
```

Starts the WhatsApp authentication process. User will receive QR code.

**Response:**
```json
{
    "message": "WhatsApp initialization started. Please scan the QR code.",
    "status": "connecting"
}
```

### Get Connection Status

```
GET /api/whatsapp/status
```

Get current WhatsApp connection status and QR code if needed.

**Response (QR Ready):**
```json
{
    "status": "qr_ready",
    "is_connected": false,
    "qr_code": "data:image/png;base64,..."
}
```

**Response (Connected):**
```json
{
    "status": "connected",
    "is_connected": true,
    "phone_number": "5511999999999"
}
```

### Send Message

```
POST /api/whatsapp/send
Content-Type: application/json

{
    "to": "5511999999999",
    "message": "Hello from WhatsApp!"
}
```

**Response:**
```json
{
    "message": "Message sent successfully"
}
```

### Get All Messages

```
GET /api/whatsapp/messages?limit=50&offset=0
```

Get received messages for the company.

**Query Parameters:**
- `limit` - Messages per page (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
    "data": [
        {
            "id": "uuid",
            "from_number": "5511999999999",
            "contact_name": "John Doe",
            "body": "Hello!",
            "timestamp": "2024-01-03T10:30:00Z",
            "is_group": false,
            "is_from_me": false
        }
    ],
    "limit": 50,
    "offset": 0
}
```

### Get Conversation with Number

```
GET /api/whatsapp/conversation/:phoneNumber?limit=50
```

Get all messages with a specific phone number.

**Response:**
```json
{
    "phone_number": "5511999999999",
    "data": [
        {
            "id": "uuid",
            "from_number": "5511999999999",
            "contact_name": "John Doe",
            "body": "Hello!",
            "timestamp": "2024-01-03T10:30:00Z"
        }
    ]
}
```

### Get Auto-Created Clients

```
GET /api/whatsapp/auto-clients
```

Get list of clients automatically created from WhatsApp messages.

**Response:**
```json
{
    "data": [
        {
            "id": "uuid",
            "connection_id": "uuid",
            "client_id": "uuid",
            "phone_number": "5511999999999",
            "created_at": "2024-01-03T10:30:00Z"
        }
    ]
}
```

### Disconnect WhatsApp

```
POST /api/whatsapp/disconnect
```

Disconnects the WhatsApp session.

**Response:**
```json
{
    "message": "Disconnected successfully"
}
```

## How It Works

### Authentication Flow

1. **User initiates connection** → POST `/api/whatsapp/initialize`
2. **Server generates QR code** → WhatsApp Web.js triggers `qr` event
3. **User scans QR code** → With their phone's WhatsApp
4. **Session established** → `ready` event fires, `is_connected` becomes `true`
5. **Messages start flowing** → `message` events are processed

### Message Reception

When a message arrives:

1. **Message event triggered** → WhatsApp Web.js `message` event
2. **Extract contact info** → Get phone number and contact name
3. **Save to database** → Store in `whatsapp_messages`
4. **Check for existing client** → Look in `clients` table
5. **Create if needed** → If new number, create client automatically
6. **Record mapping** → Save to `whatsapp_auto_clients`

### Client Auto-Creation

When receiving a message from a new number:

```javascript
// Automatic fields:
{
    company_id: "company-uuid",
    name: "Contact Name",        // From WhatsApp contact
    phone: "5511999999999",
    email: null,
    source: "whatsapp",          // Set automatically
    status: "lead",              // Set automatically
    notes: "Cliente criado automaticamente via WhatsApp em 03/01/2024"
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     HTTP Clients                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Express Routes Layer                        │
│         (src/presentation/routes/)                       │
│  • Authentication & Request Validation                  │
│  • HTTP Status Codes & Error Handling                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│             WhatsApp Service Layer                       │
│     (src/application/services/WhatsAppService.js)        │
│  • Business Logic                                        │
│  • Client Auto-Creation                                 │
│  • Message Processing                                   │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────▼──────────┐    ┌────────▼────────────┐
│  Client Manager    │    │  Repositories       │
│ (WhatsApp Web.js)  │    │  (Supabase)         │
│ • QR Code Gen      │    │ • Connections       │
│ • Session Mgmt     │    │ • Messages          │
│ • Events           │    │ • Auto Clients      │
└─────────┬──────────┘    └────────┬────────────┘
          │                        │
          │    ┌───────────────────┘
          │    │
          └────┼──────────────────────────────────┐
               │                                  │
          ┌────▼──────────────────────────────────▼──┐
          │         Supabase (Database)              │
          │  • whatsapp_connections                  │
          │  • whatsapp_messages                     │
          │  • whatsapp_auto_clients                 │
          │  • clients (existing)                    │
          └─────────────────────────────────────────┘
```

## File Structure

```
src/
├── utils/
│   └── whatsappClientManager.js          # WhatsApp client lifecycle
├── application/
│   └── services/
│       └── WhatsAppService.js            # Business logic
├── infrastructure/
│   └── repositories/
│       ├── SupabaseWhatsappConnectionRepository.js
│       ├── SupabaseWhatsappMessageRepository.js
│       └── SupabaseWhatsappAutoClientRepository.js
└── presentation/
    └── routes/
        └── whatsappRoutes.js             # HTTP endpoints

Root files:
├── WHATSAPP_SETUP.js                     # Setup guide
├── WHATSAPP_DATABASE_SETUP.sql           # Database schema
├── WHATSAPP_SERVER_INTEGRATION_EXAMPLE.js # Server integration example
└── WHATSAPP_README.md                    # This file
```

## Troubleshooting

### Problem: QR Code not showing

**Solution 1:** Check server logs for Puppeteer errors
```bash
npm install puppeteer
```

**Solution 2:** Ensure Chrome/Chromium is available
- Linux: `sudo apt-get install chromium-browser`
- Windows: Should be automatic via Puppeteer
- macOS: Should be automatic via Puppeteer

**Solution 3:** Check database connection
```sql
SELECT * FROM whatsapp_connections WHERE company_id = 'your-company-uuid';
```

### Problem: Session not persisting

**Issue:** `sessions/` folder has no write permissions

**Solution:**
```bash
chmod 755 sessions
```

Or check if folder exists:
```bash
mkdir -p sessions
```

### Problem: Clients not auto-created

**Solution 1:** Verify clients table structure
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'clients';
```

Must have: `company_id`, `name`, `phone`, `email`, `source`, `status`, `notes`

**Solution 2:** Check clientRepository methods
Ensure your repository has:
- `findByPhoneNumber(companyId, phoneNumber)`
- `create(clientData)`

**Solution 3:** Check logs for errors
```bash
npm run dev 2>&1 | grep -i whatsapp
```

### Problem: "WhatsApp is not connected"

**Solution:** Initialize connection first
```bash
curl -X POST http://localhost:3000/api/whatsapp/initialize \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Then check status:
```bash
curl http://localhost:3000/api/whatsapp/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Problem: Browser/Puppeteer errors on production

**Solution 1:** Use headless Chrome instead of Chromium
```javascript
// In whatsappClientManager.js
puppeteer: {
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable', // Linux
    args: ['--no-sandbox', '--disable-setuid-sandbox']
}
```

**Solution 2:** Use Docker
```dockerfile
FROM node:18-alpine

# Install Chromium
RUN apk add --no-cache \
    chromium \
    ca-certificates

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

## Security Considerations

### Authentication

✅ All routes require JWT token from Supabase Auth
✅ User's company is verified from token
✅ Users can only access their company's WhatsApp data

### Data Protection

✅ Phone numbers stored in database
✅ Sessions stored locally (not uploaded)
✅ Messages include `is_from_me` flag for tracking sent messages
✅ Timestamps all UTC

### Rate Limiting

Consider adding rate limiting:
```javascript
const rateLimit = require('express-rate-limit');

const whatsappLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,     // 1 minute
    max: 10                        // 10 requests per minute
});

app.post('/api/whatsapp/send', whatsappLimiter, ...);
```

## Performance Optimization

### Database Queries

Indexes are created on:
- `company_id` - Fast company lookups
- `from_number` - Fast message searches by sender
- `timestamp` - Fast sorting by time
- `is_connected` - Fast status checks

### Message Pagination

Always use pagination for large message sets:
```javascript
// Good
GET /api/whatsapp/messages?limit=50&offset=0

// Bad (might timeout)
GET /api/whatsapp/messages?limit=10000
```

### Session Caching

WhatsApp clients are cached in memory:
```javascript
Map<companyId, ClientInstance>
```

This means:
- ✅ Fast reconnects
- ✅ No session overhead after first auth
- ❌ Lost on server restart (but persisted in database)

## Deployment

### Option 1: VPS (Recommended)

```bash
git clone <repo>
cd project
npm install
npm run build
npm start
```

### Option 2: Docker

```bash
docker build -t crm-whatsapp .
docker run -p 3000:3000 crm-whatsapp
```

### Option 3: Railway/Render

1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `PORT` (default: 3000)
4. Deploy

### Option 4: Cloud Run / Lambda

Not recommended - WhatsApp Web.js requires persistent Chromium process

## Limitations & Notes

⚠️ **WhatsApp TOS**: This integration respects WhatsApp's Terms of Service  
⚠️ **Account Ban**: Excessive automation might trigger WhatsApp ban. Use responsibly.  
⚠️ **Chromium Required**: This isn't REST API - requires browser automation  
⚠️ **One Session Per Company**: Only one connection per company at a time  
⚠️ **Server Resources**: Each client uses ~100-200MB RAM  

## Future Enhancements

- [ ] Media support (images, audio, video)
- [ ] Group chat support
- [ ] Message scheduling
- [ ] Webhook notifications
- [ ] Auto-reply templates
- [ ] Message encryption
- [ ] Bulk message sending
- [ ] Analytics dashboard

## Support & Resources

- [WhatsApp Web.js Docs](https://wwebjs.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Puppeteer Docs](https://pptr.dev/)
- [Express.js Docs](https://expressjs.com/)

## License

Same as your main project.

---

**Last Updated:** January 3, 2026  
**Status:** Production Ready
