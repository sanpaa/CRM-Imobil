/**
 * CRM Imobil Server
 * Refactored with Onion Architecture
 * 
 * Architecture Layers:
 * - Domain: Entities and Repository Interfaces
 * - Application: Services/Use Cases
 * - Infrastructure: Repositories, Database
 * - Presentation: Routes, Controllers, Middleware
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const multer = require('multer');

// Import Onion Architecture components
const { SupabasePropertyRepository, SupabaseStoreSettingsRepository, SupabaseUserRepository } = require('./src/infrastructure/repositories');
const { PropertyService, StoreSettingsService, UserService } = require('./src/application/services');
const { createPropertyRoutes, createStoreSettingsRoutes, createUserRoutes, createAuthRoutes } = require('./src/presentation/routes');
const createAuthMiddleware = require('./src/presentation/middleware/authMiddleware');
const { SupabaseStorageService } = require('./src/infrastructure/storage');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for memory storage (files will be uploaded to Supabase Storage)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/', apiLimiter);

// Serve Angular app static files
app.use(express.static(path.join(__dirname, 'frontend/dist/frontend/browser'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Serve admin panel with restricted access
app.use('/admin-legacy', express.static(path.join(__dirname, 'admin'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Note: Local upload directory removed - images are stored in Supabase Storage

// ============================================
// Initialize Onion Architecture Dependencies
// ============================================

// Infrastructure Layer - Repositories
const propertyRepository = new SupabasePropertyRepository();
const storeSettingsRepository = new SupabaseStoreSettingsRepository();
const userRepository = new SupabaseUserRepository();

// Infrastructure Layer - Storage
const storageService = new SupabaseStorageService();

// Application Layer - Services
const propertyService = new PropertyService(propertyRepository);
const storeSettingsService = new StoreSettingsService(storeSettingsRepository);
const userService = new UserService(userRepository);

// Presentation Layer - Middleware
const authMiddleware = createAuthMiddleware(userService);

// ============================================
// API Routes (Presentation Layer)
// ============================================

// Property routes
app.use('/api/properties', createPropertyRoutes(propertyService));

// Statistics endpoint (uses property service)
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await propertyService.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Store settings routes
app.use('/api/store-settings', createStoreSettingsRoutes(storeSettingsService, authMiddleware));

// User management routes
app.use('/api/users', createUserRoutes(userService, authMiddleware));

// Authentication routes
app.use('/api/auth', createAuthRoutes(userService));

// Image upload endpoint - uploads to Supabase Storage
app.post('/api/upload', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
        }
        
        // Check if storage is available
        const storageAvailable = await storageService.isAvailable();
        if (!storageAvailable) {
            console.error('Supabase Storage is not available. Check bucket configuration.');
            return res.status(503).json({ 
                error: 'Serviço de armazenamento não disponível. Verifique se o bucket "property-images" existe no Supabase Storage.' 
            });
        }
        
        // Upload files to Supabase Storage
        const imageUrls = await storageService.uploadFiles(req.files);
        
        if (imageUrls.length === 0) {
            return res.status(500).json({ error: 'Erro ao fazer upload das imagens. Nenhuma imagem foi salva.' });
        }
        
        // Warn if some files failed but not all
        if (imageUrls.length < req.files.length) {
            console.warn(`Only ${imageUrls.length} of ${req.files.length} images were uploaded successfully.`);
        }
        
        res.json({ imageUrls });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Erro ao fazer upload das imagens' });
    }
});

// AI Suggestions endpoint  
app.post('/api/ai/suggest', apiLimiter, async (req, res) => {
    try {
        const { title, description, type, bedrooms, bathrooms, area, parking, city, neighborhood } = req.body;
        
        console.log('✨ AI REQUEST:', { title, description, type, bedrooms, area });
        
        if (!title && !description) {
            return res.status(400).json({ error: 'Digite título ou descrição' });
        }
        
        // SMART AI: Extract ALL data from text
        const text = (title || '') + ' ' + (description || '');
        const textLower = text.toLowerCase();
        
        // Extract bedrooms
        const bedroomsMatch = textLower.match(/(\d+)\s*(quarto|quart|qto|bedroom|qt)/i);
        const extractedBedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : (bedrooms || null);
        
        // Extract bathrooms  
        const bathroomsMatch = textLower.match(/(\d+)\s*(banheiro|banh|bathroom|wc|bwc)/i);
        const extractedBathrooms = bathroomsMatch ? parseInt(bathroomsMatch[1]) : (bathrooms || null);
        
        // Extract area
        const areaMatch = textLower.match(/(\d+)\s*(m²|m2|metros|metro)/i);
        const extractedArea = areaMatch ? parseInt(areaMatch[1]) : (area ? parseInt(area) : null);
        
        // Extract parking
        const parkingMatch = textLower.match(/(\d+)\s*(vaga|garagem|parking|garage)/i);
        const extractedParking = parkingMatch ? parseInt(parkingMatch[1]) : (parking || null);
        
        console.log('✅ EXTRACTED:', { bedrooms: extractedBedrooms, bathrooms: extractedBathrooms, area: extractedArea, parking: extractedParking });
        
        // Generate TITLE from description if missing
        let generatedTitle = title;
        if (!title && description) {
            const propertyType = type || 'Imóvel';
            const location = neighborhood || city || '';
            const rooms = extractedBedrooms ? `${extractedBedrooms} Quartos` : '';
            const areaInfo = extractedArea ? `${extractedArea}m²` : '';
            
            generatedTitle = `${propertyType} ${rooms} ${location} ${areaInfo}`.trim().replace(/\s+/g, ' ');
            
            // Add special features mentioned
            if (textLower.includes('piscina')) generatedTitle += ' com Piscina';
            if (textLower.includes('churrasqueira')) generatedTitle += ' e Churrasqueira';
            if (textLower.includes('varanda') || textLower.includes('sacada')) generatedTitle += ' com Varanda';
            
            // Limit to 80 chars
            if (generatedTitle.length > 80) {
                generatedTitle = generatedTitle.substring(0, 77) + '...';
            }
        }
        
        // Generate DESCRIPTION from title if missing
        let generatedDescription = description;
        if (!description && title) {
            const propertyType = type || 'imóvel';
            const features = [];
            
            if (extractedBedrooms) features.push(`${extractedBedrooms} ${extractedBedrooms > 1 ? 'quartos' : 'quarto'}`);
            if (extractedBathrooms) features.push(`${extractedBathrooms} ${extractedBathrooms > 1 ? 'banheiros' : 'banheiro'}`);
            if (extractedArea) features.push(`${extractedArea}m² de área`);
            if (extractedParking) features.push(`${extractedParking} ${extractedParking > 1 ? 'vagas' : 'vaga'} de garagem`);
            
            // Add detected amenities
            if (textLower.includes('piscina')) features.push('piscina');
            if (textLower.includes('churrasqueira')) features.push('churrasqueira');
            if (textLower.includes('varanda') || textLower.includes('sacada')) features.push('varanda gourmet');
            if (textLower.includes('armário') || textLower.includes('armarios')) features.push('armários embutidos');
            if (textLower.includes('suite') || textLower.includes('suíte')) features.push('suíte');
            
            const loc = neighborhood || city || 'excelente localização';
            const featuresText = features.length > 0 ? `com ${features.join(', ')}` : '';
            
            generatedDescription = `Excelente ${propertyType} ${featuresText}. Localizado em ${loc}, oferece conforto e praticidade para você e sua família. ${extractedArea ? `Imóvel de ${extractedArea}m²` : 'Espaço amplo'} em localização privilegiada. Agende sua visita e conheça este imóvel incrível!`;
        }
        
        // SMART PRICE SUGGESTION
        let priceHint = 'Consulte-nos para avaliação';
        const finalArea = extractedArea;
        if (finalArea) {
            const locationLower = ((city || '') + ' ' + (neighborhood || '')).toLowerCase();
            let pricePerM2 = 4000; // Default
            
            // Premium areas
            if (locationLower.includes('jardins') || locationLower.includes('itaim') || locationLower.includes('moema') || locationLower.includes('vila olimpia') || locationLower.includes('leblon') || locationLower.includes('ipanema')) {
                pricePerM2 = 10000;
            } else if (locationLower.includes('são paulo') || locationLower.includes('sp') || locationLower.includes('rio') || locationLower.includes('rj')) {
                pricePerM2 = 7000;
            } else if (locationLower.includes('centro')) {
                pricePerM2 = 5500;
            }
            
            // Adjust for property type
            if (type && type.toLowerCase().includes('apartamento')) {
                pricePerM2 *= 1.1; // Apartments slightly more expensive per m²
            }
            
            const estimatedPrice = Math.round(finalArea * pricePerM2);
            priceHint = `R$ ${estimatedPrice.toLocaleString('pt-BR')}`;
        }
        
        const suggestions = {
            title: generatedTitle || `${type || 'Imóvel'} em ${neighborhood || city || 'Ótima Localização'}`,
            description: generatedDescription || `Excelente ${type || 'imóvel'} em ${neighborhood || city || 'ótima localização'}. Agende sua visita!`,
            bedrooms: extractedBedrooms,
            bathrooms: extractedBathrooms,
            area: extractedArea,
            parking: extractedParking,
            priceHint: priceHint
        };
        
        console.log('✅ AI GENERATED:', suggestions);
        res.json(suggestions);
        
    } catch (error) {
        console.error('❌ AI ERROR:', error);
        res.status(500).json({ error: 'Erro ao gerar sugestões' });
    }
});

// CEP Lookup endpoint
app.get('/api/cep/:cep', async (req, res) => {
    try {
        const cep = req.params.cep.replace(/\D/g, '');
        if (cep.length !== 8) {
            return res.status(400).json({ error: 'CEP inválido' });
        }
        
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        
        if (response.data.erro) {
            return res.status(404).json({ error: 'CEP não encontrado' });
        }
        
        res.json({
            cep: response.data.cep,
            street: response.data.logradouro,
            neighborhood: response.data.bairro,
            city: response.data.localidade,
            state: response.data.uf,
            // Nominatim uses a simpler geocoding format
            address: `${response.data.logradouro}, ${response.data.bairro}, ${response.data.localidade}, ${response.data.uf}, Brasil`
        });
    } catch (error) {
        console.error('CEP lookup error:', error);
        res.status(500).json({ error: 'Erro ao buscar CEP' });
    }
});

// Geocoding endpoint (converts address to lat/lng)
app.post('/api/geocode', async (req, res) => {
    try {
        const { address } = req.body;
        
        // Using Nominatim (OpenStreetMap) for geocoding - free and no API key required
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                limit: 1
            },
            headers: {
                'User-Agent': 'CRMImobil/1.0'
            }
        });
        
        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            res.json({
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon)
            });
        } else {
            res.status(404).json({ error: 'Endereço não encontrado' });
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ error: 'Erro ao geocodificar endereço' });
    }
});

// Serve Angular app for all other routes (SPA routing)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/frontend/browser/index.html'));
});

// Start server
async function startServer() {
    try {
        // Initialize default admin user in database
        await userService.initializeDefaultAdmin();
        
        // Initialize default store settings
        await storeSettingsService.initializeSettings({
            name: 'CRM Imobiliária',
            description: 'Sua imobiliária de confiança'
        });
        
        app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log('CRM Imobil - Onion Architecture');
            console.log('='.repeat(50));
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Angular app: http://localhost:${PORT}`);
            console.log(`Legacy admin panel: http://localhost:${PORT}/admin-legacy`);
            console.log('');
            console.log('API Endpoints:');
            console.log('  - Properties: /api/properties');
            console.log('  - Statistics: /api/stats');
            console.log('  - Store Settings: /api/store-settings');
            console.log('  - Users: /api/users');
            console.log('  - Auth: /api/auth');
            console.log('='.repeat(50));
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();
