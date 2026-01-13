/**
 * Property Entity
 * Core domain entity representing a real estate property
 */
class Property {
    constructor({
        id = null,
        title,
        description,
        type,
        price,

        // Financeiro
        condoFee = null,
        iptu = null,

        // Estrutura
        bedrooms = null,
        bathrooms = null,
        area = null,
        parking = null,
        floor = null,
        furnished = false,

        // Status
        status = 'pronto', // pronto | lancamento | em_obras

        // Imagens
        imageUrl = null,
        imageUrls = [],

        // Documentos
        documentUrls = [],

        // Endereço
        street = null,
        neighborhood = null,
        city = null,
        state = null,
        zipCode = null,
        latitude = null,
        longitude = null,

        // Contato / flags
        contact,
        featured = false,
        sold = false,

        createdAt = null,
        updatedAt = null
    }) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.price = price;

        this.condoFee = condoFee;
        this.iptu = iptu;

        this.bedrooms = bedrooms;
        this.bathrooms = bathrooms;
        this.area = area;
        this.parking = parking;
        this.floor = floor;
        this.furnished = furnished;

        this.status = status;

        this.imageUrl = imageUrl;
        this.imageUrls = imageUrls;

        this.documentUrls = documentUrls;

        this.street = street;
        this.neighborhood = neighborhood;
        this.city = city;
        this.state = state;
        this.zipCode = zipCode;
        this.latitude = latitude;
        this.longitude = longitude;

        this.contact = contact;
        this.featured = featured;
        this.sold = sold;

        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Validate the property entity
     * @returns {Object} validation result with isValid and errors
     */
    validate() {
        const errors = [];

        if (!this.title || this.title.trim().length === 0) {
            errors.push('Title is required');
        }

        if (!this.description || this.description.trim().length === 0) {
            errors.push('Description is required');
        }

        if (!this.type || this.type.trim().length === 0) {
            errors.push('Type is required');
        }

        if (this.price === null || this.price === undefined || this.price < 0) {
            errors.push('Price must be a positive number');
        }

        if (!this.contact || this.contact.trim().length === 0) {
            errors.push('Contact is required');
        }

        if (this.condoFee !== null && this.condoFee < 0) {
            errors.push('Condo fee must be a positive number');
        }

        if (this.iptu !== null && this.iptu < 0) {
            errors.push('IPTU must be a positive number');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Convert entity to plain object
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            type: this.type,
            price: this.price,

            condoFee: this.condoFee,
            iptu: this.iptu,

            bedrooms: this.bedrooms,
            bathrooms: this.bathrooms,
            area: this.area,
            parking: this.parking,
            floor: this.floor,
            furnished: this.furnished,

            status: this.status,

            imageUrl: this.imageUrl,
            imageUrls: this.imageUrls,

            documentUrls: this.documentUrls,

            street: this.street,
            neighborhood: this.neighborhood,
            city: this.city,
            state: this.state,
            zipCode: this.zipCode,
            latitude: this.latitude,
            longitude: this.longitude,

            contact: this.contact,
            featured: this.featured,
            sold: this.sold,

            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create a Property from a plain object
     */
    static fromJSON(data) {
        return new Property(data);
    }
}

module.exports = Property;
