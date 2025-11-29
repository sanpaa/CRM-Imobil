/**
 * Store Settings Service
 * Application layer - Business logic for store settings operations
 */
const StoreSettings = require('../../domain/entities/StoreSettings');

class StoreSettingsService {
    constructor(storeSettingsRepository) {
        this.storeSettingsRepository = storeSettingsRepository;
    }

    /**
     * Get store settings
     */
    async getSettings() {
        const settings = await this.storeSettingsRepository.get();
        
        // Return default settings if none exist
        if (!settings) {
            return new StoreSettings({
                name: 'CRM Imobiliária',
                description: 'Sua imobiliária de confiança',
                primaryColor: '#004AAD',
                secondaryColor: '#F5A623'
            });
        }
        
        return settings;
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

        return this.storeSettingsRepository.update(settingsData);
    }

    /**
     * Initialize store settings with defaults
     */
    async initializeSettings(settingsData) {
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

        return this.storeSettingsRepository.initialize(settings);
    }
}

module.exports = StoreSettingsService;
