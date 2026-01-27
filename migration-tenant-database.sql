-- ============================================================================
-- Tenant Database Migration - CRM Imobiliário Multi-Tenant
-- Description: Creates schema for individual tenant databases
--              This contains all business data for a single tenant/company
-- Date: 2026-01-11
-- ============================================================================

-- Note: This migration should be run on EACH tenant database separately
-- The central database does NOT contain properties, clients, etc.

-- ============================================================================
-- 1. Properties Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Type and category
  type VARCHAR(50) NOT NULL, -- casa, apartamento, terreno, comercial
  category VARCHAR(50) NOT NULL, -- venda, aluguel, temporada
  status VARCHAR(50) DEFAULT 'available', -- available, rented, sold, reserved
  
  -- Location
  address TEXT,
  neighborhood VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'Brasil',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Pricing
  price DECIMAL(12, 2),
  price_per_sqm DECIMAL(10, 2),
  condominium_fee DECIMAL(10, 2),
  iptu DECIMAL(10, 2),
  
  -- Characteristics
  bedrooms INTEGER,
  bathrooms INTEGER,
  suites INTEGER,
  parking_spaces INTEGER,
  total_area DECIMAL(10, 2),
  built_area DECIMAL(10, 2),
  
  -- Features (JSONB for flexibility)
  features JSONB DEFAULT '{}',
  
  -- Media
  image_urls TEXT[],
  document_urls TEXT[],
  video_url TEXT,
  virtual_tour_url TEXT,
  
  -- SEO and marketing
  slug VARCHAR(255),
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Visibility
  is_featured BOOLEAN DEFAULT FALSE,
  show_on_website BOOLEAN DEFAULT TRUE,
  show_address BOOLEAN DEFAULT TRUE,
  
  -- Reference and ownership
  reference_code VARCHAR(50),
  owner_name VARCHAR(255),
  owner_phone VARCHAR(50),
  owner_email VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT check_document_urls_limit CHECK (array_length(document_urls, 1) IS NULL OR array_length(document_urls, 1) <= 10),
  CONSTRAINT check_image_urls_limit CHECK (array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 30)
);

-- Indexes for properties
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_properties_website ON properties(show_on_website) WHERE show_on_website = TRUE;
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST(ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);
CREATE INDEX IF NOT EXISTS idx_properties_reference ON properties(reference_code);
CREATE INDEX IF NOT EXISTS idx_properties_document_urls ON properties USING GIN (document_urls);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties USING GIN (
  to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(address, ''))
);

-- Comments
COMMENT ON TABLE properties IS 'Properties/listings for this tenant';
COMMENT ON COLUMN properties.features IS 'JSON object with features like {pool: true, gym: false, etc}';

-- ============================================================================
-- 2. Clients Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  cpf_cnpj VARCHAR(20),
  
  -- Type
  type VARCHAR(50) DEFAULT 'buyer', -- buyer, seller, renter, landlord, lead
  
  -- Address
  address TEXT,
  city VARCHAR(255),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  
  -- Preferences (JSONB for flexibility)
  preferences JSONB DEFAULT '{}',
  
  -- Notes
  notes TEXT,
  
  -- Lead source
  source VARCHAR(100), -- website, phone, referral, portal, etc
  source_details TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, converted, lost
  
  -- Assigned to
  assigned_to_user_id UUID,
  
  -- Tags
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_contact_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source);
CREATE INDEX IF NOT EXISTS idx_clients_assigned ON clients(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_created ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN (tags);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_clients_search ON clients USING GIN (
  to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, ''))
);

-- Comments
COMMENT ON TABLE clients IS 'Clients and leads for this tenant';

-- ============================================================================
-- 3. Visits Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Schedule
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show
  
  -- Assigned agent
  agent_user_id UUID,
  
  -- Notes
  notes TEXT,
  client_feedback TEXT,
  agent_feedback TEXT,
  
  -- Result
  interested BOOLEAN,
  interest_level INTEGER, -- 1-5
  follow_up_required BOOLEAN DEFAULT FALSE,
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for visits
CREATE INDEX IF NOT EXISTS idx_visits_property ON visits(property_id);
CREATE INDEX IF NOT EXISTS idx_visits_client ON visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_agent ON visits(agent_user_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at DESC);

-- Comments
COMMENT ON TABLE visits IS 'Scheduled property visits';

