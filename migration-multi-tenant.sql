-- ============================================================================
-- Multi-Tenant Migration for CRM Imobil
-- Description: Adds tenant isolation to all tables and creates subscription system
-- Date: 2026-01-10
-- ============================================================================

-- ============================================================================
-- 1. Create subscription_plans table
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2),
  max_users INTEGER NOT NULL,
  max_properties INTEGER,
  additional_user_price DECIMAL(10, 2) NOT NULL,
  activation_fee DECIMAL(10, 2) DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, max_users, max_properties, additional_user_price, activation_fee, features)
VALUES 
  ('prime', 'Prime', 'Plano de entrada para imobiliárias iniciantes', 247.00, 2964.00, 2, 100, 57.00, 197.00, 
   '{"gestao_atendimentos": true, "transferencia_leads": false, "app_mobile": true, "landing_page": true, "treinamento_online": false, "blog": false, "suporte_vip": false, "customer_success": false, "api_imoveis": false, "portal_corretor": false}'::jsonb),
  ('k', 'K', 'Plano intermediário para imobiliárias em crescimento', 397.00, 4764.00, 5, 500, 37.00, 197.00,
   '{"gestao_atendimentos": true, "transferencia_leads": true, "app_mobile": true, "landing_page": true, "treinamento_online": true, "blog": true, "suporte_vip": true, "customer_success": false, "api_imoveis": true, "portal_corretor": true, "treinamentos_gratuitos": 1}'::jsonb),
  ('k2', 'K2', 'Plano completo para imobiliárias estruturadas', 597.00, 7164.00, 12, 0, 27.00, 0.00,
   '{"gestao_atendimentos": true, "transferencia_leads": true, "app_mobile": true, "landing_page": true, "treinamento_online": true, "blog": true, "suporte_vip": true, "customer_success": true, "api_imoveis": true, "portal_corretor": true, "treinamentos_gratuitos": 2}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. Create tenants table (if not exists - or use companies table)
-- ============================================================================
-- Check if companies table exists, if not create tenants table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    CREATE TABLE companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      logo_url TEXT,
      custom_domain VARCHAR(255),
      website_enabled BOOLEAN DEFAULT FALSE,
      website_published BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_companies_active ON companies(is_active);
  END IF;
END $$;

-- ============================================================================
-- 3. Create tenant_subscriptions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT TRUE,
  current_users INTEGER DEFAULT 0,
  current_properties INTEGER DEFAULT 0,
  additional_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, plan_id, status)
);

CREATE INDEX idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX idx_tenant_subscriptions_status ON tenant_subscriptions(status);

-- ============================================================================
-- 4. Add tenant_id to properties table
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'properties' AND column_name = 'tenant_id') THEN
    ALTER TABLE properties ADD COLUMN tenant_id UUID REFERENCES companies(id);
  END IF;
END $$;

-- Create index for tenant filtering
CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_tenant_created ON properties(tenant_id, created_at DESC);

-- ============================================================================
-- 5. Update store_settings with tenant_id
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'store_settings' AND column_name = 'tenant_id') THEN
    ALTER TABLE store_settings ADD COLUMN tenant_id UUID REFERENCES companies(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_store_settings_tenant ON store_settings(tenant_id);

-- ============================================================================
-- 6. Update visits with tenant_id
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'visits' AND column_name = 'tenant_id') THEN
    ALTER TABLE visits ADD COLUMN tenant_id UUID REFERENCES companies(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_visits_tenant_id ON visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visits_tenant_date ON visits(tenant_id, scheduled_date);

-- ============================================================================
-- 7. Ensure users table has company_id properly set up
-- ============================================================================
-- Users table should already have company_id from previous migrations
-- Just ensure index exists
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role);

-- ============================================================================
-- 8. Add tenant_id to clients if not already using company_id
-- ============================================================================
-- Clients table already has company_id, ensure it has proper index
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);

-- ============================================================================
-- 9. Create default tenant for existing data
-- ============================================================================
DO $$
DECLARE
  default_tenant_id UUID;
  default_plan_id UUID;
