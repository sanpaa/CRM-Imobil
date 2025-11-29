/**
 * Store Settings Entity
 * Core domain entity representing store configuration
 */
class StoreSettings {
    constructor({
        id = null,
        name,
        logo = null,
        whatsapp = null,
        email = null,
        phone = null,
        address = null,
        description = null,
        primaryColor = '#004AAD',
        secondaryColor = '#F5A623',
        createdAt = null,
        updatedAt = null
    }) {
        this.id = id;
        this.name = name;
        this.logo = logo;
        this.whatsapp = whatsapp;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.description = description;
        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Validate the store settings entity
     * @returns {Object} validation result with isValid and errors
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Store name is required');
        }

        if (this.whatsapp && !/^\d{10,13}$/.test(this.whatsapp.replace(/\D/g, ''))) {
            errors.push('Invalid WhatsApp number format');
        }

        if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
            errors.push('Invalid email format');
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
            name: this.name,
            logo: this.logo,
            whatsapp: this.whatsapp,
            email: this.email,
            phone: this.phone,
            address: this.address,
            description: this.description,
            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create a StoreSettings from a plain object
     */
    static fromJSON(data) {
        return new StoreSettings(data);
    }
}

module.exports = StoreSettings;
