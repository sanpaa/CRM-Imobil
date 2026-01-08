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

    /**
     * Get all clients
     */
    async findAll() {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data || [];
    }

    /**
     * Find client by ID
     */
    async findById(id) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }

        return data;
    }

    /**
     * Find clients with pagination and filters
     */
    async findPaginated(filters, limit, offset) {
        let query = this.supabase
            .from(this.tableName)
            .select('*', { count: 'exact' });

        // Company filter (required for multi-tenant)
        if (filters.companyId) {
            query = query.eq('company_id', filters.companyId);
        }

        // Text search across name, email, phone
        if (filters.searchText) {
            query = query.or(
                `name.ilike.%${filters.searchText}%,email.ilike.%${filters.searchText}%,phone.ilike.%${filters.searchText}%`
            );
        }

        // Name filter
        if (filters.name) {
            query = query.ilike('name', `%${filters.name}%`);
        }

        // Email filter
        if (filters.email) {
            query = query.ilike('email', `%${filters.email}%`);
        }

        // Phone filter
        if (filters.phone) {
            query = query.ilike('phone', `%${filters.phone}%`);
        }

        // Date range filters
        if (filters.createdAfter) {
            query = query.gte('created_at', filters.createdAfter);
        }
        if (filters.createdBefore) {
            query = query.lte('created_at', filters.createdBefore);
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            data: data || [],
            total: count || 0,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil((count || 0) / limit),
        };
    }

    /**
     * Update a client
     */
    async update(id, clientData) {
        const updateData = {
            ...clientData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from(this.tableName)
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }

        return data;
    }

    /**
     * Delete a client
     */
    async delete(id) {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) throw error;

        return true;
    }
}

module.exports = SupabaseClientRepository;
