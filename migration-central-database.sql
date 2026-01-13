-- ============================================================================
-- Central Database Migration - CRM Imobiliário Multi-Tenant
-- Description: Creates central database schema for authentication, companies,
--              subscriptions, and routing to tenant databases
-- Date: 2026-01-11
-- ============================================================================

-- ============================================================================
-- 1. Companies Table (Tenants)
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  logo_url TEXT,
  
  -- Database connection info for this tenant
  database_name VARCHAR(100) NOT NULL UNIQUE,
  database_url TEXT NOT NULL,
  database_key TEXT NOT NULL,
  
  -- Domain mapping
  custom_domain VARCHAR(255) UNIQUE,
  subdomain VARCHAR(100),
  
  -- Website settings
  website_enabled BOOLEAN DEFAULT FALSE,
  website_published BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_custom_domain ON companies(custom_domain);
CREATE INDEX IF NOT EXISTS idx_companies_subdomain ON companies(subdomain);
CREATE INDEX IF NOT EXISTS idx_companies_database_name ON companies(database_name);

-- Comments
COMMENT ON TABLE companies IS 'Central registry of all tenant companies';
COMMENT ON COLUMN companies.database_name IS 'Unique identifier for tenant database';
COMMENT ON COLUMN companies.database_url IS 'Supabase project URL for tenant database';
COMMENT ON COLUMN companies.database_key IS 'Supabase API key for tenant database';

-- ============================================================================
-- 2. Users Table (Authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Tenant association
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- User info
  name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  
  -- Role and permissions
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  permissions JSONB DEFAULT '{}',
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Authentication
  last_login_at TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint
  UNIQUE(email, company_id)
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Comments
COMMENT ON TABLE users IS 'User authentication and authorization';
COMMENT ON COLUMN users.company_id IS 'Links user to their tenant company';
COMMENT ON COLUMN users.role IS 'User role: admin, manager, agent, user';

-- ============================================================================
-- 3. Subscription Plans Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan identification
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2),
  activation_fee DECIMAL(10, 2) DEFAULT 0,
  
  -- Limits
  max_users INTEGER NOT NULL,
  max_properties INTEGER, -- NULL = unlimited
  additional_user_price DECIMAL(10, 2) NOT NULL,
  
  -- Features (JSONB for flexibility)
  features JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  
  -- Display order
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO subscription_plans (
  name, 
  display_name, 
  description, 
  price_monthly, 
  price_yearly, 
  max_users, 
  max_properties, 
  additional_user_price, 
  activation_fee, 
  sort_order,
  features
) VALUES 
  (
    'prime', 
    'Prime', 
    'Plano de entrada para imobiliárias iniciantes. Ideal para equipes pequenas que estão começando.', 
    247.00, 
    2964.00, 
    2, 
    100, 
    57.00, 
    197.00, 
    1,
    '{
      "gestao_atendimentos": true,
      "cadastro_imoveis": true,
      "cadastro_clientes": true,
      "agenda_visitas": true,
      "app_mobile": true,
      "landing_page": true,
      "upload_fotos": true,
      "upload_documentos": true,
      "transferencia_leads": false,
      "blog": false,
      "suporte_vip": false,
      "customer_success": false,
      "api_imoveis": false,
      "portal_corretor": false,
      "integracao_portais": false,
      "treinamentos_gratuitos": 0
    }'::jsonb
  ),
  (
    'k', 
    'K', 
    'Plano intermediário para imobiliárias em crescimento. Mais recursos e melhor custo-benefício.', 
    397.00, 
    4764.00, 
    5, 
    500, 
    37.00, 
    197.00,
    2,
    '{
      "gestao_atendimentos": true,
      "cadastro_imoveis": true,
      "cadastro_clientes": true,
      "agenda_visitas": true,
      "app_mobile": true,
      "landing_page": true,
      "upload_fotos": true,
      "upload_documentos": true,
      "transferencia_leads": true,
      "blog": true,
      "suporte_vip": true,
      "customer_success": false,
      "api_imoveis": true,
      "portal_corretor": true,
      "integracao_portais": true,
      "treinamentos_gratuitos": 1
    }'::jsonb
  ),
  (
    'k2', 
    'K2', 
    'Plano completo para imobiliárias estruturadas. Todos os recursos + Customer Success dedicado.', 
    597.00, 
    7164.00, 
    12, 
    NULL, 
    27.00, 
    0.00,
    3,
    '{
      "gestao_atendimentos": true,
      "cadastro_imoveis": true,
      "cadastro_clientes": true,
      "agenda_visitas": true,
      "app_mobile": true,
      "landing_page": true,
      "upload_fotos": true,
      "upload_documentos": true,
      "transferencia_leads": true,
      "blog": true,
      "suporte_vip": true,
      "customer_success": true,
      "api_imoveis": true,
      "portal_corretor": true,
      "integracao_portais": true,
      "treinamentos_gratuitos": 2,
      "imoveis_ilimitados": true
    }'::jsonb
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_users = EXCLUDED.max_users,
  max_properties = EXCLUDED.max_properties,
  additional_user_price = EXCLUDED.additional_user_price,
  activation_fee = EXCLUDED.activation_fee,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = CURRENT_TIMESTAMP;

