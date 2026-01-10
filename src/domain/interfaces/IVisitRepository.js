/**
 * Visit Repository Interface
 * Defines the contract for visit data access operations
 * Infrastructure implementations must implement this interface
 */
class IVisitRepository {
    /**
     * Get all visits
     * @returns {Promise<Visit[]>}
     */
    async findAll() {
        throw new Error('Method not implemented');
    }

    /**
     * Get a visit by ID
     * @param {string} id 
     * @returns {Promise<Visit|null>}
     */
    async findById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Create a new visit
     * @param {Visit} visit 
     * @returns {Promise<Visit>}
     */
    async create(visit) {
        throw new Error('Method not implemented');
    }

    /**
     * Update an existing visit
     * @param {string} id 
     * @param {Partial<Visit>} data 
     * @returns {Promise<Visit|null>}
     */
    async update(id, data) {
        throw new Error('Method not implemented');
    }

    /**
     * Delete a visit
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        throw new Error('Method not implemented');
    }
}

module.exports = IVisitRepository;
