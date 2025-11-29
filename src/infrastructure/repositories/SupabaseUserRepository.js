/**
 * Supabase User Repository
 * Infrastructure layer - Implements IUserRepository using Supabase
 */
const IUserRepository = require('../../domain/interfaces/IUserRepository');
const User = require('../../domain/entities/User');
const supabase = require('../database/supabase');

class SupabaseUserRepository extends IUserRepository {
    constructor() {
        super();
        this.tableName = 'users';
    }

    /**
     * Map database row to User entity
     */
    _mapToEntity(row) {
        if (!row) return null;
        return User.fromJSON({
            id: row.id,
            username: row.username,
            email: row.email,
            passwordHash: row.password_hash,
            role: row.role,
            active: row.active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    /**
     * Map User entity to database row
     */
    _mapToRow(user) {
        return {
            username: user.username,
            email: user.email,
            password_hash: user.passwordHash,
            role: user.role,
            active: user.active
        };
    }

    async findAll() {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
                    console.warn('Database connection failed - returning empty list');
                    return [];
                }
                console.error('Error fetching users:', error);
                return [];
            }

            return data.map(row => this._mapToEntity(row));
        } catch (err) {
            console.warn('Database unavailable:', err.message);
            return [];
        }
    }

    async findById(id) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
                    console.warn('Database connection failed - running in offline mode');
                    return null;
                }
                console.error('Error fetching user:', error);
                return null;
            }

            return this._mapToEntity(data);
        } catch (err) {
            console.warn('Database unavailable:', err.message);
            return null;
        }
    }

    async findByUsername(username) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('username', username)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                // Handle network errors gracefully
                if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
                    console.warn('Database connection failed - running in offline mode');
                    return null;
                }
                console.error('Error fetching user by username:', error);
                return null;
            }

            return this._mapToEntity(data);
        } catch (err) {
            console.warn('Database unavailable:', err.message);
            return null;
        }
    }

    async findByEmail(email) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('email', email)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
                    console.warn('Database connection failed - running in offline mode');
                    return null;
                }
                console.error('Error fetching user by email:', error);
                return null;
            }

            return this._mapToEntity(data);
        } catch (err) {
            console.warn('Database unavailable:', err.message);
            return null;
        }
    }

    async create(user) {
        try {
            const row = this._mapToRow(user);

            const { data, error } = await supabase
                .from(this.tableName)
                .insert([row])
                .select()
                .single();

            if (error) {
                if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
                    console.warn('Database connection failed - cannot create user in offline mode');
                    return null;
                }
                console.error('Error creating user:', error);
                throw new Error('Failed to create user');
            }

            return this._mapToEntity(data);
        } catch (err) {
            console.warn('Database unavailable:', err.message);
            return null;
        }
    }

    async update(id, userData) {
        try {
            const updateData = {};
            
            // Only include defined fields
            if (userData.username !== undefined) updateData.username = userData.username;
            if (userData.email !== undefined) updateData.email = userData.email;
            if (userData.passwordHash !== undefined) updateData.password_hash = userData.passwordHash;
            if (userData.role !== undefined) updateData.role = userData.role;
            if (userData.active !== undefined) updateData.active = userData.active;

            const { data, error } = await supabase
                .from(this.tableName)
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
                    console.warn('Database connection failed - cannot update user in offline mode');
                    return null;
                }
                console.error('Error updating user:', error);
                throw new Error('Failed to update user');
            }

            return this._mapToEntity(data);
        } catch (err) {
            console.warn('Database unavailable:', err.message);
            return null;
        }
    }

    async delete(id) {
        try {
            const { error } = await supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) {
                if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
                    console.warn('Database connection failed - cannot delete user in offline mode');
                    return false;
                }
                console.error('Error deleting user:', error);
                throw new Error('Failed to delete user');
            }

            return true;
        } catch (err) {
            console.warn('Database unavailable:', err.message);
            return false;
        }
    }
}

module.exports = SupabaseUserRepository;
