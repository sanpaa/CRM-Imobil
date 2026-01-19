/**
 * Search Service
 * Application layer - Global search across multiple entities
 */

const supabase = require('../../infrastructure/database/supabase');

const DEFAULT_CACHE_TTL_MS = 60 * 1000;
const DEFAULT_QUERY_TIMEOUT_MS = 300;
const DEFAULT_PER_ENTITY_LIMIT = 5;
const DEFAULT_MAX_CANDIDATES = 20;
const DEFAULT_MAX_CACHE_ENTRIES = 500;

const normalizeValue = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');

const parseDateValue = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const buildRecencyScore = (dateValue) => {
    const date = parseDateValue(dateValue);
    if (!date) return 0;
    const daysAgo = Math.max(0, (Date.now() - date.getTime()) / 86400000);
    return 1 / (1 + daysAgo);
};

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

class SearchService {
    constructor(options = {}) {
        this.cacheTtlMs = options.cacheTtlMs || DEFAULT_CACHE_TTL_MS;
        this.queryTimeoutMs = options.queryTimeoutMs || DEFAULT_QUERY_TIMEOUT_MS;
        this.perEntityLimit = options.perEntityLimit || DEFAULT_PER_ENTITY_LIMIT;
        this.maxCandidates = options.maxCandidates || DEFAULT_MAX_CANDIDATES;
        this.maxCacheEntries = options.maxCacheEntries || DEFAULT_MAX_CACHE_ENTRIES;
        this.cache = new Map();
    }

    async search({ tenantId, user, term }) {
        const normalizedTerm = normalizeValue(term);
        const rawTerm = String(term || '').trim();

        if (!normalizedTerm) {
            return this._emptyResponse();
        }

        const cacheKey = `${tenantId || 'public'}:${normalizedTerm}`;
        const cached = this._getCache(cacheKey);
        await this._logSearch({ tenantId, user, term: rawTerm, normalizedTerm, cacheHit: !!cached });

        if (cached) {
            return cached;
        }

        if (supabase.isOfflineMode) {
            const emptyResult = this._emptyResponse();
            this._setCache(cacheKey, emptyResult);
            return emptyResult;
        }

        const [clientesResult, imoveisResult, visitasResult, negociosResult] = await Promise.allSettled([
            this._withTimeout(() => this._searchClients(tenantId, rawTerm), 'clients'),
            this._withTimeout(() => this._searchProperties(tenantId, rawTerm), 'properties'),
            this._withTimeout(() => this._searchVisits(tenantId, rawTerm), 'visits'),
            this._withTimeout(() => this._searchNegocios(tenantId, rawTerm), 'negocios')
        ]);

        const clientes = this._rankAndLimit(
            clientesResult.status === 'fulfilled' ? clientesResult.value : [],
            normalizedTerm,
            ['name', 'email', 'phone'],
            'created_at'
        ).map((client) => ({
            id: client.id,
            nome: client.name || client.nome,
            telefone: client.phone || client.telefone || client.mobile
        }));

        const imoveis = this._rankAndLimit(
            imoveisResult.status === 'fulfilled' ? imoveisResult.value : [],
            normalizedTerm,
            ['title', 'reference_code', 'codigo_referencia', 'code', 'street', 'neighborhood', 'city'],
            'created_at'
        ).map((property) => ({
            id: property.id,
            referencia: pickFirst(
                property.reference_code,
                property.codigo_referencia,
                property.codigo,
                property.referencia,
                property.code
            ),
            endereco: pickFirst(
                property.address,
                property.street,
                this._formatAddress(property)
            )
        }));

        const negocios = this._rankAndLimit(
            negociosResult.status === 'fulfilled' ? negociosResult.value : [],
            normalizedTerm,
            ['status', 'codigo', 'codigo_referencia', 'reference_code', 'cliente', 'client'],
            'created_at'
        ).map((negocio) => ({
            id: negocio.id,
            status: negocio.status,
            cliente: negocio.cliente || negocio.client,
            codigo: pickFirst(
                negocio.codigo,
                negocio.codigo_referencia,
                negocio.reference_code,
                negocio.code
            )
        }));

        const visitas = this._rankAndLimit(
            visitasResult.status === 'fulfilled' ? visitasResult.value : [],
            normalizedTerm,
            ['cliente', 'client', 'corretor', 'broker', 'data_visita', 'scheduled_date', 'status'],
            ['data_visita', 'scheduled_date', 'created_at']
        ).map((visit) => ({
            id: visit.id,
            data: pickFirst(visit.data_visita, visit.scheduled_date),
            cliente: visit.cliente || visit.client,
            corretor: visit.corretor || visit.broker
        }));

        const response = {
            clientes,
            imoveis,
            negocios,
            visitas
        };

        this._setCache(cacheKey, response);
        return response;
    }

    _emptyResponse() {
        return {
            clientes: [],
            imoveis: [],
            negocios: [],
            visitas: []
        };
    }

    _getCache(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (entry.expiresAt <= Date.now()) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }

