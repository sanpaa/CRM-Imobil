/**
 * Public Site Routes
 * API endpoints for serving multi-tenant public websites
 */

const express = require('express');

function createPublicSiteRoutes(publicSiteService) {
    const router = express.Router();

    /**
     * GET /api/site-config
     * Get complete site configuration for a domain
     * Query params:
     *   - domain: The domain to fetch config for (required)
     */
    router.get('/site-config', async (req, res) => {
        try {
            const { domain } = req.query;
            
            if (!domain) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Domain parameter is required' 
                });
            }

            // Get site configuration
            const config = await publicSiteService.getSiteConfig(domain);
            
            res.json(config);
        } catch (error) {
            console.error('Error fetching site config:', error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Site not found for this domain' 
                });
            }

            if (error.message.includes('not enabled')) {
                return res.status(403).json({ 
                    success: false,
                    error: 'Website not enabled for this company' 
                });
            }

            res.status(500).json({ 
                success: false,
                error: 'Failed to fetch site configuration' 
            });
        }
    });

    /**
     * GET /api/site-config/by-company/:companyId
     * Get site configuration by company ID (for testing/preview)
     */
    router.get('/site-config/by-company/:companyId', async (req, res) => {
        try {
            const { companyId } = req.params;
            
            if (!companyId) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID is required' 
                });
            }

            // Use dedicated method for getting config by company ID
            const config = await publicSiteService.getSiteConfigByCompanyId(companyId);
            
            res.json(config);
        } catch (error) {
            console.error('Error fetching site config by company:', error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Company not found' 
                });
            }

            if (error.message.includes('not enabled')) {
                return res.status(403).json({ 
                    success: false,
                    error: 'Website not enabled for this company' 
                });
            }
            
            res.status(500).json({ 
                success: false,
                error: 'Failed to fetch site configuration' 
            });
        }
    });

    /**
     * GET /api/site-config/properties
     * Get featured properties for a domain
     * Query params:
     *   - domain: The domain (required)
     *   - limit: Number of properties to return (default: 6)
     */
    router.get('/site-config/properties', async (req, res) => {
        try {
            const { domain, limit } = req.query;
            
            if (!domain) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Domain parameter is required' 
                });
            }

            // Get company by domain
            const company = await publicSiteService.companyRepository.findByDomain(domain);
            
            if (!company) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Company not found for domain' 
                });
            }

            // Get featured properties
            const properties = await publicSiteService.getFeaturedProperties(
                company.id,
                parseInt(limit) || 6
            );
            
            res.json({
                success: true,
                properties: properties
            });
        } catch (error) {
            console.error('Error fetching properties:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to fetch properties' 
            });
        }
    });

    return router;
}

module.exports = createPublicSiteRoutes;
