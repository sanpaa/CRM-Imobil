/**
 * User Service
 * Application layer - Business logic for user operations
 */
const User = require('../../domain/entities/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.activeTokens = new Set();
    }

    /**
     * Generate a cryptographically secure token
     */
    _generateSecureToken() {
        return crypto.randomBytes(32).toString('hex');
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
        return updatedUser ? updatedUser.toJSON() : null;
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
     * Falls back to environment variables or default admin if database is unavailable
     * 
     * For production, set ADMIN_USERNAME and ADMIN_PASSWORD environment variables
     */
    async authenticate(username, password) {
        // Fallback admin credentials - use environment variables in production
        const FALLBACK_ADMIN = process.env.ADMIN_USERNAME || 'admin';
        const FALLBACK_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

        const user = await this.userRepository.findByUsername(username);
        
        // If database returned a user, authenticate against it
        if (user) {
            if (!user.active) {
                return null;
            }

            const isValid = bcrypt.compareSync(password, user.passwordHash);
            if (!isValid) {
                return null;
            }

            // Generate a cryptographically secure token
            const token = this._generateSecureToken();
            this.activeTokens.add(token);

            return {
                user: user.toJSON(),
                token
            };
        }

        // Fallback to hardcoded admin (for offline mode or when DB is unavailable)
        if (username === FALLBACK_ADMIN && password === FALLBACK_PASSWORD) {
            const token = this._generateSecureToken();
            this.activeTokens.add(token);

            return {
                user: {
                    id: 'fallback-admin',
                    username: FALLBACK_ADMIN,
                    email: 'admin@crm-imobil.com',
                    role: 'admin',
                    active: true
                },
                token
            };
        }

        return null;
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
        try {
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

                const created = await this.userRepository.create(defaultAdmin);
                if (created) {
                    console.log('✅ Usuário admin padrão criado (usuário: admin, senha: admin123)');
                }
                // Silent if in offline mode - no error needed
            }
        } catch (error) {
            // Silent - we'll use fallback credentials
        }
    }
}

module.exports = UserService;
