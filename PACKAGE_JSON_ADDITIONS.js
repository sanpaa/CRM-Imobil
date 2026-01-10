/**
 * PACKAGE.JSON ADDITIONS
 * 
 * Add these dependencies to your package.json
 * Then run: npm install
 */

{
  "dependencies": {
    // Existing dependencies (keep these)
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.38.4",
    "bcryptjs": "^2.4.3",
    "express-rate-limit": "^7.1.5",
    "multer": "^1.4.5-lts.1",
    
    // NEW: WhatsApp Integration Dependencies
    "whatsapp-web.js": "^1.26.0",      // Main WhatsApp automation library
    "qrcode": "^1.5.3",                 // QR code generation
    "puppeteer": "^21.6.1"              // Chrome/Chromium automation
  },

  "devDependencies": {
    // Existing dev dependencies (keep these)
    "nodemon": "^3.0.2",
    
    // Optional: Type definitions if you later convert to TypeScript
    "@types/express": "^4.17.21",
    "@types/qrcode": "^1.5.5",
    "@types/puppeteer": "^7.0.8"
  },

  "scripts": {
    // Existing scripts (keep these)
    "start": "node server.js",
    "dev": "nodemon server.js",
    
    // Optional: Add these for WhatsApp setup
    "whatsapp:setup": "node WHATSAPP_SETUP.js",
    "whatsapp:docs": "cat WHATSAPP_README.md"
  }
}

/**
 * INSTALLATION STEPS:
 * 
 * 1. Copy the dependencies above
 * 2. Add them to your package.json
 * 3. Run: npm install
 * 
 * This will install:
 * - whatsapp-web.js: ~15-20MB
 * - qrcode: ~0.5MB
 * - puppeteer: ~150-300MB (includes Chromium download)
 * 
 * Total size: ~200-350MB
 * 
 * On first install, Puppeteer will download Chromium (~150MB)
 * This can take a few minutes depending on your internet speed
 */

/**
 * PRODUCTION NOTES:
 * 
 * If deploying to Linux servers (AWS, DigitalOcean, Heroku, etc):
 * 
 * You may need to skip Chromium download and use system Chrome:
 * 
 * npm install --save puppeteer --no-save
 * npm install -g @puppeteer/browsers
 * 
 * Or use Docker (recommended):
 * 
 * FROM node:18-alpine
 * RUN apk add --no-cache chromium
 * ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
 * ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
 * ...
 */

/**
 * VERIFY INSTALLATION:
 * 
 * After npm install, run:
 * node -e "require('whatsapp-web.js')" && echo "✅ whatsapp-web.js installed"
 * node -e "require('qrcode')" && echo "✅ qrcode installed"
 * node -e "require('puppeteer')" && echo "✅ puppeteer installed"
 * 
 * If all three echo success messages, you're good to go!
 */
