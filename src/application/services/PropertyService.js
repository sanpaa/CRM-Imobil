/**
 * Property Service
 * Application layer - Business logic for property operations
 */
const Property = require('../../domain/entities/Property');
const { autoGeocodePropertyData } = require('../../utils/geocodingUtils');

class PropertyService {
    constructor(propertyRepository) {
        this.propertyRepository = propertyRepository;
    }

    /**
     * Sanitize coordinates - convert empty strings and invalid values to null,
     * but preserve undefined to prevent overwriting existing database values
     */
    _sanitizeCoordinates(data) {
        const sanitized = { ...data };
        
        const sanitizeCoord = (value) => {
            // If value is undefined, keep it undefined (don't convert to null)
            // This prevents overwriting existing coordinates in the database
            if (value === undefined) {
                return undefined;
            }
            // Convert empty strings, null, or whitespace-only strings to null
            if (value === '' || value === null || (typeof value === 'string' && value.trim() === '')) {
                return null;
            }
            // Check for NaN (Not a Number) which can occur from failed parsing
            if (typeof value === 'number' && isNaN(value)) {
                return null;
            }
            return value;
        };
        
        sanitized.latitude = sanitizeCoord(sanitized.latitude);
        sanitized.longitude = sanitizeCoord(sanitized.longitude);
        
        return sanitized;
    }

    /**
     * Get all properties
     */
    async getAllProperties() {
        return this.propertyRepository.findAll();
    }

    /**
     * Get a property by ID
     */
    async getPropertyById(id) {
        const property = await this.propertyRepository.findById(id);
        if (!property) {
            throw new Error('Property not found');
        }
        return property;
    }

    /**
     * Create a new property
     */
    async createProperty(propertyData) {
        // Automatically geocode if coordinates are missing
        const geocodedData = await autoGeocodePropertyData(propertyData);
        
        const sanitizedData = this._sanitizeCoordinates(geocodedData);
        const property = new Property({
            ...sanitizedData,
            createdAt: new Date().toISOString()
        });

        const validation = property.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        return this.propertyRepository.create(property);
    }

    /**
     * Update an existing property
     */
    async updateProperty(id, propertyData) {
        const existing = await this.propertyRepository.findById(id);
        if (!existing) {
            throw new Error('Property not found');
        }

        // Automatically geocode if coordinates are missing
        const geocodedData = await autoGeocodePropertyData(propertyData);
        
        const sanitizedData = this._sanitizeCoordinates(geocodedData);
        const updatedProperty = await this.propertyRepository.update(id, {
            ...sanitizedData,
            updatedAt: new Date().toISOString()
        });

        return updatedProperty;
    }

    /**
     * Delete a property
     */
    async deleteProperty(id) {
        const existing = await this.propertyRepository.findById(id);
        if (!existing) {
            throw new Error('Property not found');
        }

        return this.propertyRepository.delete(id);
    }

    /**
     * Get property statistics
     */
    async getStats() {
        return this.propertyRepository.getStats();
    }

    /**
     * Filter properties based on criteria
     */
    filterProperties(properties, filters) {
        return properties.filter(property => {
            // Text search
            if (filters.searchText) {
                const searchableText = `${property.title} ${property.description} ${property.neighborhood} ${property.city}`.toLowerCase();
                if (!searchableText.includes(filters.searchText.toLowerCase())) return false;
            }

            // Type filter
            if (filters.type && property.type !== filters.type) return false;

            // City filter
            if (filters.city && property.city !== filters.city) return false;

            // Bedrooms filter
            if (filters.bedrooms && property.bedrooms && property.bedrooms < filters.bedrooms) return false;

            // Price range filter
            if (filters.priceMin && property.price < filters.priceMin) return false;
            if (filters.priceMax && property.price > filters.priceMax) return false;

            return true;
        });
    }
}

module.exports = PropertyService;
