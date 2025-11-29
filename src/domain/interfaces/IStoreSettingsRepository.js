/**
 * Store Settings Repository Interface
 * Defines the contract for store settings data access operations
 */
class IStoreSettingsRepository {
    /**
     * Get store settings
     * @returns {Promise<StoreSettings|null>}
     */
    async get() {
        throw new Error('Method not implemented');
    }

    /**
     * Update store settings
     * @param {Partial<StoreSettings>} data 
     * @returns {Promise<StoreSettings>}
     */
    async update(data) {
        throw new Error('Method not implemented');
    }

    /**
     * Initialize default store settings
     * @param {StoreSettings} settings 
     * @returns {Promise<StoreSettings>}
     */
    async initialize(settings) {
        throw new Error('Method not implemented');
    }
}

module.exports = IStoreSettingsRepository;
