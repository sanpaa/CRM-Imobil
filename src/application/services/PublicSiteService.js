/**
 * Public Site Service
 * Business logic for serving public multi-tenant websites
 */

class PublicSiteService {
    constructor(companyRepository, websiteRepository, propertyRepository) {
        this.companyRepository = companyRepository;
        this.websiteRepository = websiteRepository;
        this.propertyRepository = propertyRepository;
    }

    /**
     * Get complete site configuration for a domain
     * Returns all data needed to render the public site
     */
    async getSiteConfig(domain) {
        try {
            let company;
            
            const normalizedDomain = (domain || '').toLowerCase().split(':')[0].trim();
            console.log('🔍 getSiteConfig called with domain:', normalizedDomain);
            
            // Check if this is a development/preview domain
            const isLocalhost = normalizedDomain === 'localhost' || normalizedDomain === '127.0.0.1';
            const isNetlifyPreview = normalizedDomain.includes('--') && normalizedDomain.endsWith('.netlify.app');
            const isPreviewDomain = isLocalhost || isNetlifyPreview;
            
            if (isPreviewDomain) {
                // For development/preview domains, get the first company with website enabled
                console.log('🔍 Preview/development domain detected. Searching for first company with website enabled...');
                company = await this.companyRepository.findFirstWithWebsiteEnabled();
                console.log('🔍 Found company:', company ? company.id : 'NONE');
                
                // If no company found, return a helpful error
                if (!company) {
                    throw new Error('No companies with enabled websites found. Please create a company and enable its website first.');
                }
            } else {
                // Production: find by actual domain
                console.log('🔍 Searching for company by domain:', normalizedDomain);
                company = await this.companyRepository.findByDomain(normalizedDomain);
                console.log('🔍 Found company:', company ? company.id : 'NONE');
                
                if (!company) {
                    throw new Error('Company not found for domain: ' + normalizedDomain);
                }
            }

            // 2. Get company settings (branding, contact info, etc.)
            const settings = await this.companyRepository.getSettings(company.id);

            // 3. Get all active layouts for this company
            const layouts = await this._getActiveLayouts(company.id);

            // 4. Get pages configuration
            const pages = this._buildPagesFromLayouts(layouts);

            // 5. Build visual configuration
            const visualConfig = this._buildVisualConfig(settings, company);

            // 6. Return complete site config
            return {
                success: true,
                company: {
                    id: company.id,
                    name: company.name || settings?.name || 'Imobiliária',
                    email: company.email || settings?.email,
                    phone: company.phone || settings?.phone,
                    address: company.address || settings?.address,
                    logo_url: company.logo_url || settings?.logo,
                    description: settings?.description,
                    whatsapp: settings?.whatsapp,
                    footer_config: company.footer_config  // ⬅️ ADICIONAR ESTA LINHA

                },
                pages: pages,
                visualConfig: visualConfig,
                domain: normalizedDomain
            };
        } catch (error) {
            console.error('Error getting site config:', error);
            throw error;
        }
    }

    /**
     * Get all active layouts for a company
     */
    async _getActiveLayouts(companyId) {
    console.log('🔍 _getActiveLayouts called for company:', companyId);
    const pageTypes = ['home', 'properties', 'property-detail', 'about', 'contact'];
    const layouts = {};

    for (const pageType of pageTypes) {
        console.log('🔍 Searching for layout:', pageType);
        const layout = await this.websiteRepository.findActive(companyId, pageType);
        console.log('🔍 Found layout for', pageType, ':', layout ? 'YES' : 'NO');
        if (layout) {
            console.log('🔍 Layout sections:', layout.layout_config?.sections?.length || 0);
            layouts[pageType] = layout;
        }
    }
    
    console.log('🔍 Total layouts found:', Object.keys(layouts).length);
    return layouts;
}
    /**
     * Build pages configuration from layouts
     */
    _buildPagesFromLayouts(layouts) {
        const pages = [];

        // Map page types to slugs
        const pageMapping = {
            'home': '/',
            'properties': '/imoveis',
            'property-detail': '/imovel/:id',
            'about': '/sobre',
            'contact': '/contato'
        };

        for (const [pageType, layout] of Object.entries(layouts)) {
            pages.push({
                slug: layout.slug || pageMapping[pageType] || `/${pageType}`,
                pageType: pageType,
                name: layout.name,
                components: layout.layout_config?.sections || [],
                html: layout.html || null,
                css: layout.css || null,
                meta: {
                    title: layout.meta_title,
                    description: layout.meta_description,
                    keywords: layout.meta_keywords
                }
            });
        }

        return pages;
    }

    /**
     * Build visual configuration (theme, colors, etc.)
     */
    _buildVisualConfig(settings, company) {
        return {
            theme: {
                primaryColor: settings?.primary_color || '#004AAD',
                secondaryColor: settings?.secondary_color || '#FFA500',
                fontFamily: settings?.theme_config?.fontFamily || 'Inter, system-ui, sans-serif'
            },
            branding: {
                logoUrl: company.header_config?.logoUrl || null,
                // logo: company.logo_url || settings?.logo,
                companyName: company.name || settings?.name || 'Imobiliária',
                tagline: settings?.description
            },
            contact: {
                email: company.email || settings?.email,
                phone: company.phone || settings?.phone,
                whatsapp: settings?.whatsapp,
                address: company.address || settings?.address
            },
            socialLinks: settings?.social_links || {},
            businessHours: settings?.business_hours || {},
            layout: settings?.layout_config || {}
        };
    }

    /**
     * Get complete site configuration for a company by ID
     * Used for preview/testing without domain
     */
    async getSiteConfigByCompanyId(companyId) {
        try {
            // Get company directly by ID
            const company = await this.companyRepository.findById(companyId);
            
            if (!company) {
                throw new Error('Company not found: ' + companyId);
            }

            // Check if website is enabled (published check removed for flexibility)
            if (!company.website_enabled) {
                throw new Error('Website not enabled for this company');
            }

            // Get company settings
            const settings = await this.companyRepository.getSettings(companyId);

            // Get all active layouts
            const layouts = await this._getActiveLayouts(companyId);

            // Build pages configuration
            const pages = this._buildPagesFromLayouts(layouts);

            // Build visual configuration
            const visualConfig = this._buildVisualConfig(settings, company);

            // Return complete site config
            return {
                success: true,
                company: {
                    id: company.id,
                    name: company.name || settings?.name || 'Imobiliária',
                    email: company.email || settings?.email,
                    phone: company.phone || settings?.phone,
                    address: company.address || settings?.address,
                    logo_url: company.logo_url || settings?.logo,
                    description: settings?.description,
                    whatsapp: settings?.whatsapp,
                    footer_config: company.footer_config 

                },
                pages: pages,
                visualConfig: visualConfig,
                domain: company.custom_domain || null
            };
        } catch (error) {
            console.error('Error getting site config by company ID:', error);
            throw error;
        }
    }
    /**
     * Get featured properties for a company
     */
    async getFeaturedProperties(companyId, limit = 6) {
        try {
            // Get properties, filtering by company and status
            // Note: This assumes the property repository supports company filtering
            // If not, we'll need to implement it in the repository layer
            const properties = await this.propertyRepository.findAll({
                companyId: companyId, // Filter by company
                limit: limit,
                status: 'available'
            });

            return properties;
        } catch (error) {
            console.error('Error getting featured properties:', error);
            return [];
        }
    }
}

module.exports = PublicSiteService;
