/**
 * User Entity
 * Core domain entity representing a system user
 */
class User {
    constructor({
        id = null,
        username,
        email,
        passwordHash,
        role = 'user',
        active = true,
        createdAt = null,
        updatedAt = null
    }) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Validate the user entity
     * @returns {Object} validation result with isValid and errors
     */
    validate() {
        const errors = [];

        if (!this.username || this.username.trim().length < 3) {
            errors.push('Username must be at least 3 characters');
        }

        if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
            errors.push('Valid email is required');
        }

        if (!['admin', 'user', 'agent'].includes(this.role)) {
            errors.push('Invalid role');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if user has admin privileges
     */
    isAdmin() {
        return this.role === 'admin';
    }

    /**
     * Convert entity to plain object (excluding password hash)
     */
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            role: this.role,
            active: this.active,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Convert entity to plain object including password hash (for storage)
     */
    toFullJSON() {
        return {
            ...this.toJSON(),
            passwordHash: this.passwordHash
        };
    }

    /**
     * Create a User from a plain object
     */
    static fromJSON(data) {
        return new User(data);
    }
}

module.exports = User;
