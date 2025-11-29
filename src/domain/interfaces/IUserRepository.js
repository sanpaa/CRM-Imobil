/**
 * User Repository Interface
 * Defines the contract for user data access operations
 */
class IUserRepository {
    /**
     * Get all users
     * @returns {Promise<User[]>}
     */
    async findAll() {
        throw new Error('Method not implemented');
    }

    /**
     * Get a user by ID
     * @param {string} id 
     * @returns {Promise<User|null>}
     */
    async findById(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Get a user by username
     * @param {string} username 
     * @returns {Promise<User|null>}
     */
    async findByUsername(username) {
        throw new Error('Method not implemented');
    }

    /**
     * Get a user by email
     * @param {string} email 
     * @returns {Promise<User|null>}
     */
    async findByEmail(email) {
        throw new Error('Method not implemented');
    }

    /**
     * Create a new user
     * @param {User} user 
     * @returns {Promise<User>}
     */
    async create(user) {
        throw new Error('Method not implemented');
    }

    /**
     * Update an existing user
     * @param {string} id 
     * @param {Partial<User>} data 
     * @returns {Promise<User|null>}
     */
    async update(id, data) {
        throw new Error('Method not implemented');
    }

    /**
     * Delete a user
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        throw new Error('Method not implemented');
    }
}

module.exports = IUserRepository;
