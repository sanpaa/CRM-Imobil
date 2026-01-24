/**
 * Supabase Google Calendar Event Repository
 * Infrastructure layer - Data access for Google Calendar visit event mappings
 */

class SupabaseGoogleCalendarEventRepository {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.tableName = 'google_calendar_events';
    }

    async findByVisitId(companyId, userId, visitId) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('company_id', companyId)
            .eq('user_id', userId)
            .eq('visit_id', visitId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data || null;
    }

    async upsert(companyId, userId, visitId, eventData) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .upsert({
                company_id: companyId,
                user_id: userId,
                visit_id: visitId,
                ...eventData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'company_id,user_id,visit_id' })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async deleteByVisitId(companyId, userId, visitId) {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('company_id', companyId)
            .eq('user_id', userId)
            .eq('visit_id', visitId);

        if (error) {
            throw error;
        }

        return true;
    }
}

module.exports = SupabaseGoogleCalendarEventRepository;
