# Multi-Tenant Public Website System - Complete Guide

## Overview

This guide explains how the multi-tenant public website system works in CRM Imobil. Each real estate agency (company) can have their own custom domain that automatically loads their branded website with unique layouts and content.

## Architecture

### How It Works

1. **Domain Detection**: When a visitor accesses a domain (e.g., `imobiliaria-abc.com`), the system detects it via `window.location.hostname`
2. **Company Resolution**: The backend maps the domain to a company in the database
3. **Configuration Loading**: The system fetches:
   - Company information (name, logo, contact details)
   - Website layouts (pages and components)
   - Visual configuration (colors, fonts, styling)
4. **Dynamic Rendering**: The frontend renders pages dynamically based on the configuration

### Multi-Tenant Flow

```
User visits domain
    ↓
Frontend detects domain (DomainDetectionService)
    ↓
API call: GET /api/public/site-config?domain=xxx
    ↓
Backend finds company by domain (SupabaseCompanyRepository)
    ↓
Backend loads layouts and settings (PublicSiteService)
    ↓
Backend returns complete site configuration (JSON)
    ↓
Frontend renders site (PublicSiteRendererComponent)
    ↓
Components render based on layout config (DynamicSectionComponent)
```

## Backend Components

### 1. SupabaseCompanyRepository
Location: `src/infrastructure/repositories/SupabaseCompanyRepository.js`

Handles company and domain lookups:
- `findByDomain(domain)` - Find company by custom domain
- `findById(companyId)` - Get company details
- `getSettings(companyId)` - Get company settings
- `getDomains(companyId)` - Get all domains for a company

### 2. PublicSiteService
Location: `src/application/services/PublicSiteService.js`

Business logic for serving public sites:
- `getSiteConfig(domain)` - Get complete site configuration
- `getFeaturedProperties(companyId, limit)` - Get properties for display

Returns a complete site config object:
```json
{
  "success": true,
  "company": {
    "id": "uuid",
    "name": "Imobiliária ABC",
    "email": "contato@imobiliaria.com",
    "phone": "(11) 1234-5678",
    "logo_url": "https://...",
    "whatsapp": "5511999999999"
  },
  "pages": [
    {
      "slug": "/",
      "pageType": "home",
      "name": "Home",
      "components": [...],
      "meta": {
        "title": "Imobiliária ABC - Home",
        "description": "...",
        "keywords": "..."
      }
    }
  ],
  "visualConfig": {
    "theme": {
      "primaryColor": "#004AAD",
      "secondaryColor": "#FFA500",
      "fontFamily": "Inter, sans-serif"
    },
    "branding": {...},
    "contact": {...}
  },
  "domain": "imobiliaria-abc.com"
}
```

### 3. Public Site Routes
Location: `src/presentation/routes/publicSiteRoutes.js`

API endpoints:
- `GET /api/public/site-config?domain={domain}` - Get site configuration
- `GET /api/public/site-config/by-company/:companyId` - Get config by company ID
- `GET /api/public/site-config/properties?domain={domain}` - Get properties

## Frontend Components

### 1. DomainDetectionService
Location: `frontend/src/app/services/domain-detection.service.ts`

Handles domain detection and site config loading:
```typescript
// Detect current domain
detectDomain(): string

// Fetch site configuration
fetchSiteConfig(domain?: string): Observable<SiteConfig>

// Get page by slug
getPageBySlug(slug: string): PageConfig | null

// Check if in public site mode
isPublicSite(): boolean
```

**Development/Localhost Support:**
- In development (localhost), you can override the domain using a query parameter:
  - `http://localhost:4200/?domain=demo.imobiliaria.com`
- Default domain for dev: `demo.imobiliaria.com`

### 2. PublicSiteRendererComponent
Location: `frontend/src/app/components/public-site-renderer/public-site-renderer.ts`

Renders the complete public site:
- Loads site configuration
- Matches current route to page configuration
- Renders components dynamically
- Updates SEO meta tags

### 3. PublicWebsiteComponent
Location: `frontend/src/app/components/public-website/public-website.ts`

Wrapper component that uses PublicSiteRendererComponent. Route: `/site`

### 4. DynamicSectionComponent
Location: `frontend/src/app/components/dynamic-section/dynamic-section.ts`

