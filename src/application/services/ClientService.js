/**
 * Client Service
 * Application layer - Business logic for client/lead operations
 */

class ClientService {
    constructor(clientRepository) {
        this.clientRepository = clientRepository;
    }

    /**
     * Get all clients with pagination and filters
     */
    async getPaginated(filters, page, limit) {
        const offset = (page - 1) * limit;
        return this.clientRepository.findPaginated(filters, limit, offset);
    }

    /**
     * Get all clients (without pagination)
     */
    async getAllClients() {
        return this.clientRepository.findAll();
    }

    /**
     * Get a client by ID
     */
    async getClientById(id) {
        const client = await this.clientRepository.findById(id);
        if (!client) {
            throw new Error('Client not found');
        }
        return client;
    }

    /**
     * Create a new client
     */
    async createClient(clientData) {
        return this.clientRepository.create(clientData);
    }

    /**
     * Update an existing client
     */
    async updateClient(id, clientData) {
        const existing = await this.clientRepository.findById(id);
        if (!existing) {
            throw new Error('Client not found');
        }
        return this.clientRepository.update(id, clientData);
    }

    /**
     * Delete a client
     */
    async deleteClient(id) {
        const existing = await this.clientRepository.findById(id);
        if (!existing) {
            throw new Error('Client not found');
        }
        return this.clientRepository.delete(id);
    }

    /**
     * Find client by phone number
     */
    async findByPhoneNumber(companyId, phone) {
        return this.clientRepository.findByPhoneNumber(companyId, phone);
    }
}

module.exports = ClientService;
