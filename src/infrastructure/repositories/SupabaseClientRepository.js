/**
 * Supabase Client Repository
 * Infrastructure layer - Data access for CRM clients/leads
 */

class SupabaseClientRepository {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.tableName = 'clients';
    }

    /**
     * Create a new client (lead)
     */
    async create(clientData) {
        const payload = {
            ...clientData,
            created_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert(payload)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    /**
     * Find client by phone number scoped by company
     */
    async findByPhoneNumber(companyId, phone) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('company_id', companyId)
            .eq('phone', phone)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            throw error;
        }

        return data || null;
    }
}

module.exports = SupabaseClientRepository;
