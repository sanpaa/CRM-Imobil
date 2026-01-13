/**
 * Supabase WhatsApp Auto Client Repository
 * Infrastructure layer - Data access for automatically created WhatsApp clients
 */

class SupabaseWhatsappAutoClientRepository {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.tableName = 'whatsapp_auto_clients';
    }

    /**
     * Create auto client record
     */
    async create(connectionId, clientId, phoneNumber) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert({
                connection_id: connectionId,
                client_id: clientId,
                phone_number: phoneNumber,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    /**
     * Find auto client by connection ID and phone number
     */
    async findByConnectionAndPhone(connectionId, phoneNumber) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('connection_id', connectionId)
            .eq('phone_number', phoneNumber)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data || null;
    }

    /**
     * Get all auto clients for a connection
     */
    async findByConnectionId(connectionId) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('connection_id', connectionId);

        if (error) {
            throw error;
        }

        return data || [];
    }

    /**
     * Find by client ID
     */
    async findByClientId(clientId) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('client_id', clientId);

        if (error) {
            throw error;
        }

        return data || [];
    }

    /**
     * Delete auto client record
     */
    async delete(connectionId, phoneNumber) {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('connection_id', connectionId)
            .eq('phone_number', phoneNumber);

        if (error) {
            throw error;
        }

        return true;
    }
}

module.exports = SupabaseWhatsappAutoClientRepository;
