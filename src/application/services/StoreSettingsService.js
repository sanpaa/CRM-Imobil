/**
 * Store Settings Service
 * Application layer - Business logic for store settings operations
 */
const StoreSettings = require('../../domain/entities/StoreSettings');

class StoreSettingsService {
    constructor(storeSettingsRepository) {
        this.storeSettingsRepository = storeSettingsRepository;
        // In-memory fallback settings for offline mode
        this._fallbackSettings = new StoreSettings({
            id: 'fallback',
            name: 'CRM Imobiliária',
            description: 'Sua imobiliária de confiança',
            primaryColor: '#004AAD',
            secondaryColor: '#F5A623'
        });
    }

    /**
     * Get store settings
     */
    async getSettings() {
        try {
            const settings = await this.storeSettingsRepository.get();
            
            // Return default settings if none exist or database is unavailable
            if (!settings) {
                return this._fallbackSettings;
            }
            
            return settings;
        } catch (error) {
            console.warn('Could not fetch store settings:', error.message);
            return this._fallbackSettings;
        }
    }

    /**
     * Update store settings
     */
    async updateSettings(settingsData) {
        // Validate the settings
        const settings = new StoreSettings(settingsData);
        const validation = settings.validate();
        
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const updated = await this.storeSettingsRepository.update(settingsData);
        
        // If database is unavailable, update fallback settings
        if (!updated) {
            Object.assign(this._fallbackSettings, settingsData);
            return this._fallbackSettings;
        }
        
        return updated;
    }

    /**
     * Initialize store settings with defaults
     */
    async initializeSettings(settingsData) {
        try {
            const existing = await this.storeSettingsRepository.get();
            
            if (existing) {
                return existing;
            }

            const settings = new StoreSettings({
                name: settingsData.name || 'CRM Imobiliária',
                logo: settingsData.logo || null,
                whatsapp: settingsData.whatsapp || null,
                email: settingsData.email || null,
                phone: settingsData.phone || null,
                address: settingsData.address || null,
                description: settingsData.description || 'Sua imobiliária de confiança',
                primaryColor: settingsData.primaryColor || '#004AAD',
                secondaryColor: settingsData.secondaryColor || '#F5A623'
            });

            const validation = settings.validate();
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            const created = await this.storeSettingsRepository.initialize(settings);
            
            // If database is unavailable, use fallback
            if (!created) {
                Object.assign(this._fallbackSettings, settings);
                console.log('Running in offline mode - using fallback store settings');
                return this._fallbackSettings;
            }
            
            return created;
        } catch (error) {
            console.warn('Could not initialize store settings:', error.message);
            console.log('Using fallback store settings');
            return this._fallbackSettings;
        }
    }
}

module.exports = StoreSettingsService;
