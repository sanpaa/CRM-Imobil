-- Demo Multi-Tenant Site Setup
-- This script creates a demo company with a complete website configuration
-- Run this after the main migration-website-customization.sql

-- ============================================================================
-- 1. Create Demo Company (if companies table exists)
-- ============================================================================
DO $$
BEGIN
  -- Only create if companies table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    -- Check if demo company already exists
    IF NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Imobiliária Demo') THEN
      INSERT INTO companies (id, name, email, phone, address, website_enabled, website_published)
      VALUES (
        'demo-company-id-0000-0000-000000000001'::uuid,
        'Imobiliária Demo',
        'contato@demo.imobiliaria.com',
        '(11) 98765-4321',
        'Rua Exemplo, 123 - São Paulo, SP',
        true,
        true
      );
      
      RAISE NOTICE 'Demo company created';
    ELSE
      RAISE NOTICE 'Demo company already exists';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 2. Add Demo Custom Domain
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_domains') THEN
    -- Delete existing demo domains
    DELETE FROM custom_domains WHERE domain IN ('demo.imobiliaria.com', 'localhost');
    
    -- Insert demo domains
    INSERT INTO custom_domains (company_id, domain, subdomain, is_primary, status)
    VALUES 
      ('demo-company-id-0000-0000-000000000001'::uuid, 'demo.imobiliaria.com', NULL, true, 'active'),
      ('demo-company-id-0000-0000-000000000001'::uuid, 'localhost', NULL, false, 'active');
    
    RAISE NOTICE 'Demo domains created';
  END IF;
END $$;

-- ============================================================================
-- 3. Update Store Settings with Demo Data
-- ============================================================================
UPDATE store_settings
SET 
  name = 'Imobiliária Demo',
  email = 'contato@demo.imobiliaria.com',
  phone = '(11) 98765-4321',
  whatsapp = '5511987654321',
  description = 'Sua imobiliária de confiança - encontre o imóvel ideal',
  primary_color = '#004AAD',
  secondary_color = '#FFA500',
  social_links = '{
    "facebook": "https://facebook.com/imobiliariademo",
    "instagram": "https://instagram.com/imobiliariademo",
    "whatsapp": "5511987654321"
  }'::jsonb,
  business_hours = '{
    "monday": "09:00 - 18:00",
    "tuesday": "09:00 - 18:00",
    "wednesday": "09:00 - 18:00",
    "thursday": "09:00 - 18:00",
    "friday": "09:00 - 18:00",
    "saturday": "09:00 - 13:00",
    "sunday": "Fechado"
  }'::jsonb
WHERE id = (SELECT id FROM store_settings LIMIT 1);

-- ============================================================================
-- 4. Create Demo Home Page Layout
-- ============================================================================
-- Delete existing demo home layout if exists
DELETE FROM website_layouts 
WHERE page_type = 'home' AND name LIKE '%Demo%';

-- Insert new demo home page
INSERT INTO website_layouts (
  company_id,
  name,
  page_type,
  slug,
  is_active,
  is_default,
  layout_config,
  meta_title,
  meta_description,
  meta_keywords
) VALUES (
  'demo-company-id-0000-0000-000000000001'::uuid,
  'Home Page Demo',
  'home',
  '/',
  true,
  true,
  '{
    "sections": [
      {
        "id": "hero-1",
        "component_type": "hero",
        "order": 0,
        "config": {
          "title": "Encontre seu Imóvel Ideal",
          "subtitle": "Os melhores imóveis da região com as melhores condições",
          "buttonText": "Ver Imóveis",
          "buttonLink": "/buscar",
          "alignment": "center",
          "height": "large",
          "backgroundImage": ""
        },
        "style_config": {
          "backgroundColor": "#004AAD",
          "textColor": "#FFFFFF",
          "padding": "6rem 2rem"
        }
      },
      {
        "id": "search-bar-1",
        "component_type": "search-bar",
        "order": 1,
        "config": {
          "fields": ["type", "city", "bedrooms", "priceRange"],
          "layout": "horizontal",
          "showAdvancedFilters": true
        },
        "style_config": {
          "backgroundColor": "#F5F5F5",
          "padding": "2rem"
        }
      },
      {
        "id": "property-grid-1",
        "component_type": "property-grid",
        "order": 2,
        "config": {
          "title": "Imóveis em Destaque",
          "subtitle": "Confira nossa seleção especial",
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
        "id": "stats-1",
        "component_type": "stats-section",
        "order": 3,
        "config": {
          "stats": [
            {
              "value": "500+",
              "label": "Imóveis Disponíveis",
              "icon": "home"
            },
            {
              "value": "1000+",
              "label": "Clientes Satisfeitos",
              "icon": "users"
            },
            {
              "value": "15+",
              "label": "Anos de Experiência",
              "icon": "award"
            },
            {
              "value": "50+",
              "label": "Bairros Atendidos",
              "icon": "map"
            }
          ]
        },
        "style_config": {
          "backgroundColor": "#004AAD",
          "textColor": "#FFFFFF",
          "padding": "4rem 2rem"
        }
      },
      {
        "id": "lifestyle-1",
        "component_type": "lifestyle-section",
        "order": 4,
        "config": {
          "title": "Encontre o Estilo Perfeito",
          "items": [
            {
              "title": "Apartamentos Modernos",
              "description": "Design contemporâneo em localização privilegiada",
              "image": "",
              "link": "/buscar?type=apartamento"
            },
            {
              "title": "Casas Espaçosas",
              "description": "Conforto e espaço para toda a família",
              "image": "",
              "link": "/buscar?type=casa"
            },
            {
              "title": "Coberturas de Luxo",
              "description": "Sofisticação e exclusividade",
              "image": "",
              "link": "/buscar?type=cobertura"
            }
          ]
        },
        "style_config": {
          "backgroundColor": "#F5F5F5",
          "padding": "4rem 2rem"
        }
      },
      {
        "id": "contact-form-1",
        "component_type": "contact-form",
        "order": 5,
        "config": {
          "title": "Entre em Contato",
          "subtitle": "Estamos prontos para ajudar você a encontrar o imóvel ideal",
          "fields": ["name", "email", "phone", "message"],
          "submitButtonText": "Enviar Mensagem",
          "whatsappIntegration": true,
          "showMap": false
        },
        "style_config": {
          "backgroundColor": "#FFFFFF",
          "padding": "4rem 2rem"
        }
      }
    ]
  }'::jsonb,
  'Imobiliária Demo - Encontre seu Imóvel Ideal',
  'Os melhores imóveis da região com as melhores condições. Apartamentos, casas, coberturas e muito mais.',
  'imóveis, apartamentos, casas, venda, locação, imobiliária'
);

