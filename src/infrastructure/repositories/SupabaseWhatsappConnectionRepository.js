/**
 * Supabase WhatsApp Connection Repository
 * Infrastructure layer - Data access for WhatsApp connections
 */

class SupabaseWhatsappConnectionRepository {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.tableName = 'whatsapp_connections';
    }

    /**
     * Find connection by company ID
     */
    async findByCompanyId(companyId) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('company_id', companyId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data || null;
    }

    /**
     * Find connection by ID
     */
    async findById(id) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data || null;
    }

    /**
     * Create or update connection
     */
    async upsert(companyId, userId, connectionData) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .upsert({
                company_id: companyId,
                user_id: userId,
                ...connectionData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'company_id' })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    /**
     * Update connection status
     */
    async updateStatus(companyId, statusData) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update({
                ...statusData,
                updated_at: new Date().toISOString()
            })
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    /**
     * Get all active connections
     */
    async findAllActive() {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('is_connected', true);

        if (error) {
            throw error;
        }

        return data || [];
    }

    /**
     * Get all connections (not just active ones)
     * Used for session restoration on server startup
     */
    async findAll() {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*');

        if (error) {
            throw error;
        }

        return data || [];
    }

    /**
     * Delete connection
     */
    async delete(companyId) {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('company_id', companyId);

        if (error) {
            throw error;
        }

        return true;
    }
}

module.exports = SupabaseWhatsappConnectionRepository;
