/**
 * User Service
 * Application layer - Business logic for user operations
 */
const User = require('../../domain/entities/User');
const bcrypt = require('bcryptjs');

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.activeTokens = new Set();
    }

    /**
     * Get all users
     */
    async getAllUsers() {
        const users = await this.userRepository.findAll();
        // Return users without password hashes
        return users.map(user => user.toJSON());
    }

    /**
     * Get a user by ID
     */
    async getUserById(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user.toJSON();
    }

    /**
     * Create a new user
     */
    async createUser(userData) {
        // Check if username already exists
        const existingUsername = await this.userRepository.findByUsername(userData.username);
        if (existingUsername) {
            throw new Error('Username already exists');
        }

        // Check if email already exists
        const existingEmail = await this.userRepository.findByEmail(userData.email);
        if (existingEmail) {
            throw new Error('Email already exists');
        }

        // Hash the password
        const passwordHash = bcrypt.hashSync(userData.password, 10);

        const user = new User({
            username: userData.username,
            email: userData.email,
            passwordHash: passwordHash,
            role: userData.role || 'user',
            active: userData.active !== false
        });

        const validation = user.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const createdUser = await this.userRepository.create(user);
        return createdUser.toJSON();
    }

    /**
     * Update an existing user
     */
    async updateUser(id, userData) {
        const existing = await this.userRepository.findById(id);
        if (!existing) {
            throw new Error('User not found');
        }

        // Check if new username already exists (excluding current user)
        if (userData.username && userData.username !== existing.username) {
            const existingUsername = await this.userRepository.findByUsername(userData.username);
            if (existingUsername) {
                throw new Error('Username already exists');
            }
        }

        // Check if new email already exists (excluding current user)
        if (userData.email && userData.email !== existing.email) {
            const existingEmail = await this.userRepository.findByEmail(userData.email);
            if (existingEmail) {
                throw new Error('Email already exists');
            }
        }

        const updateData = { ...userData };

        // Hash new password if provided
        if (userData.password) {
            updateData.passwordHash = bcrypt.hashSync(userData.password, 10);
            delete updateData.password;
        }

        const updatedUser = await this.userRepository.update(id, updateData);
        return updatedUser.toJSON();
    }

    /**
     * Delete a user
     */
    async deleteUser(id) {
        const existing = await this.userRepository.findById(id);
        if (!existing) {
            throw new Error('User not found');
        }

        return this.userRepository.delete(id);
    }

    /**
     * Authenticate user with username and password
     */
    async authenticate(username, password) {
        const user = await this.userRepository.findByUsername(username);
        
        if (!user || !user.active) {
            return null;
        }

        const isValid = bcrypt.compareSync(password, user.passwordHash);
        if (!isValid) {
            return null;
        }

        // Generate a simple token
        const token = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
        this.activeTokens.add(token);

        return {
            user: user.toJSON(),
            token
        };
    }

    /**
     * Verify a token
     */
    verifyToken(token) {
        return this.activeTokens.has(token);
    }

    /**
     * Invalidate a token (logout)
     */
    logout(token) {
        this.activeTokens.delete(token);
    }

    /**
     * Initialize default admin user if none exists
     */
    async initializeDefaultAdmin() {
        const adminUser = await this.userRepository.findByUsername('admin');
        
        if (!adminUser) {
            const passwordHash = bcrypt.hashSync('admin123', 10);
            const defaultAdmin = new User({
                username: 'admin',
                email: 'admin@crm-imobil.com',
                passwordHash: passwordHash,
                role: 'admin',
                active: true
            });

            await this.userRepository.create(defaultAdmin);
            console.log('Default admin user created (username: admin, password: admin123)');
        }
    }
}

module.exports = UserService;