BEGIN
  -- Create default tenant if no tenants exist
  IF NOT EXISTS (SELECT 1 FROM companies LIMIT 1) THEN
    INSERT INTO companies (id, name, email, is_active)
    VALUES (gen_random_uuid(), 'Tenant Padrão', 'admin@crm.local', true)
    RETURNING id INTO default_tenant_id;
    
    -- Get Prime plan ID
    SELECT id INTO default_plan_id FROM subscription_plans WHERE name = 'prime' LIMIT 1;
    
    -- Create subscription for default tenant
    IF default_plan_id IS NOT NULL THEN
      INSERT INTO tenant_subscriptions (tenant_id, plan_id, status)
      VALUES (default_tenant_id, default_plan_id, 'active');
    END IF;
    
    -- Migrate existing data to default tenant
    UPDATE properties SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE store_settings SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE visits SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE users SET company_id = default_tenant_id WHERE company_id IS NULL;
    
    RAISE NOTICE 'Default tenant created with ID: %', default_tenant_id;
  ELSE
    -- Use first existing company as default tenant
    SELECT id INTO default_tenant_id FROM companies ORDER BY created_at LIMIT 1;
    
    -- Migrate NULL tenant_id to first company
    UPDATE properties SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE store_settings SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE visits SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE users SET company_id = default_tenant_id WHERE company_id IS NULL;
    
    RAISE NOTICE 'Migrated data to existing tenant: %', default_tenant_id;
  END IF;
END $$;

-- ============================================================================
-- 10. Create audit log table for tenant actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_tenant ON tenant_audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_user ON tenant_audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON tenant_audit_log(action);

-- ============================================================================
-- 11. Create helper function to get tenant limits
-- ============================================================================
CREATE OR REPLACE FUNCTION get_tenant_limits(p_tenant_id UUID)
RETURNS TABLE (
  max_users INTEGER,
  current_users INTEGER,
  max_properties INTEGER,
  current_properties INTEGER,
  plan_name VARCHAR,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.max_users,
    ts.current_users,
    sp.max_properties,
    ts.current_properties,
    sp.name,
    sp.features
  FROM tenant_subscriptions ts
  JOIN subscription_plans sp ON ts.plan_id = sp.id
  WHERE ts.tenant_id = p_tenant_id 
    AND ts.status = 'active'
  ORDER BY ts.started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. Create trigger to update current usage counts
-- ============================================================================
CREATE OR REPLACE FUNCTION update_tenant_usage_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_count INTEGER;
BEGIN
  -- Get tenant_id from the record
  IF TG_TABLE_NAME = 'users' THEN
    v_tenant_id := COALESCE(NEW.company_id, OLD.company_id);
  ELSIF TG_TABLE_NAME = 'properties' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  END IF;
  
  IF v_tenant_id IS NOT NULL THEN
    -- Update user count
    IF TG_TABLE_NAME = 'users' THEN
      SELECT COUNT(*) INTO v_count FROM users WHERE company_id = v_tenant_id AND active = true;
      UPDATE tenant_subscriptions SET current_users = v_count WHERE tenant_id = v_tenant_id AND status = 'active';
    END IF;
    
    -- Update property count
    IF TG_TABLE_NAME = 'properties' THEN
      SELECT COUNT(*) INTO v_count FROM properties WHERE tenant_id = v_tenant_id;
      UPDATE tenant_subscriptions SET current_properties = v_count WHERE tenant_id = v_tenant_id AND status = 'active';
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for usage tracking
DROP TRIGGER IF EXISTS trigger_update_user_count ON users;
CREATE TRIGGER trigger_update_user_count
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION update_tenant_usage_counts();

DROP TRIGGER IF EXISTS trigger_update_property_count ON properties;
CREATE TRIGGER trigger_update_property_count
  AFTER INSERT OR UPDATE OR DELETE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_tenant_usage_counts();

-- ============================================================================
-- 13. Create Row Level Security (RLS) policies (optional but recommended)
-- ============================================================================
-- Uncomment these if you want to enable RLS for additional security

-- Enable RLS on properties
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation on properties
-- CREATE POLICY tenant_isolation_properties ON properties
--   USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Enable RLS on visits
-- ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation on visits
-- CREATE POLICY tenant_isolation_visits ON visits
--   USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- Run this migration, then update your application code to:
-- 1. Extract tenant_id from authenticated user's company_id
-- 2. Inject tenant_id in all queries automatically
-- 3. Validate limits before creating users/properties
-- 4. Log critical actions in tenant_audit_log
-- ============================================================================
