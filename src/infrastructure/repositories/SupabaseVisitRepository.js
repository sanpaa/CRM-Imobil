/**
 * Supabase Visit Repository
 * Infrastructure layer - Implements IVisitRepository using Supabase
 */
const IVisitRepository = require('../../domain/interfaces/IVisitRepository');
const Visit = require('../../domain/entities/Visit');
const supabase = require('../database/supabase');

class SupabaseVisitRepository extends IVisitRepository {
    constructor() {
        super();
        this.tableName = 'visits';
    }

    /**
     * Check if database is available
     */
    _isDatabaseAvailable() {
        return supabase !== null;
    }

    /**
     * Map database row to Visit entity
     */
    _mapToEntity(row) {
        if (!row) return null;
        return new Visit({
            id: row.id,
            dataVisita: row.data_visita,
            horaVisita: row.hora_visita,
            status: row.status,
            observacoes: row.observacoes,
            cliente: row.cliente,
            corretor: row.corretor,
            proprietario: row.proprietario,
            codigoReferencia: row.codigo_referencia,
            imoveis: row.imoveis || [],
            imobiliaria: row.imobiliaria,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    /**
     * Map entity to database row
     */
    _mapToRow(visit) {
        return {
            data_visita: visit.dataVisita,
            hora_visita: visit.horaVisita,
            status: visit.status,
            observacoes: visit.observacoes,
            cliente: visit.cliente,
            corretor: visit.corretor,
            proprietario: visit.proprietario,
            codigo_referencia: visit.codigoReferencia,
            imoveis: visit.imoveis,
            imobiliaria: visit.imobiliaria
        };
    }

    /**
     * Get all visits
     * @returns {Promise<Visit[]>}
     */
    async findAll() {
        if (!this._isDatabaseAvailable()) {
            console.warn('Database not available, returning empty array');
            return [];
        }

        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .order('data_visita', { ascending: false });

            if (error) throw error;

            return data ? data.map(row => this._mapToEntity(row)) : [];
        } catch (error) {
            console.error('Error fetching visits:', error);
            throw error;
        }
    }

    /**
     * Get paginated visits with filters
     * @param {Object} filters 
     * @param {number} limit 
     * @param {number} offset 
     * @returns {Promise<{data: Visit[], total: number, page: number, totalPages: number}>}
     */
    async findPaginated(filters, limit, offset) {
        if (!this._isDatabaseAvailable()) {
            console.warn('Database not available, returning empty result');
            return {
                data: [],
                total: 0,
                page: 1,
                totalPages: 0
            };
        }

        try {
            let query = supabase
                .from(this.tableName)
                .select('*', { count: 'exact' });

            // Status filter
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            // Date range filters
            if (filters.dateFrom) {
                query = query.gte('data_visita', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('data_visita', filters.dateTo);
            }

            // Client filter (search in cliente field)
            if (filters.client) {
                query = query.ilike('cliente', `%${filters.client}%`);
            }

            // Property code filter
            if (filters.propertyCode) {
                query = query.ilike('codigo_referencia', `%${filters.propertyCode}%`);
            }

            // Broker filter
            if (filters.broker) {
                query = query.ilike('corretor', `%${filters.broker}%`);
            }

            // Owner filter
            if (filters.owner) {
                query = query.ilike('proprietario', `%${filters.owner}%`);
            }

            // Real estate company filter
            if (filters.imobiliaria) {
                query = query.eq('imobiliaria', filters.imobiliaria);
            }

            // Text search
            if (filters.searchText) {
                query = query.or(
                    `cliente.ilike.%${filters.searchText}%,corretor.ilike.%${filters.searchText}%,proprietario.ilike.%${filters.searchText}%,codigo_referencia.ilike.%${filters.searchText}%,observacoes.ilike.%${filters.searchText}%`
                );
            }

            const { data, count, error } = await query
                .order('data_visita', { ascending: false })
                .order('hora_visita', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return {
                data: data ? data.map(row => this._mapToEntity(row)) : [],
                total: count || 0,
                page: Math.floor(offset / limit) + 1,
                totalPages: Math.ceil((count || 0) / limit)
            };
        } catch (error) {
            console.error('Error fetching paginated visits:', error);
            throw error;
        }
    }

    /**
     * Get a visit by ID
     * @param {string} id 
     * @returns {Promise<Visit|null>}
     */
    async findById(id) {
        if (!this._isDatabaseAvailable()) {
            console.warn('Database not available');
            return null;
        }

        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }

            return this._mapToEntity(data);
        } catch (error) {
            console.error('Error fetching visit:', error);
            throw error;
        }
    }

    /**
     * Create a new visit
     * @param {Visit} visit 
     * @returns {Promise<Visit>}
     */
    async create(visit) {
        if (!this._isDatabaseAvailable()) {
            console.warn('Database not available');
            return null;
        }

        try {
            visit.validate();
            
            const row = this._mapToRow(visit);
            
            const { data, error } = await supabase
                .from(this.tableName)
                .insert(row)
                .select()
                .single();

            if (error) throw error;

            return this._mapToEntity(data);
        } catch (error) {
            console.error('Error creating visit:', error);
            throw error;
        }
    }

    /**
     * Update an existing visit
     * @param {string} id 
     * @param {Partial<Visit>} data 
     * @returns {Promise<Visit|null>}
     */
    async update(id, data) {
        if (!this._isDatabaseAvailable()) {
            console.warn('Database not available');
            return null;
        }

        try {
            const updateData = {};
            
            if (data.dataVisita !== undefined) updateData.data_visita = data.dataVisita;
            if (data.horaVisita !== undefined) updateData.hora_visita = data.horaVisita;
            if (data.status !== undefined) updateData.status = data.status;
            if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
            if (data.cliente !== undefined) updateData.cliente = data.cliente;
            if (data.corretor !== undefined) updateData.corretor = data.corretor;
            if (data.proprietario !== undefined) updateData.proprietario = data.proprietario;
            if (data.codigoReferencia !== undefined) updateData.codigo_referencia = data.codigoReferencia;
            if (data.imoveis !== undefined) updateData.imoveis = data.imoveis;
            if (data.imobiliaria !== undefined) updateData.imobiliaria = data.imobiliaria;
            
            // Note: updated_at is automatically handled by database trigger

            const { data: result, error } = await supabase
                .from(this.tableName)
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }

            return this._mapToEntity(result);
        } catch (error) {
            console.error('Error updating visit:', error);
            throw error;
        }
    }

    /**
     * Delete a visit
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        if (!this._isDatabaseAvailable()) {
            console.warn('Database not available');
            return false;
        }

        try {
            const { error } = await supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Error deleting visit:', error);
            throw error;
        }
    }
}

module.exports = SupabaseVisitRepository;
