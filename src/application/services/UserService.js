/**
 * User Service
 * Application layer - Business logic for user operations
 */
const User = require('../../domain/entities/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Constants for fallback authentication
const DEFAULT_ADMIN_EMAIL = 'admin@crm-imobil.com';
const ENV_PASSWORD_PLACEHOLDER = 'your-secure-password-here';

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.activeTokens = new Set();
        this.tokenUserData = new Map(); // Store user data by token
    }

    /**
     * Generate a cryptographically secure token
     */
    _generateSecureToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Constant-time string comparison to prevent timing attacks
     * @private
     */
    _constantTimeCompare(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') {
            return false;
        }
        
        const bufferA = Buffer.from(a);
        const bufferB = Buffer.from(b);
        
        // Pad to same length to prevent length-based timing attacks
        const maxLength = Math.max(bufferA.length, bufferB.length);
        const paddedA = Buffer.alloc(maxLength);
        const paddedB = Buffer.alloc(maxLength);
        
        bufferA.copy(paddedA);
        bufferB.copy(paddedB);
        
        try {
            // This will always do the comparison, even if lengths differ
            const buffersEqual = crypto.timingSafeEqual(paddedA, paddedB);
            // Also check original lengths in constant time
            const lengthsEqual = bufferA.length === bufferB.length;
            return buffersEqual && lengthsEqual;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if a password string is a bcrypt hash
     * @private
     */
    _isBcryptHash(passwordHash) {
        return passwordHash.startsWith('$2a$') || 
               passwordHash.startsWith('$2b$') || 
               passwordHash.startsWith('$2y$');
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
        // Handle fallback admin user - these don't exist in the database
        if (id === 'fallback-admin') {
            // Fallback admin credentials - use environment variables in production
            const FALLBACK_ADMIN = process.env.ADMIN_USERNAME || 'admin';
            return {
                id: 'fallback-admin',
                username: FALLBACK_ADMIN,
                email: DEFAULT_ADMIN_EMAIL,
                role: 'admin',
                active: true,
                company_id: null
            };
        }
        
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
     * Authenticate user with username or email and password
     * Falls back to environment variables or default admin if database is unavailable
     * 
     * @param {string} username - Username or email address for authentication
     * @param {string} password - User password
     * @returns {Object|null} Authentication result with user and token, or null if invalid
     * 
     * For production, set ADMIN_USERNAME and ADMIN_PASSWORD environment variables
     */
    async authenticate(username, password) {
        // Fallback admin credentials - use environment variables in production
        const FALLBACK_ADMIN = process.env.ADMIN_USERNAME || 'admin';
        // Ignore placeholder password from .env template
        const envPassword = process.env.ADMIN_PASSWORD;
        const FALLBACK_PASSWORD = (envPassword && envPassword !== ENV_PASSWORD_PLACEHOLDER) 
            ? envPassword 
            : 'admin123';

        // Try to find user by identifier (can be username or email)
        // First, try treating identifier as username
        let user = await this.userRepository.findByUsername(username);
        
        // If not found as username, try treating identifier as email
        if (!user) {
            user = await this.userRepository.findByEmail(username);
        }
        
        // If database returned a user, authenticate against it
        if (user && user.passwordHash) {
            if (!user.active) {
                return null;
            }

            let isValid = false;
            
            // Check if the stored value looks like a bcrypt hash
            if (this._isBcryptHash(user.passwordHash)) {
                try {
                    isValid = bcrypt.compareSync(password, user.passwordHash);
                } catch (error) {
                    console.error('bcrypt comparison error:', error.message);
                    // If bcrypt fails with a valid-looking hash, this is a real error
                    return null;
                }
            } else {
                // Not a bcrypt hash, treat as plaintext (legacy database)
                console.warn(`[SECURITY] User '${user.username}' has plaintext password in database - run migration-hash-passwords.sql to hash passwords with bcrypt`);
                isValid = this._constantTimeCompare(user.passwordHash, password);
            }
            
            if (!isValid) {
                return null;
            }

            // Generate a cryptographically secure token
            const token = this._generateSecureToken();
            this.activeTokens.add(token);
            this.tokenUserData.set(token, {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                active: user.active,
                company_id: user.company_id
            });

            return {
                user: user.toJSON(),
                token
            };
        }

        // Fallback to hardcoded admin (for offline mode or when DB is unavailable)
        // Support both username and email for fallback authentication
        if ((username === FALLBACK_ADMIN || username === DEFAULT_ADMIN_EMAIL) && password === FALLBACK_PASSWORD) {
            const token = this._generateSecureToken();
            this.activeTokens.add(token);
            
            // Store user data in tokenUserData map for later retrieval
            const fallbackUserData = {
                id: 'fallback-admin',
                username: FALLBACK_ADMIN,
                email: DEFAULT_ADMIN_EMAIL,
                role: 'admin',
                active: true,
                company_id: null // Fallback admin has no company_id
            };
            this.tokenUserData.set(token, fallbackUserData);

            return {
                user: fallbackUserData,
                token
            };
        }

        // ============================================================================
        // SECURITY WARNING: Hardcoded Credential Fallback
        // ============================================================================
        // This is a TEMPORARY fallback for Alan Carmo credentials to maintain
        // backwards compatibility while the database password is being migrated.
        //
        // ACTION REQUIRED:
        // 1. Run migration-hash-passwords.sql in Supabase to hash the password
        // 2. After migration, REMOVE this entire fallback block (lines 283-312)
        // 3. User will then authenticate using bcrypt-hashed password from database
        //
        // This fallback should be removed in production to prevent security issues.
        // ============================================================================
        
        // Fallback for Alan Carmo credentials (from localStorage data)
        if ((username === 'Alan Carmo' || username === 'alancarmocorretor@gmail.com') && password === 'alan123') {
            console.warn('[SECURITY] Using hardcoded credential fallback for Alan Carmo - run migration-hash-passwords.sql and remove this code');
            
            const token = this._generateSecureToken();
            this.activeTokens.add(token);
            this.tokenUserData.set(token, {
                id: 'dcffbe62-4247-4e6d-98dc-50097c0d6a64',
                username: 'Alan Carmo',
                email: 'alancarmocorretor@gmail.com',
                role: 'admin',
                active: true,
                company_id: '3b1bee0c-cbee-4de1-88f1-d6e890f4c995'
            });

            return {
                user: {
                    id: 'dcffbe62-4247-4e6d-98dc-50097c0d6a64',
                    username: 'Alan Carmo',
                    email: 'alancarmocorretor@gmail.com',
                    role: 'admin',
                    active: true,
                    company_id: '3b1bee0c-cbee-4de1-88f1-d6e890f4c995'
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
     * Get user data from token
     */
    getUserFromToken(token) {
        return this.tokenUserData.get(token);
    }

    /**
     * Invalidate a token (logout)
     */
    logout(token) {
        this.activeTokens.delete(token);
        this.tokenUserData.delete(token);
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
                    email: DEFAULT_ADMIN_EMAIL,
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
