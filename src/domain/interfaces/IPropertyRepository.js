/**
 * Property Repository Interface
 * Defines the contract for property data access operations
 * Infrastructure implementations must implement this interface
 */
class IPropertyRepository {
    /**
     * Get all properties
     * @returns {Promise<Property[]>}
     */
    async findAll() {
        throw new Error('Method not implemented');
    }

    /**
     * Get a property by ID
     * @param {string} id 
     * @returns {Promise<Property|null>}
     */
    async findById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Create a new property
     * @param {Property} property 
     * @returns {Promise<Property>}
     */
    async create(property) {
        throw new Error('Method not implemented');
    }

    /**
     * Update an existing property
     * @param {string} id 
     * @param {Partial<Property>} data 
     * @returns {Promise<Property|null>}
     */
    async update(id, data) {
        throw new Error('Method not implemented');
    }

    /**
     * Delete a property
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Get statistics about properties
     * @returns {Promise<Object>}
     */
    async getStats() {
        throw new Error('Method not implemented');
    }
}

module.exports = IPropertyRepository;