-- ============================================================================
-- 5. Create Demo Properties Page Layout
-- ============================================================================
DELETE FROM website_layouts 
WHERE page_type = 'properties' AND name LIKE '%Demo%';

INSERT INTO website_layouts (
  company_id,
  name,
  page_type,
  slug,
  is_active,
  is_default,
  layout_config,
  meta_title,
  meta_description
) VALUES (
  'demo-company-id-0000-0000-000000000001'::uuid,
  'Properties Page Demo',
  'properties',
  '/imoveis',
  true,
  true,
  '{
    "sections": [
      {
        "id": "search-bar-2",
        "component_type": "search-bar",
        "order": 0,
        "config": {
          "fields": ["type", "city", "bedrooms", "priceRange", "area"],
          "layout": "horizontal",
          "showAdvancedFilters": true
        },
        "style_config": {
          "backgroundColor": "#F5F5F5",
          "padding": "2rem"
        }
      },
      {
        "id": "property-grid-2",
        "component_type": "property-grid",
        "order": 1,
        "config": {
          "title": "Todos os Imóveis",
          "limit": 12,
          "columns": 3,
          "showFilters": true,
          "showPagination": true,
          "showSort": true
        },
        "style_config": {
          "backgroundColor": "#FFFFFF",
          "padding": "3rem 2rem"
        }
      }
    ]
  }'::jsonb,
  'Imóveis Disponíveis - Imobiliária Demo',
  'Confira todos os nossos imóveis disponíveis para venda e locação. Apartamentos, casas e muito mais.'
);

-- ============================================================================
-- 6. Create Demo Contact Page Layout
-- ============================================================================
DELETE FROM website_layouts 
WHERE page_type = 'contact' AND name LIKE '%Demo%';

INSERT INTO website_layouts (
  company_id,
  name,
  page_type,
  slug,
  is_active,
  is_default,
  layout_config,
  meta_title,
  meta_description
) VALUES (
  'demo-company-id-0000-0000-000000000001'::uuid,
  'Contact Page Demo',
  'contact',
  '/contato',
  true,
  true,
  '{
    "sections": [
      {
        "id": "text-block-1",
        "component_type": "text-block",
        "order": 0,
        "config": {
          "title": "Entre em Contato",
          "content": "Estamos prontos para ajudar você a encontrar o imóvel ideal. Entre em contato conosco através do formulário abaixo ou pelos nossos canais de atendimento.",
          "alignment": "center"
        },
        "style_config": {
          "backgroundColor": "#F5F5F5",
          "padding": "3rem 2rem"
        }
      },
      {
        "id": "contact-form-2",
        "component_type": "contact-form",
        "order": 1,
        "config": {
          "title": "Envie sua Mensagem",
          "fields": ["name", "email", "phone", "subject", "message"],
          "submitButtonText": "Enviar",
          "whatsappIntegration": true,
          "showMap": true
        },
        "style_config": {
          "backgroundColor": "#FFFFFF",
          "padding": "4rem 2rem"
        }
      },
      {
        "id": "map-1",
        "component_type": "map-section",
        "order": 2,
        "config": {
          "title": "Nossa Localização",
          "latitude": -23.5505,
          "longitude": -46.6333,
          "zoom": 15,
          "height": "400px"
        },
        "style_config": {
          "backgroundColor": "#F5F5F5",
          "padding": "0"
        }
      }
    ]
  }'::jsonb,
  'Contato - Imobiliária Demo',
  'Entre em contato com a Imobiliária Demo. Estamos prontos para ajudar você.'
);

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- You can now access the demo site at:
-- - Development: http://localhost:4200/site?domain=demo.imobiliaria.com
-- - Production: Configure DNS to point demo.imobiliaria.com to your server

SELECT 'Demo site setup complete!' as message,
       'Access at: http://localhost:4200/site?domain=demo.imobiliaria.com' as dev_url;
