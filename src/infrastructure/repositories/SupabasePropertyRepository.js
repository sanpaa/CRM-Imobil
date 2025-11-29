/**
 * Supabase Property Repository
 * Infrastructure layer - Implements IPropertyRepository using Supabase
 */
const IPropertyRepository = require('../../domain/interfaces/IPropertyRepository');
const Property = require('../../domain/entities/Property');
const supabase = require('../database/supabase');

class SupabasePropertyRepository extends IPropertyRepository {
    constructor() {
        super();
        this.tableName = 'properties';
    }

    /**
     * Map database row to Property entity
     */
    _mapToEntity(row) {
        if (!row) return null;
        return Property.fromJSON({
            id: row.id,
            title: row.title,
            description: row.description,
            type: row.type,
            price: row.price,
            bedrooms: row.bedrooms,
            bathrooms: row.bathrooms,
            area: row.area,
            parking: row.parking,
            imageUrl: row.image_url,
            imageUrls: row.image_urls || [],
            street: row.street,
            neighborhood: row.neighborhood,
            city: row.city,
            state: row.state,
            zipCode: row.zip_code,
            latitude: row.latitude,
            longitude: row.longitude,
            contact: row.contact,
            featured: row.featured,
            sold: row.sold,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    /**
     * Map Property entity to database row
     */
    _mapToRow(property) {
        return {
            title: property.title,
            description: property.description,
            type: property.type,
            price: property.price,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            parking: property.parking,
            image_url: property.imageUrl,
            image_urls: property.imageUrls,
            street: property.street,
            neighborhood: property.neighborhood,
            city: property.city,
            state: property.state,
            zip_code: property.zipCode,
            latitude: property.latitude,
            longitude: property.longitude,
            contact: property.contact,
            featured: property.featured,
            sold: property.sold
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
                console.error('Error fetching properties:', error);
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
                console.error('Error fetching property:', error);
                return null;
            }

            return this._mapToEntity(data);
        } catch (err) {
            console.warn('Database unavailable:', err.message);
            return null;
        }
    }

    async create(property) {
        try {
            const row = this._mapToRow(property);

            const { data, error } = await supabase
                .from(this.tableName)
                .insert([row])
                .select()
                .single();

            if (error) {
                if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
                    console.warn('Database connection failed - cannot create property in offline mode');
                    return null;
                }
                console.error('Error creating property:', error);
                throw new Error('Failed to create property');
            }

            return this._mapToEntity(data);
        } catch (err) {
            if (err.message === 'Failed to create property') throw err;
            console.warn('Database unavailable:', err.message);
            return null;
        }
    }

    async update(id, propertyData) {
        try {
            const updateData = {};
            
            // Only include defined fields
            if (propertyData.title !== undefined) updateData.title = propertyData.title;
            if (propertyData.description !== undefined) updateData.description = propertyData.description;
            if (propertyData.type !== undefined) updateData.type = propertyData.type;
            if (propertyData.price !== undefined) updateData.price = propertyData.price;
            if (propertyData.bedrooms !== undefined) updateData.bedrooms = propertyData.bedrooms;
            if (propertyData.bathrooms !== undefined) updateData.bathrooms = propertyData.bathrooms;
            if (propertyData.area !== undefined) updateData.area = propertyData.area;
            if (propertyData.parking !== undefined) updateData.parking = propertyData.parking;
            if (propertyData.imageUrl !== undefined) updateData.image_url = propertyData.imageUrl;
            if (propertyData.imageUrls !== undefined) updateData.image_urls = propertyData.imageUrls;
            if (propertyData.street !== undefined) updateData.street = propertyData.street;
            if (propertyData.neighborhood !== undefined) updateData.neighborhood = propertyData.neighborhood;
            if (propertyData.city !== undefined) updateData.city = propertyData.city;
            if (propertyData.state !== undefined) updateData.state = propertyData.state;
            if (propertyData.zipCode !== undefined) updateData.zip_code = propertyData.zipCode;
            if (propertyData.latitude !== undefined) updateData.latitude = propertyData.latitude;
            if (propertyData.longitude !== undefined) updateData.longitude = propertyData.longitude;
            if (propertyData.contact !== undefined) updateData.contact = propertyData.contact;
            if (propertyData.featured !== undefined) updateData.featured = propertyData.featured;
            if (propertyData.sold !== undefined) updateData.sold = propertyData.sold;

            const { data, error } = await supabase
                .from(this.tableName)
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
                    console.warn('Database connection failed - cannot update property in offline mode');
                    return null;
                }
                console.error('Error updating property:', error);
                throw new Error('Failed to update property');
            }

            return this._mapToEntity(data);
        } catch (err) {
            if (err.message === 'Failed to update property') throw err;
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
                    console.warn('Database connection failed - cannot delete property in offline mode');
                    return false;
                }
                console.error('Error deleting property:', error);
                throw new Error('Failed to delete property');
            }

            return true;
        } catch (err) {
            if (err.message === 'Failed to delete property') throw err;
            console.warn('Database unavailable:', err.message);
            return false;
        }
    }

    async getStats() {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*');

            if (error) {
                if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
                    console.warn('Database connection failed - returning empty stats');
                    return { total: 0, available: 0, sold: 0, featured: 0, byType: {} };
                }
                console.error('Error fetching stats:', error);
                return { total: 0, available: 0, sold: 0, featured: 0, byType: {} };
            }

            const stats = {
                total: data.length,
                available: data.filter(p => !p.sold).length,
                sold: data.filter(p => p.sold).length,
                featured: data.filter(p => p.featured && !p.sold).length,
                byType: {}
            };

            // Count by type
            data.forEach(p => {
                const type = p.type || 'Outro';
                stats.byType[type] = (stats.byType[type] || 0) + 1;
            });

            return stats;
        } catch (err) {
            console.warn('Database unavailable:', err.message);
            return { total: 0, available: 0, sold: 0, featured: 0, byType: {} };
        }
    }
}

module.exports = SupabasePropertyRepository;
