/**
 * Supabase Website Repository
 * Data access layer for website layouts
 */

const { supabase } = require('../../infrastructure/database/supabase');

class SupabaseWebsiteRepository {
    async findAll(companyId, pageType = null) {
        let query = supabase
            .from('website_layouts')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (pageType) {
            query = query.eq('page_type', pageType);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching layouts:', error);
            throw error;
        }

        return data || [];
    }

    async findById(id) {
        const { data, error } = await supabase
            .from('website_layouts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching layout:', error);
            return null;
        }

        return data;
    }

    async findActive(companyId, pageType) {
        const { data, error } = await supabase
            .from('website_layouts')
            .select('*')
            .eq('company_id', companyId)
            .eq('page_type', pageType)
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('Error fetching active layout:', error);
            return null;
        }

        return data;
    }

    async create(layoutData) {
        const { data, error } = await supabase
            .from('website_layouts')
            .insert([layoutData])
            .select()
            .single();

        if (error) {
            console.error('Error creating layout:', error);
            throw error;
        }

        return data;
    }

    async update(id, layoutData) {
        const { data, error } = await supabase
            .from('website_layouts')
            .update(layoutData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating layout:', error);
            throw error;
        }

        return data;
    }

    async delete(id) {
        const { error } = await supabase
            .from('website_layouts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting layout:', error);
            throw error;
        }

        return true;
    }

    async deactivateByPageType(companyId, pageType) {
        const { error } = await supabase
            .from('website_layouts')
            .update({ is_active: false })
            .eq('company_id', companyId)
            .eq('page_type', pageType);

        if (error) {
            console.error('Error deactivating layouts:', error);
            throw error;
        }

        return true;
    }
}

module.exports = SupabaseWebsiteRepository;