Dynamically loads section components based on type:
- Accepts `section` (layout config) and `companyData` as inputs
- Maps component types to actual Angular components
- Passes configuration and company data to child components

## Database Schema

### Tables Required

1. **companies** (or uses store_settings for single-tenant)
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  logo_url TEXT,
  custom_domain VARCHAR(255),
  website_enabled BOOLEAN DEFAULT FALSE,
  website_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. **custom_domains** (for multi-domain support)
```sql
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  domain VARCHAR(255) NOT NULL UNIQUE,
  subdomain VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

3. **website_layouts** (stores page configurations)
```sql
CREATE TABLE website_layouts (
  id UUID PRIMARY KEY,
  company_id UUID,
  name VARCHAR(255),
  page_type VARCHAR(50),
  slug VARCHAR(255),
  is_active BOOLEAN DEFAULT FALSE,
  layout_config JSONB NOT NULL,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

4. **store_settings** (company settings/branding)
```sql
-- Extended to support company_id for multi-tenant
ALTER TABLE store_settings ADD COLUMN company_id UUID;
```

See `migration-website-customization.sql` for complete schema.

## Setup Instructions

### 1. Run Database Migration

Execute the SQL migration:
```bash
# Apply the website customization migration
# In your Supabase SQL Editor, run:
cat migration-website-customization.sql
```

### 2. Configure Company Domain

Add your company and domain to the database:
```sql
-- Insert or update company
INSERT INTO companies (id, name, email, phone, website_enabled, website_published)
VALUES (
  gen_random_uuid(),
  'Minha Imobiliária',
  'contato@minhaimo.com',
  '(11) 1234-5678',
  true,
  true
);

-- Add custom domain
INSERT INTO custom_domains (company_id, domain, is_primary, status)
VALUES (
  'your-company-id-here',
  'minhaimo.com',
  true,
  'active'
);
```

### 3. Create Website Layout

Create a home page layout for your company:
```sql
INSERT INTO website_layouts (
  company_id,
  name,
  page_type,
  slug,
  is_active,
  layout_config
) VALUES (
  'your-company-id-here',
  'Home Page',
  'home',
  '/',
  true,
  '{
    "sections": [
      {
        "id": "hero-1",
        "component_type": "hero",
        "order": 0,
        "config": {
          "title": "Encontre seu imóvel ideal",
          "subtitle": "As melhores opções do mercado",
          "buttonText": "Ver Imóveis",
          "buttonLink": "/imoveis"
        },
        "style_config": {
          "backgroundColor": "#004AAD",
          "textColor": "#FFFFFF",
          "padding": "4rem 2rem"
        }
      },
      {
        "id": "properties-1",
        "component_type": "property-grid",
        "order": 1,
        "config": {
          "limit": 6,
          "columns": 3,
          "showFeatured": true
        },
        "style_config": {
          "backgroundColor": "#FFFFFF",
          "padding": "3rem 2rem"
        }
      }
    ]
  }'
);
```

### 4. Test the Setup

#### For Development (localhost):
```
http://localhost:4200/site?domain=minhaimo.com
```

#### For Production:
Point your domain DNS to your server and access:
```
https://minhaimo.com
```

## Component Library

All section components are in `frontend/src/app/components/sections/`:

### Available Components

1. **hero-section** - Hero banner with title, subtitle, CTA
2. **property-grid-section** - Grid of property cards
3. **search-bar-section** - Property search interface
4. **lifestyle-section** - Feature/lifestyle cards
5. **stats-section** - Statistics display
6. **text-block-section** - Rich text content
7. **contact-form-section** - Contact form
8. **testimonials-section** - Client testimonials
9. **team-section** - Team member profiles
10. **about-section** - About company section
11. **map-section** - Location map
12. **image-gallery-section** - Image gallery
13. **video-section** - Video embed
14. **cta-button-section** - Call-to-action button
15. **divider-section** - Visual separator
16. **spacer-section** - Vertical spacing

### Component Structure

Each component accepts:
- `config` - Component-specific configuration
- `styleConfig` - Styling options (optional)
- `companyData` - Company information (optional)

Example component usage:
```typescript
@Component({
  selector: 'app-hero-section',
  ...
})
export class HeroSectionComponent {
  @Input() config: any;
  @Input() styleConfig: any;
  @Input() companyData: any;
}
```

## Shared Components Philosophy

The component library is designed to be shared between:
1. **CRM Admin Panel** - For editing and preview
2. **Public Website** - For display to visitors

### Key Principles:

1. **Same Code, Different Modes**: Components detect their context
2. **No Code Duplication**: Single source of truth for each component
3. **Configuration-Driven**: All behavior controlled via config objects
4. **Style Isolation**: Each component has scoped styles

## SEO Configuration

### Meta Tags

Configured per page in the layout:
```json
{
  "meta": {
    "title": "Imóveis em São Paulo | Imobiliária ABC",
    "description": "Encontre os melhores imóveis em São Paulo...",
    "keywords": "imóveis, apartamentos, casas, são paulo"
  }
}
```

The PublicSiteRendererComponent automatically updates:
- `<title>` tag
- `<meta name="description">` tag
- `<meta name="keywords">` tag

### SEO Best Practices:

1. **Unique titles per page** - Set different meta_title for each layout
2. **Descriptive meta descriptions** - 150-160 characters
3. **Semantic HTML** - Components use proper heading hierarchy
4. **Mobile responsive** - All components are mobile-friendly

## Performance Optimization

### Current Optimizations:

1. **Lazy Loading**: Components loaded on-demand
2. **Caching**: Site config can be cached on frontend
3. **Minimal API Calls**: Single endpoint returns everything needed
4. **Lightweight Rendering**: Only active components are loaded

### Future Optimizations:

1. **Server-Side Rendering (SSR)**: For better SEO and initial load
2. **Static Generation**: Pre-generate pages at build time
3. **Image Optimization**: Compress and lazy-load images
4. **Code Splitting**: Split bundle by route

## Deployment

### Netlify / Vercel

The system is serverless-compatible:

1. **Frontend**: Angular app deployed as static site
2. **Backend**: Express.js can run on:
   - Netlify Functions
   - Vercel Functions
   - Any Node.js hosting

### Environment Variables

Required:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PORT=3000
```

### DNS Configuration

For custom domains:

1. **CNAME Record**:
   ```
   Type: CNAME
   Host: @
   Value: your-netlify-site.netlify.app
   ```

2. **Verification** (optional):
   ```
   Type: TXT
   Host: _crm-verification
   Value: crm-verify-xxx
   ```

## Troubleshooting

### Site Not Loading

1. Check domain mapping:
```sql
SELECT * FROM custom_domains WHERE domain = 'your-domain.com';
```

2. Verify company has website enabled:
```sql
SELECT website_enabled, website_published FROM companies WHERE id = 'your-company-id';
```

3. Check active layout exists:
```sql
SELECT * FROM website_layouts 
WHERE company_id = 'your-company-id' AND is_active = true;
```

### Component Not Rendering

1. Verify component type is registered in DynamicSectionComponent
2. Check browser console for errors
3. Verify component configuration in layout_config

### Development Domain Override

For testing specific domains in development:
```
http://localhost:4200/site?domain=test.imobiliaria.com
```

## API Reference

### GET /api/public/site-config

**Query Parameters:**
- `domain` (required): Domain to fetch config for

**Response:**
```json
{
  "success": true,
  "company": {...},
  "pages": [...],
  "visualConfig": {...},
  "domain": "..."
}
```

**Error Responses:**
- `400`: Missing domain parameter
- `404`: Company not found for domain
- `403`: Website not enabled
- `500`: Server error

### GET /api/public/site-config/properties

**Query Parameters:**
- `domain` (required): Domain
- `limit` (optional): Number of properties (default: 6)

**Response:**
```json
{
  "success": true,
  "properties": [...]
}
```

## Next Steps

1. **Add More Components**: Create additional section types
2. **Improve SEO**: Implement SSR/SSG
3. **Add Analytics**: Track visitor behavior
4. **Custom Forms**: Build dynamic form builder
5. **A/B Testing**: Test different layouts
6. **Performance**: Implement caching strategies

## Support

For issues or questions:
1. Check this documentation
2. Review `WEBSITE_MODULARIZATION_GUIDE.md`
3. Check `WEBSITE_CUSTOMIZATION_GUIDE.md`
4. Inspect browser console for errors
5. Check server logs for backend issues
