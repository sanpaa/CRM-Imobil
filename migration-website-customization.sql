-- Migration: Website Customization System
-- Description: Adds tables and fields for custom domains, website layouts, and components
-- Date: 2024-12-31

-- ============================================================================
-- 1. Create custom_domains table
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  domain VARCHAR(255) NOT NULL UNIQUE,
  subdomain VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  ssl_enabled BOOLEAN DEFAULT FALSE,
  ssl_certificate TEXT,
  ssl_expires_at TIMESTAMP WITH TIME ZONE,
  dns_configured BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255) NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'active', 'failed', 'disabled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for company_id lookups
CREATE INDEX idx_custom_domains_company_id ON custom_domains(company_id);

-- Add index for domain lookups
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);

-- Add index for status filtering
CREATE INDEX idx_custom_domains_status ON custom_domains(status);

-- ============================================================================
-- 2. Create website_layouts table
-- ============================================================================
CREATE TABLE IF NOT EXISTS website_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  page_type VARCHAR(50) NOT NULL CHECK (page_type IN ('home', 'properties', 'property-detail', 'about', 'contact', 'custom')),
  slug VARCHAR(255),
  is_active BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  layout_config JSONB NOT NULL DEFAULT '{"sections": []}',
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for company_id lookups
CREATE INDEX idx_website_layouts_company_id ON website_layouts(company_id);

-- Add index for page_type filtering
CREATE INDEX idx_website_layouts_page_type ON website_layouts(page_type);

-- Add index for active layouts
CREATE INDEX idx_website_layouts_active ON website_layouts(is_active);

-- Add unique constraint for company + slug
CREATE UNIQUE INDEX idx_website_layouts_company_slug ON website_layouts(company_id, slug) WHERE slug IS NOT NULL;

-- ============================================================================
-- 3. Create website_components table
-- ============================================================================
CREATE TABLE IF NOT EXISTS website_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  component_type VARCHAR(100) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  style_config JSONB NOT NULL DEFAULT '{}',
  is_reusable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for company_id lookups
CREATE INDEX idx_website_components_company_id ON website_components(company_id);

-- Add index for component_type filtering
CREATE INDEX idx_website_components_type ON website_components(component_type);

-- Add index for reusable components
CREATE INDEX idx_website_components_reusable ON website_components(is_reusable);

-- ============================================================================
-- 4. Extend companies table (if columns don't exist)
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'companies' AND column_name = 'custom_domain') THEN
    ALTER TABLE companies ADD COLUMN custom_domain VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'companies' AND column_name = 'website_enabled') THEN
    ALTER TABLE companies ADD COLUMN website_enabled BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'companies' AND column_name = 'website_published') THEN
    ALTER TABLE companies ADD COLUMN website_published BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================================================
-- 5. Extend store_settings table (if it exists and columns don't exist)
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'store_settings' AND column_name = 'layout_config') THEN
      ALTER TABLE store_settings ADD COLUMN layout_config JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'store_settings' AND column_name = 'theme_config') THEN
      ALTER TABLE store_settings ADD COLUMN theme_config JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'store_settings' AND column_name = 'social_links') THEN
      ALTER TABLE store_settings ADD COLUMN social_links JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'store_settings' AND column_name = 'business_hours') THEN
      ALTER TABLE store_settings ADD COLUMN business_hours JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'store_settings' AND column_name = 'header_image') THEN
      ALTER TABLE store_settings ADD COLUMN header_image TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'store_settings' AND column_name = 'footer_text') THEN
      ALTER TABLE store_settings ADD COLUMN footer_text TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'store_settings' AND column_name = 'show_properties_count') THEN
      ALTER TABLE store_settings ADD COLUMN show_properties_count BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'store_settings' AND column_name = 'contact_form_enabled') THEN
      ALTER TABLE store_settings ADD COLUMN contact_form_enabled BOOLEAN DEFAULT TRUE;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 6. Create trigger functions for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for auto-updating updated_at
DROP TRIGGER IF EXISTS update_custom_domains_updated_at ON custom_domains;
CREATE TRIGGER update_custom_domains_updated_at
  BEFORE UPDATE ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_website_layouts_updated_at ON website_layouts;
CREATE TRIGGER update_website_layouts_updated_at
  BEFORE UPDATE ON website_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_website_components_updated_at ON website_components;
CREATE TRIGGER update_website_components_updated_at
  BEFORE UPDATE ON website_components
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_components ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. Create RLS Policies
-- ============================================================================

-- Policies for custom_domains
DROP POLICY IF EXISTS "Users can view their company's domains" ON custom_domains;
CREATE POLICY "Users can view their company's domains"
  ON custom_domains FOR SELECT
  USING (company_id IN (SELECT id FROM companies WHERE id = auth.uid() OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert their company's domains" ON custom_domains;
CREATE POLICY "Users can insert their company's domains"
  ON custom_domains FOR INSERT
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE id = auth.uid() OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update their company's domains" ON custom_domains;
CREATE POLICY "Users can update their company's domains"
  ON custom_domains FOR UPDATE
  USING (company_id IN (SELECT id FROM companies WHERE id = auth.uid() OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

-- Policies for website_layouts
DROP POLICY IF EXISTS "Users can view their company's layouts" ON website_layouts;
CREATE POLICY "Users can view their company's layouts"
  ON website_layouts FOR SELECT
  USING (company_id IN (SELECT id FROM companies WHERE id = auth.uid() OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert their company's layouts" ON website_layouts;
CREATE POLICY "Users can insert their company's layouts"
  ON website_layouts FOR INSERT
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE id = auth.uid() OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update their company's layouts" ON website_layouts;
CREATE POLICY "Users can update their company's layouts"
  ON website_layouts FOR UPDATE
  USING (company_id IN (SELECT id FROM companies WHERE id = auth.uid() OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

-- Policies for website_components
DROP POLICY IF EXISTS "Users can view their company's components" ON website_components;
CREATE POLICY "Users can view their company's components"
  ON website_components FOR SELECT
  USING (company_id IN (SELECT id FROM companies WHERE id = auth.uid() OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert their company's components" ON website_components;
CREATE POLICY "Users can insert their company's components"
  ON website_components FOR INSERT
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE id = auth.uid() OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update their company's components" ON website_components;
CREATE POLICY "Users can update their company's components"
  ON website_components FOR UPDATE
  USING (company_id IN (SELECT id FROM companies WHERE id = auth.uid() OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

-- ============================================================================
-- 9. Grant permissions
-- ============================================================================
GRANT ALL ON custom_domains TO authenticated;
GRANT ALL ON website_layouts TO authenticated;
GRANT ALL ON website_components TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Run this script in your Supabase SQL Editor to set up the website customization system
