/**
 * Supabase Store Settings Repository
 * Infrastructure layer - Implements IStoreSettingsRepository using Supabase
 */
const IStoreSettingsRepository = require('../../domain/interfaces/IStoreSettingsRepository');
const StoreSettings = require('../../domain/entities/StoreSettings');
const supabase = require('../database/supabase');

class SupabaseStoreSettingsRepository extends IStoreSettingsRepository {
    constructor() {
        super();
        this.tableName = 'store_settings';
    }

    /**
     * Map database row to StoreSettings entity
     */
    _mapToEntity(row) {
        if (!row) return null;
        return StoreSettings.fromJSON({
            id: row.id,
            name: row.name,
            logo: row.logo,
            whatsapp: row.whatsapp,
            email: row.email,
            phone: row.phone,
            address: row.address,
            description: row.description,
            primaryColor: row.primary_color,
            secondaryColor: row.secondary_color,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    /**
     * Map StoreSettings entity to database row
     */
    _mapToRow(settings) {
        return {
            name: settings.name,
            logo: settings.logo,
            whatsapp: settings.whatsapp,
            email: settings.email,
            phone: settings.phone,
            address: settings.address,
            description: settings.description,
            primary_color: settings.primaryColor,
            secondary_color: settings.secondaryColor
        };
    }

    async get() {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Error fetching store settings:', error);
            throw new Error('Failed to fetch store settings');
        }

        return this._mapToEntity(data);
    }

    async update(settingsData) {
        // First, check if settings exist
        const existing = await this.get();
        
        if (!existing) {
            // If no settings exist, create new ones
            return this.initialize(new StoreSettings(settingsData));
        }

        const updateData = {};
        
        // Only include defined fields
        if (settingsData.name !== undefined) updateData.name = settingsData.name;
        if (settingsData.logo !== undefined) updateData.logo = settingsData.logo;
        if (settingsData.whatsapp !== undefined) updateData.whatsapp = settingsData.whatsapp;
        if (settingsData.email !== undefined) updateData.email = settingsData.email;
        if (settingsData.phone !== undefined) updateData.phone = settingsData.phone;
        if (settingsData.address !== undefined) updateData.address = settingsData.address;
        if (settingsData.description !== undefined) updateData.description = settingsData.description;
        if (settingsData.primaryColor !== undefined) updateData.primary_color = settingsData.primaryColor;
        if (settingsData.secondaryColor !== undefined) updateData.secondary_color = settingsData.secondaryColor;

        const { data, error } = await supabase
            .from(this.tableName)
            .update(updateData)
            .eq('id', existing.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating store settings:', error);
            throw new Error('Failed to update store settings');
        }

        return this._mapToEntity(data);
    }

    async initialize(settings) {
        const row = this._mapToRow(settings);

        const { data, error } = await supabase
            .from(this.tableName)
            .insert([row])
            .select()
            .single();

        if (error) {
            console.error('Error initializing store settings:', error);
            throw new Error('Failed to initialize store settings');
        }

        return this._mapToEntity(data);
    }
}

module.exports = SupabaseStoreSettingsRepository;
