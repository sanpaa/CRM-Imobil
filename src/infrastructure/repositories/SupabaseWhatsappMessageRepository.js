/**
 * Supabase WhatsApp Message Repository
 * Infrastructure layer - Data access for WhatsApp messages
 */

class SupabaseWhatsappMessageRepository {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.tableName = 'whatsapp_messages';
    }

    /**
     * Save incoming message
     */
    async saveMessage(messageData) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert({
                ...messageData,
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
     * Get messages by connection ID
     */
    async findByConnectionId(connectionId, limit = 50, offset = 0) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('connection_id', connectionId)
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw error;
        }

        return data || [];
    }

    /**
     * Get messages by company ID
     */
    async findByCompanyId(companyId, limit = 50, offset = 0) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('company_id', companyId)
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw error;
        }

        return data || [];
    }

    /**
     * Get messages by phone number
     */
    async findByPhoneNumber(companyId, phoneNumber, limit = 50) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('company_id', companyId)
            .eq('from_number', phoneNumber)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return data || [];
    }

    /**
     * Find message by message ID
     */
    async findByMessageId(messageId) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('message_id', messageId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data || null;
    }

    /**
     * Get conversation between two numbers
     */
    async getConversation(companyId, phoneNumber1, phoneNumber2, limit = 50) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('company_id', companyId)
            .or(`from_number.eq.${phoneNumber1},from_number.eq.${phoneNumber2}`)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return data || [];
    }

    /**
     * Get message count for a connection
     */
    async countByConnectionId(connectionId) {
        const { count, error } = await this.supabase
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .eq('connection_id', connectionId);

        if (error) {
            throw error;
        }

        return count || 0;
    }

    /**
     * Get filtered messages by company ID (only messages with real estate keywords)
     * Excludes group messages and messages from self
     */
    async findFilteredByCompanyId(companyId, limit = 50, offset = 0) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('company_id', companyId)
            .eq('is_group', false)
            .eq('is_from_me', false)
            .eq('has_keywords', true)
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw error;
        }

        return data || [];
    }
}

module.exports = SupabaseWhatsappMessageRepository;
