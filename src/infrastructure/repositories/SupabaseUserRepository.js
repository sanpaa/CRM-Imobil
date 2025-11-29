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
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            throw new Error('Failed to fetch users');
        }

        return data.map(row => this._mapToEntity(row));
    }

    async findById(id) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Error fetching user:', error);
            throw new Error('Failed to fetch user');
        }

        return this._mapToEntity(data);
    }

    async findByUsername(username) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('username', username)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Error fetching user by username:', error);
            throw new Error('Failed to fetch user');
        }

        return this._mapToEntity(data);
    }

    async findByEmail(email) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Error fetching user by email:', error);
            throw new Error('Failed to fetch user');
        }

        return this._mapToEntity(data);
    }

    async create(user) {
        const row = this._mapToRow(user);

        const { data, error } = await supabase
            .from(this.tableName)
            .insert([row])
            .select()
            .single();

        if (error) {
            console.error('Error creating user:', error);
            throw new Error('Failed to create user');
        }

        return this._mapToEntity(data);
    }

    async update(id, userData) {
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
            console.error('Error updating user:', error);
            throw new Error('Failed to update user');
        }

        return this._mapToEntity(data);
    }

    async delete(id) {
        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting user:', error);
            throw new Error('Failed to delete user');
        }

        return true;
    }
}

module.exports = SupabaseUserRepository;
