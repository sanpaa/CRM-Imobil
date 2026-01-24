/**
 * Supabase Google Calendar Connection Repository
 * Infrastructure layer - Data access for Google Calendar connections
 */

class SupabaseGoogleCalendarConnectionRepository {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.tableName = 'google_calendar_connections';
    }

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

    async findByUserId(companyId, userId) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('company_id', companyId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data || null;
    }

    async upsert(companyId, userId, connectionData) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .upsert({
                company_id: companyId,
                user_id: userId,
                ...connectionData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'company_id,user_id' })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async update(companyId, userId, updateData) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('company_id', companyId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async delete(companyId, userId) {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('company_id', companyId)
            .eq('user_id', userId);

        if (error) {
            throw error;
        }

        return true;
    }
}

module.exports = SupabaseGoogleCalendarConnectionRepository;