-- Indexes for subscription_plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_public ON subscription_plans(is_public);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON subscription_plans(sort_order);

-- Comments
COMMENT ON TABLE subscription_plans IS 'Available subscription plans';
COMMENT ON COLUMN subscription_plans.max_properties IS 'NULL means unlimited';

-- ============================================================================
-- 4. Tenant Subscriptions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Subscription details
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'expired', 'trial')),
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Dates
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Renewal
  auto_renew BOOLEAN DEFAULT TRUE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  
  -- Current usage (updated by triggers in tenant DB)
  current_users INTEGER DEFAULT 0,
  current_properties INTEGER DEFAULT 0,
  additional_users INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tenant_subscriptions
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_plan ON tenant_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_expiry ON tenant_subscriptions(expires_at) WHERE expires_at IS NOT NULL;

-- Comments
COMMENT ON TABLE tenant_subscriptions IS 'Active subscriptions for each tenant';
COMMENT ON COLUMN tenant_subscriptions.current_users IS 'Current number of active users';
COMMENT ON COLUMN tenant_subscriptions.current_properties IS 'Current number of properties';

-- ============================================================================
-- 5. Custom Domains Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Domain info
  domain VARCHAR(255) NOT NULL UNIQUE,
  subdomain VARCHAR(100),
  
  -- Status
  is_primary BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'disabled')),
  
  -- SSL/DNS verification
  ssl_status VARCHAR(50) DEFAULT 'pending',
  dns_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP WITH TIME ZONE,
  last_checked_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for custom_domains
