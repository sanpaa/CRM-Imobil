/**
 * Visit Service
 * Application layer - Business logic for visit operations
 */
const Visit = require('../../domain/entities/Visit');

class VisitService {
    constructor(visitRepository) {
        this.visitRepository = visitRepository;
    }

    /**
     * Get all visits
     */
    async getAllVisits() {
        return this.visitRepository.findAll();
    }

    /**
     * Get paginated visits with filters
     */
    async getPaginated(filters, page, limit) {
        const offset = (page - 1) * limit;
        return this.visitRepository.findPaginated(filters, limit, offset);
    }

    /**
     * Get a visit by ID
     */
    async getVisitById(id) {
        const visit = await this.visitRepository.findById(id);
        if (!visit) {
            throw new Error('Visit not found');
        }
        return visit;
    }

    /**
     * Create a new visit
     */
    async createVisit(data) {
        const visit = new Visit(data);
        return this.visitRepository.create(visit);
    }

    /**
     * Update a visit
     */
    async updateVisit(id, data) {
        // Check if visit exists
        const existingVisit = await this.visitRepository.findById(id);
        if (!existingVisit) {
            throw new Error('Visit not found');
        }

        // Create updated visit entity for validation
        const updatedVisitData = {
            ...existingVisit.toJSON(),
            ...data
        };
        const updatedVisit = new Visit(updatedVisitData);
        updatedVisit.validate();

        // Update in repository
        return this.visitRepository.update(id, data);
    }

    /**
     * Delete a visit
     */
    async deleteVisit(id) {
        const visit = await this.visitRepository.findById(id);
        if (!visit) {
            throw new Error('Visit not found');
        }
        return this.visitRepository.delete(id);
    }
}

module.exports = VisitService;
