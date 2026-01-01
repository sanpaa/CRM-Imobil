# Multi-Tenant Website - Quick Start Guide

This guide will help you set up your first multi-tenant public website in 5 minutes.

## Prerequisites

- CRM Imobil installed and running
- Supabase database configured
- Basic understanding of SQL

## Step 1: Run Database Migration

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `migration-website-customization.sql`
3. Click "Run" to create the required tables

Expected tables created:
- ✅ `custom_domains`
- ✅ `website_layouts`
- ✅ `website_components`

## Step 2: Create Your Company (Optional for Single Tenant)

For single-tenant mode, the system uses the existing `store_settings` table. You can skip this step if you're not using multi-company features.

For multi-company:
```sql
-- Create a company
INSERT INTO companies (id, name, email, phone, website_enabled, website_published)
VALUES (
  'a1b2c3d4-e5f6-4789-a012-345678901234'::uuid,
  'Imobiliária Exemplo',
  'contato@exemplo.com',
  '(11) 98765-4321',
  true,
  true
);

-- Add a custom domain
INSERT INTO custom_domains (company_id, domain, is_primary, status)
VALUES (
  'a1b2c3d4-e5f6-4789-a012-345678901234'::uuid,
  'exemplo.imobiliaria.com',
  true,
  'active'
);
```

## Step 3: Configure Store Settings

Update your store settings with branding:
```sql
UPDATE store_settings
SET 
  name = 'Imobiliária Exemplo',
  email = 'contato@exemplo.com',
  phone = '(11) 98765-4321',
  whatsapp = '5511987654321',
  description = 'Sua imobiliária de confiança',
  primary_color = '#004AAD',
  secondary_color = '#FFA500'
WHERE id = (SELECT id FROM store_settings LIMIT 1);
```

## Step 4: Create a Home Page Layout

Create your first website layout:
```sql
INSERT INTO website_layouts (
  company_id,
  name,
  page_type,
  slug,
  is_active,
  layout_config,
  meta_title,
  meta_description
) VALUES (
  -- Use NULL for single-tenant, or your company_id for multi-tenant
  NULL,
  'Home Page - Exemplo',
  'home',
  '/',
  true,
  '{
    "sections": [
      {
        "id": "hero-main",
        "component_type": "hero",
        "order": 0,
        "config": {
          "title": "Encontre seu imóvel ideal",
          "subtitle": "Os melhores imóveis da região com as melhores condições",
          "buttonText": "Ver Imóveis",
          "buttonLink": "/buscar",
          "alignment": "center",
          "height": "large"
        },
        "style_config": {
          "backgroundColor": "#004AAD",
          "textColor": "#FFFFFF",
          "padding": "6rem 2rem"
        }
      },
      {
        "id": "properties-featured",
        "component_type": "property-grid",
        "order": 1,
        "config": {
          "title": "Imóveis em Destaque",
          "limit": 6,
          "columns": 3,
          "showFeatured": true,
          "showFilters": false
        },
        "style_config": {
          "backgroundColor": "#FFFFFF",
          "padding": "4rem 2rem"
        }
      },
      {
        "id": "stats-main",
        "component_type": "stats-section",
        "order": 2,
        "config": {
          "stats": [
            {
              "value": "500+",
              "label": "Imóveis Disponíveis"
            },
            {
              "value": "1000+",
              "label": "Clientes Satisfeitos"
            },
            {
              "value": "15+",
              "label": "Anos de Experiência"
            },
            {
              "value": "50+",
              "label": "Bairros Atendidos"
            }
          ]
        },
        "style_config": {
          "backgroundColor": "#F5F5F5",
          "padding": "4rem 2rem"
        }
      },
      {
        "id": "contact-main",
        "component_type": "contact-form",
        "order": 3,
        "config": {
          "title": "Entre em Contato",
          "subtitle": "Estamos prontos para ajudar você",
          "fields": ["name", "email", "phone", "message"],
          "submitButtonText": "Enviar Mensagem",
          "whatsappIntegration": true
        },
        "style_config": {
          "backgroundColor": "#FFFFFF",
          "padding": "4rem 2rem"
        }
      }
    ]
  }',
  'Imobiliária Exemplo - Encontre seu imóvel ideal',
  'Os melhores imóveis da região com as melhores condições. Apartamentos, casas, terrenos e muito mais.'
);
```

## Step 5: Test Your Website

### Option A: Development (localhost)

1. Start the server:
```bash
npm run dev
```

2. Start the Angular dev server (in another terminal):
```bash
cd frontend
npm start
```