    _setCache(key, value) {
        if (this.cache.size >= this.maxCacheEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.cacheTtlMs
        });
    }

    async _withTimeout(fn, label) {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`Search timeout: ${label}`)), this.queryTimeoutMs);
        });

        try {
            return await Promise.race([fn(), timeoutPromise]);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async _runWithTenantFallback(buildQuery, tenantId) {
        let result = await buildQuery(true);
        if (result.error && tenantId && this._isMissingColumnError(result.error, 'company_id')) {
            result = await buildQuery(false);
        }
        if (result.error) {
            throw result.error;
        }
        return result.data || [];
    }

    _isMissingColumnError(error, columnName) {
        const message = error.message || '';
        return message.toLowerCase().includes(`column "${columnName}" does not exist`);
    }

    async _searchClients(tenantId, term) {
        return this._runWithTenantFallback((useTenant) => {
            let query = supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(this.maxCandidates);

            if (useTenant && tenantId) {
                query = query.eq('company_id', tenantId);
            }

            if (term) {
                query = query.or(
                    `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
                );
            }

            return query;
        }, tenantId);
    }

    async _searchProperties(tenantId, term) {
        return this._runWithTenantFallback((useTenant) => {
            let query = supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(this.maxCandidates);

            if (useTenant && tenantId) {
                query = query.eq('company_id', tenantId);
            }

            if (term) {
                query = query.or(
                    `title.ilike.%${term}%,description.ilike.%${term}%,street.ilike.%${term}%,neighborhood.ilike.%${term}%,city.ilike.%${term}%`
                );
            }

            return query;
        }, tenantId);
    }

    async _searchVisits(tenantId, term) {
        return this._runWithTenantFallback((useTenant) => {
            let query = supabase
                .from('visits')
                .select('*')
                .order('data_visita', { ascending: false })
                .limit(this.maxCandidates);

            if (useTenant && tenantId) {
                query = query.eq('company_id', tenantId);
            }

            if (term) {
                query = query.or(
                    `cliente.ilike.%${term}%,corretor.ilike.%${term}%,codigo_referencia.ilike.%${term}%,status.ilike.%${term}%,data_visita.ilike.%${term}%`
                );
            }

            return query;
        }, tenantId);
    }

    async _searchNegocios(tenantId, term) {
        try {
            return await this._runWithTenantFallback((useTenant) => {
                let query = supabase
                    .from('negocios')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(this.maxCandidates);

                if (useTenant && tenantId) {
                    query = query.eq('company_id', tenantId);
                }

                if (term) {
                    query = query.or(
                        `status.ilike.%${term}%,codigo.ilike.%${term}%,cliente.ilike.%${term}%`
                    );
                }

                return query;
            }, tenantId);
        } catch (error) {
            if (String(error.message || '').toLowerCase().includes('does not exist')) {
                return [];
            }
            throw error;
        }
    }

    _rankAndLimit(items, normalizedTerm, fields, dateField) {
        if (!items || items.length === 0) return [];
        const termDigits = normalizeDigits(normalizedTerm);

        const scored = items.map((item) => {
            let matchScore = 0;
            for (const field of fields) {
                const value = item[field];
                if (value === undefined || value === null) continue;

                const normalizedValue = normalizeValue(value);
                if (!normalizedValue) continue;

                if (normalizedValue === normalizedTerm) {
                    matchScore = Math.max(matchScore, 3);
                } else if (normalizedValue.startsWith(normalizedTerm)) {
                    matchScore = Math.max(matchScore, 2);
                } else if (normalizedValue.includes(normalizedTerm)) {
                    matchScore = Math.max(matchScore, 1);
                }

                if (termDigits) {
                    const digitsValue = normalizeDigits(value);
                    if (digitsValue === termDigits) {
                        matchScore = Math.max(matchScore, 3);
                    } else if (digitsValue.startsWith(termDigits)) {
                        matchScore = Math.max(matchScore, 2);
                    } else if (digitsValue.includes(termDigits)) {
                        matchScore = Math.max(matchScore, 1);
                    }
                }
            }

            const dateValue = Array.isArray(dateField)
                ? pickFirst(...dateField.map((field) => item[field]))
                : item[dateField];
            const recencyScore = buildRecencyScore(dateValue);
            const score = matchScore * 100 + recencyScore;
            return { item, score, recencyScore };
        });

        scored.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.recencyScore - a.recencyScore;
        });

        return scored.slice(0, this.perEntityLimit).map((entry) => entry.item);
    }

    _formatAddress(property) {
        const parts = [property.street, property.neighborhood, property.city].filter(Boolean);
        return parts.join(', ');
    }

    async _logSearch({ tenantId, user, term, normalizedTerm, cacheHit }) {
        try {
            await supabase
                .from('activity_log')
                .insert({
                    user_id: user?.id || null,
                    user_name: user?.name || user?.nome || null,
                    action: 'search',
                    entity_type: 'global_search',
                    entity_id: null,
                    description: term || normalizedTerm,
                    changes: {
                        term,
                        normalized_term: normalizedTerm,
                        cache_hit: cacheHit,
                        tenant_id: tenantId || null
                    }
                });
        } catch (error) {
            console.warn('[SearchService] Failed to log search term:', error.message || error);
        }
    }
}

module.exports = SearchService;
