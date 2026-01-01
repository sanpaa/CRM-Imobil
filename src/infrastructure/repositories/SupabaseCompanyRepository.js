/**
 * Supabase Company Repository
 * Data access layer for companies and custom domains
 */

const { supabase } = require('../database/supabase');

class SupabaseCompanyRepository {
    /**
     * Find company by custom domain
     */
    async findByDomain(domain) {
        try {
            // First try to find via custom_domains table
            const { data: domainData, error: domainError } = await supabase
                .from('custom_domains')
                .select('company_id, is_primary, status')
                .eq('domain', domain)
                .eq('status', 'active')
                .maybeSingle();

            if (domainError && domainError.code !== 'PGRST116') {
                console.error('Error finding domain:', domainError);
            }

            let companyId = domainData?.company_id;

            // Fallback: check companies table for direct custom_domain match
            if (!companyId) {
                const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('custom_domain', domain)
                    .maybeSingle();

                if (companyError && companyError.code !== 'PGRST116') {
                    console.error('Error finding company by domain:', companyError);
                }

                companyId = companyData?.id;
            }

            if (!companyId) {
                return null;
            }

            return await this.findById(companyId);
        } catch (error) {
            console.error('Error in findByDomain:', error);
            return null;
        }
    }

    /**
     * Find company by ID
     */
    async findById(companyId) {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', companyId)
                .single();

            if (error) {
                console.error('Error finding company:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in findById:', error);
            return null;
        }
    }

    /**
     * Get company settings (from store_settings)
     */
    async getSettings(companyId) {
        try {
            const { data, error } = await supabase
                .from('store_settings')
                .select('*')
                .eq('company_id', companyId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching company settings:', error);
            }

            // If no company-specific settings, try default settings
            if (!data) {
                const { data: defaultData } = await supabase
                    .from('store_settings')
                    .select('*')
                    .limit(1)
                    .maybeSingle();
                
                return defaultData;
            }

            return data;
        } catch (error) {
            console.error('Error in getSettings:', error);
            return null;
        }
    }

    /**
     * Get all custom domains for a company
     */
    async getDomains(companyId) {
        try {
            const { data, error } = await supabase
                .from('custom_domains')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching domains:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getDomains:', error);
            return [];
        }
    }
}

module.exports = SupabaseCompanyRepository;
