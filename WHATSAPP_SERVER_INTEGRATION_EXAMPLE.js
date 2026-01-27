/**
 * EXAMPLE SERVER INTEGRATION
 * 
 * This file shows how to integrate WhatsApp into your main Express server.
 * Copy the relevant parts into your actual server file.
 * 
 * This is NOT meant to be used as-is, but as a reference.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import your existing repositories and services
const {
    SupabasePropertyRepository,
    SupabaseStoreSettingsRepository,
    SupabaseUserRepository,
    SupabaseCompanyRepository,
    // NEW: WhatsApp repositories
    SupabaseWhatsappConnectionRepository,
    SupabaseWhatsappMessageRepository,
    SupabaseWhatsappAutoClientRepository
} = require('./src/infrastructure/repositories');

const {
    PropertyService,
    StoreSettingsService,
    UserService,
    // NEW: WhatsApp service
    WhatsAppService
} = require('./src/application/services');

// NEW: WhatsApp client manager
const WhatsAppClientManager = require('./src/utils/whatsappClientManager');

// Import your routes
const {
    createPropertyRoutes,
    createStoreSettingsRoutes,
    createUserRoutes,
    createAuthRoutes,
    createUploadRoutes,
    // NEW: WhatsApp routes
    createWhatsappRoutes
} = require('./src/presentation/routes');

// Import middleware and utilities
const createAuthMiddleware = require('./src/presentation/middleware/authMiddleware');
const supabase = require('./src/infrastructure/database/supabase');
const SupabaseStorageService = require('./src/infrastructure/storage/SupabaseStorageService');

// ============================================================================
// INITIALIZE APPLICATION
// ============================================================================

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================================
// INITIALIZE REPOSITORIES (Existing)
// ============================================================================

const userRepository = new SupabaseUserRepository(supabase);
const propertyRepository = new SupabasePropertyRepository(supabase);
const storeSettingsRepository = new SupabaseStoreSettingsRepository(supabase);
const companyRepository = new SupabaseCompanyRepository(supabase);

// ============================================================================
// INITIALIZE WHATSAPP COMPONENTS (NEW)
// ============================================================================

// Create WhatsApp repositories
const whatsappConnectionRepository = new SupabaseWhatsappConnectionRepository(supabase);
const whatsappMessageRepository = new SupabaseWhatsappMessageRepository(supabase);
const whatsappAutoClientRepository = new SupabaseWhatsappAutoClientRepository(supabase);

// Create WhatsApp client manager
const whatsappClientManager = new WhatsAppClientManager(whatsappConnectionRepository);

// Create WhatsApp service
// NOTE: You need to provide a clientRepository that has:
//   - findByPhoneNumber(companyId, phoneNumber)
//   - create(clientData)
const whatsappService = new WhatsAppService(
    whatsappClientManager,
    whatsappConnectionRepository,
    whatsappMessageRepository,
    whatsappAutoClientRepository,
    userRepository,
    clientRepository  // Your existing client repository
);

// ============================================================================
// INITIALIZE SERVICES (Existing)
// ============================================================================

const authMiddleware = createAuthMiddleware(userService);
const userService = new UserService(userRepository);
const storeSettingsService = new StoreSettingsService(storeSettingsRepository);
const storageService = new SupabaseStorageService(supabase);
const propertyService = new PropertyService(propertyRepository);

// ============================================================================
// REGISTER ROUTES (Existing + WhatsApp)
// ============================================================================

// Existing routes
app.use('/api/auth', createAuthRoutes(userService));
app.use('/api/users', createUserRoutes(userService, authMiddleware));
app.use('/api/properties', createPropertyRoutes(propertyService));
app.use('/api/store-settings', createStoreSettingsRoutes(storeSettingsService, authMiddleware));
app.use('/api/upload', createUploadRoutes(storageService));
app.use('/api/website', createWebsiteRoutes(websiteService, authMiddleware));
app.use('/api/site-config', createPublicSiteRoutes(publicSiteService));

// NEW: WhatsApp routes
app.use('/api/whatsapp', createWhatsappRoutes(whatsappService, authMiddleware));

// ============================================================================
// GRACEFUL SHUTDOWN (NEW)
// ============================================================================

// Make sure to disconnect WhatsApp clients when server shuts down
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Disconnecting WhatsApp clients...');
    await whatsappClientManager.destroyAll();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received. Disconnecting WhatsApp clients...');
    await whatsappClientManager.destroyAll();
    process.exit(0);
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 WhatsApp integration ready at http://localhost:${PORT}/api/whatsapp`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});

module.exports = app;
