/**
 * Website Service
 * Business logic for website layouts and components
 */

class WebsiteService {
    constructor(websiteRepository) {
        this.repository = websiteRepository;
    }

    async getLayouts(companyId, pageType = null) {
        return await this.repository.findAll(companyId, pageType);
    }

    async getLayout(id) {
        return await this.repository.findById(id);
    }

    async getActiveLayout(companyId, pageType) {
        return await this.repository.findActive(companyId, pageType);
    }

    async createLayout(layoutData) {
        return await this.repository.create(layoutData);
    }

    async updateLayout(id, layoutData) {
        return await this.repository.update(id, layoutData);
    }

    async deleteLayout(id) {
        return await this.repository.delete(id);
    }

    async publishLayout(id) {
        const layout = await this.repository.findById(id);
        
        if (!layout) {
            throw new Error('Layout not found');
        }

        // Deactivate all other layouts of the same page type for this company
        await this.repository.deactivateByPageType(layout.company_id, layout.page_type);

        // Activate this layout
        return await this.repository.update(id, { is_active: true });
    }
}

module.exports = WebsiteService;