-- ============================================================================
-- 4. Store Settings Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company branding
  company_name VARCHAR(255),
  company_tagline TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  
  -- Contact info
  email VARCHAR(255),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  address TEXT,
  
  -- Social media
  facebook_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  
  -- Visual config
  primary_color VARCHAR(7) DEFAULT '#004AAD',
  secondary_color VARCHAR(7) DEFAULT '#FFA500',
  font_family VARCHAR(100) DEFAULT 'Inter, sans-serif',
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  
  -- Features config
  enable_whatsapp BOOLEAN DEFAULT TRUE,
  enable_blog BOOLEAN DEFAULT FALSE,
  enable_portal_corretor BOOLEAN DEFAULT FALSE,
  
  -- Custom CSS/JS
  custom_css TEXT,
  custom_js TEXT,
  
  -- Google Analytics
  google_analytics_id VARCHAR(50),
  google_tag_manager_id VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO store_settings (company_name, primary_color, secondary_color)
VALUES ('Minha Imobiliária', '#004AAD', '#FFA500')
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE store_settings IS 'Visual and operational settings for this tenant';

-- ============================================================================
-- 5. Website Layouts Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS website_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Page info
  name VARCHAR(255) NOT NULL,
  page_type VARCHAR(50) NOT NULL, -- home, about, contact, properties, blog
  slug VARCHAR(255) NOT NULL,
  
  -- Layout configuration (JSONB)
  layout_config JSONB NOT NULL DEFAULT '{"sections": []}',
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  
  -- Order
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for website_layouts
CREATE INDEX IF NOT EXISTS idx_layouts_slug ON website_layouts(slug);
CREATE INDEX IF NOT EXISTS idx_layouts_type ON website_layouts(page_type);
CREATE INDEX IF NOT EXISTS idx_layouts_active ON website_layouts(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_layouts_published ON website_layouts(is_published) WHERE is_published = TRUE;

-- Comments
COMMENT ON TABLE website_layouts IS 'Page layouts for tenant website';

-- ============================================================================
-- 6. WhatsApp Messages Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Message info
  message_id VARCHAR(255) UNIQUE,
  from_number VARCHAR(50) NOT NULL,
  to_number VARCHAR(50) NOT NULL,
  message_body TEXT,
  
  -- Media
  media_url TEXT,
  media_type VARCHAR(50),
  
  -- Direction
  direction VARCHAR(20) NOT NULL, -- inbound, outbound
  
  -- Status
  status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read, failed
  
  -- Related to
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for whatsapp_messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_from ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_to ON whatsapp_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_client ON whatsapp_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_property ON whatsapp_messages(property_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_direction ON whatsapp_messages(direction);

-- Comments
COMMENT ON TABLE whatsapp_messages IS 'WhatsApp messages for this tenant';

-- ============================================================================
-- 7. Activity Log Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor (user who performed the action)
  user_id UUID,
  user_name VARCHAR(255),
  
  -- Action
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  
  -- Details
  description TEXT,
  changes JSONB,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for activity_log
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- Comments
COMMENT ON TABLE activity_log IS 'Activity history for this tenant';

-- ============================================================================
-- 8. Helper Functions
-- ============================================================================

-- Function to update property count (called from application)
CREATE OR REPLACE FUNCTION get_properties_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM properties;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get client count
CREATE OR REPLACE FUNCTION get_clients_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM clients;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. Triggers
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_layouts_updated_at
  BEFORE UPDATE ON website_layouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. Initial Data
-- ============================================================================

-- Insert sample property types (optional)
-- You can customize this based on your needs

-- ============================================================================
-- Migration Complete!
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Tenant Database Migration Completed Successfully!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  ✓ properties (listings)';
  RAISE NOTICE '  ✓ clients (leads and customers)';
  RAISE NOTICE '  ✓ visits (scheduled visits)';
  RAISE NOTICE '  ✓ store_settings (branding)';
  RAISE NOTICE '  ✓ website_layouts (pages)';
  RAISE NOTICE '  ✓ whatsapp_messages (communication)';
  RAISE NOTICE '  ✓ activity_log (audit trail)';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions Created:';
  RAISE NOTICE '  ✓ get_properties_count()';
  RAISE NOTICE '  ✓ get_clients_count()';
  RAISE NOTICE '';
  RAISE NOTICE 'This tenant database is ready to use!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Configure store_settings with company info';
  RAISE NOTICE '  2. Create website layouts';
  RAISE NOTICE '  3. Start adding properties and clients';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;