3. Access your site with domain override:
```
http://localhost:4200/site?domain=exemplo.imobiliaria.com
```

### Option B: Production

1. Build the frontend:
```bash
npm run build:prod
```

2. Start the server:
```bash
npm start
```

3. Configure DNS for your domain:
- Point `exemplo.imobiliaria.com` to your server
- Access: `https://exemplo.imobiliaria.com`

## Step 6: Verify It's Working

You should see:
- ✅ Hero section with your title and subtitle
- ✅ Property grid showing available properties
- ✅ Statistics section with your numbers
- ✅ Contact form

Check the browser console for any errors.

## Step 7: Add More Pages (Optional)

Create additional pages like "Sobre", "Contato", "Imóveis":

```sql
-- Properties page
INSERT INTO website_layouts (
  company_id,
  name,
  page_type,
  slug,
  is_active,
  layout_config,
  meta_title,
  meta_description
) VALUES (
  NULL,
  'Página de Imóveis',
  'properties',
  '/imoveis',
  true,
  '{
    "sections": [
      {
        "id": "search-bar",
        "component_type": "search-bar",
        "order": 0,
        "config": {
          "fields": ["type", "city", "bedrooms", "priceRange"],
          "layout": "horizontal"
        },
        "style_config": {
          "backgroundColor": "#F5F5F5",
          "padding": "2rem"
        }
      },
      {
        "id": "all-properties",
        "component_type": "property-grid",
        "order": 1,
        "config": {
          "limit": 12,
          "columns": 3,
          "showFilters": true,
          "showPagination": true
        },
        "style_config": {
          "backgroundColor": "#FFFFFF",
          "padding": "3rem 2rem"
        }
      }
    ]
  }',
  'Imóveis Disponíveis - Imobiliária Exemplo',
  'Confira todos os nossos imóveis disponíveis para venda e locação.'
);
```

## Customization

### Change Colors

Update in `store_settings`:
```sql
UPDATE store_settings
SET 
  primary_color = '#YOUR_PRIMARY_COLOR',
  secondary_color = '#YOUR_SECONDARY_COLOR';
```

### Change Layout

Edit the `layout_config` in `website_layouts`:
- Add/remove sections
- Reorder by changing `order` field
- Modify section configs
- Update styling in `style_config`

### Add Logo

Update in `store_settings`:
```sql
UPDATE store_settings
SET logo = 'https://your-logo-url.com/logo.png';
```

## Component Reference

Available component types:
- `hero` - Hero banner
- `property-grid` - Property listings
- `search-bar` - Search interface
- `stats-section` - Statistics
- `text-block` - Text content
- `contact-form` - Contact form
- `lifestyle-section` - Feature cards
- `testimonials` - Client testimonials
- `team-section` - Team members
- `about-section` - About info
- `map-section` - Location map
- `image-gallery` - Image gallery
- `video-section` - Video embed
- `cta-button` - Call-to-action
- `divider` - Visual separator
- `spacer` - Vertical space

## Troubleshooting

### Site not loading
```sql
-- Check if domain exists and is active
SELECT * FROM custom_domains WHERE domain = 'your-domain.com';

-- Check if website is enabled
SELECT website_enabled, website_published FROM companies 
WHERE id = 'your-company-id';

-- For single tenant
SELECT * FROM store_settings LIMIT 1;
```

### No layout found
```sql
-- Check if active layout exists
SELECT * FROM website_layouts WHERE is_active = true;

-- Activate your layout
UPDATE website_layouts 
SET is_active = true 
WHERE name = 'Home Page - Exemplo';
```

### Components not rendering
- Check browser console for errors
- Verify component_type is spelled correctly
- Ensure all required config fields are present

## API Testing

Test the API directly:
```bash
# Test site config endpoint
curl "http://localhost:3000/api/public/site-config?domain=exemplo.imobiliaria.com"

# Should return:
# {
#   "success": true,
#   "company": {...},
#   "pages": [...],
#   "visualConfig": {...}
# }
```

## Next Steps

1. ✅ Site is working
2. Add more pages (properties, about, contact)
3. Customize components and styling
4. Add your own properties to the database
5. Configure DNS for production domain
6. Set up SSL certificate
7. Test SEO with meta tags
8. Optimize for mobile

## Support

See complete documentation:
- `MULTI_TENANT_GUIDE.md` - Full system documentation
- `WEBSITE_MODULARIZATION_GUIDE.md` - Component architecture
- `WEBSITE_CUSTOMIZATION_GUIDE.md` - Customization options

## Success! 🎉

Your multi-tenant public website is now running. Each company can have their own domain automatically loading their custom-branded website with unique layouts and content.