CREATE INDEX IF NOT EXISTS idx_custom_domains_company ON custom_domains(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON custom_domains(status);
CREATE INDEX IF NOT EXISTS idx_custom_domains_primary ON custom_domains(company_id, is_primary) WHERE is_primary = TRUE;

-- Comments
COMMENT ON TABLE custom_domains IS 'Custom domains mapped to tenant companies';

-- ============================================================================
-- 6. Tenant Audit Log Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action details
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB,
  
  -- Request details
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tenant_audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON tenant_audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON tenant_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON tenant_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON tenant_audit_log(entity_type, entity_id);

-- Partitioning by month for performance (optional but recommended)
-- CREATE TABLE tenant_audit_log_2026_01 PARTITION OF tenant_audit_log
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Comments
COMMENT ON TABLE tenant_audit_log IS 'Audit trail for tenant actions';

-- ============================================================================
-- 7. Helper Functions
-- ============================================================================

-- Function to get tenant limits and current usage
CREATE OR REPLACE FUNCTION get_tenant_limits(p_tenant_id UUID)
RETURNS TABLE (
  max_users INTEGER,
  current_users INTEGER,
  max_properties INTEGER,
  current_properties INTEGER,
  plan_name VARCHAR,
  plan_display_name VARCHAR,
  features JSONB,
  subscription_status VARCHAR,
  is_trial BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.max_users,
    ts.current_users,
    sp.max_properties,
    ts.current_properties,
    sp.name,
    sp.display_name,
    sp.features,
    ts.status,
    (ts.status = 'trial')::BOOLEAN
  FROM tenant_subscriptions ts
  JOIN subscription_plans sp ON ts.plan_id = sp.id
  WHERE ts.tenant_id = p_tenant_id 
    AND ts.status IN ('active', 'trial')
  ORDER BY ts.started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_tenant_limits IS 'Get current limits and usage for a tenant';

-- Function to check if tenant can perform action
CREATE OR REPLACE FUNCTION can_tenant_perform_action(
  p_tenant_id UUID,
  p_action VARCHAR
)
RETURNS TABLE (
  can_perform BOOLEAN,
  reason TEXT,
  current_count INTEGER,
  max_count INTEGER
) AS $$
DECLARE
  v_limits RECORD;
BEGIN
  -- Get tenant limits
  SELECT * INTO v_limits FROM get_tenant_limits(p_tenant_id);
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'No active subscription found', NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check subscription status
  IF v_limits.subscription_status NOT IN ('active', 'trial') THEN
    RETURN QUERY SELECT FALSE, 'Subscription is not active', NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check specific action
  IF p_action = 'create_user' THEN
    IF v_limits.max_users IS NOT NULL AND v_limits.current_users >= v_limits.max_users THEN
      RETURN QUERY SELECT 
        FALSE, 
        'User limit reached. Please upgrade your plan or add additional users.', 
        v_limits.current_users,
        v_limits.max_users;
      RETURN;
    END IF;
  ELSIF p_action = 'create_property' THEN
    IF v_limits.max_properties IS NOT NULL AND v_limits.current_properties >= v_limits.max_properties THEN
      RETURN QUERY SELECT 
        FALSE, 
        'Property limit reached. Please upgrade your plan.', 
        v_limits.current_properties,
        v_limits.max_properties;
      RETURN;
    END IF;
  END IF;
  
  -- Action allowed
  RETURN QUERY SELECT TRUE, 'Action allowed', v_limits.current_users, v_limits.max_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_tenant_perform_action IS 'Check if tenant can perform specific action based on limits';

-- Function to get company by domain
CREATE OR REPLACE FUNCTION get_company_by_domain(p_domain VARCHAR)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  database_name VARCHAR,
  database_url TEXT,
  database_key TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.database_name,
    c.database_url,
    c.database_key,
    c.is_active
  FROM companies c
  LEFT JOIN custom_domains cd ON c.id = cd.company_id
  WHERE c.custom_domain = p_domain 
     OR cd.domain = p_domain
     OR c.subdomain = p_domain
  AND c.is_active = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_company_by_domain IS 'Get company info by domain for routing';

-- ============================================================================
-- 8. Triggers
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
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
  BEFORE UPDATE ON tenant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. Row Level Security (Optional but Recommended)
-- ============================================================================

-- Enable RLS on users table
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see users from their own company
-- CREATE POLICY users_tenant_isolation ON users
--   USING (company_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Policy: Admins can see all users in their company
-- CREATE POLICY users_admin_access ON users
--   USING (
--     company_id IN (
--       SELECT company_id FROM users 
--       WHERE id = current_setting('app.current_user_id', TRUE)::UUID 
--       AND role = 'admin'
--     )
--   );

-- ============================================================================
-- Migration Complete!
-- ============================================================================

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Central Database Migration Completed Successfully!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  ✓ companies (tenants registry)';
  RAISE NOTICE '  ✓ users (authentication)';
  RAISE NOTICE '  ✓ subscription_plans (3 plans: Prime, K, K2)';
  RAISE NOTICE '  ✓ tenant_subscriptions (active subscriptions)';
  RAISE NOTICE '  ✓ custom_domains (domain mapping)';
  RAISE NOTICE '  ✓ tenant_audit_log (audit trail)';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions Created:';
  RAISE NOTICE '  ✓ get_tenant_limits()';
  RAISE NOTICE '  ✓ can_tenant_perform_action()';
  RAISE NOTICE '  ✓ get_company_by_domain()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Create tenant databases as needed';
  RAISE NOTICE '  2. Run migration-tenant-database.sql on each tenant DB';
  RAISE NOTICE '  3. Update application to use ConnectionManager';
  RAISE NOTICE '  4. Test tenant provisioning flow';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;
