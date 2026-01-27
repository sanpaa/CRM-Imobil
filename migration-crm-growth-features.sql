-- ============================================================================
-- CRM Growth Features - Leads, Timeline, Pipeline, Automation, KPIs
-- Description: Adds core CRM tables and indexes for lead management and pipeline
-- Date: 2026-01-21
-- ============================================================================

-- ============================================================================
-- 1. Leads Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  source VARCHAR(20) NOT NULL DEFAULT 'MANUAL'
    CHECK (source IN ('WHATSAPP', 'SITE', 'PORTAL', 'MANUAL')),
  status VARCHAR(20) NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED')),
  assigned_user_id UUID,
  converted_client_id UUID,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_created ON leads(tenant_id, created_at DESC);

-- ============================================================================
-- 2. Activities Table (Global Timeline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  entity_type VARCHAR(20) NOT NULL
    CHECK (entity_type IN ('LEAD', 'CLIENT', 'DEAL', 'PROPERTY')),
  entity_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('NOTE', 'MESSAGE', 'VISIT', 'STATUS', 'SYSTEM')),
  description TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_activities_tenant_entity ON activities(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant_created ON activities(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, created_at DESC);

-- ============================================================================
-- 3. Deal Stages Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS deal_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_won BOOLEAN DEFAULT FALSE,
  is_lost BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT deal_stages_unique_per_tenant UNIQUE (tenant_id, name),
  CONSTRAINT deal_stages_won_lost CHECK (NOT (is_won AND is_lost))
);

CREATE INDEX IF NOT EXISTS idx_deal_stages_tenant_order ON deal_stages(tenant_id, sort_order);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'deals'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'stage_id'
  ) THEN
    ALTER TABLE deals ADD COLUMN stage_id UUID REFERENCES deal_stages(id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'negocios'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'negocios' AND column_name = 'stage_id'
  ) THEN
    ALTER TABLE negocios ADD COLUMN stage_id UUID REFERENCES deal_stages(id);
  END IF;
END $$;

-- ============================================================================
-- 4. Automation Rules Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  trigger VARCHAR(50) NOT NULL
    CHECK (trigger IN ('NEW_LEAD', 'NO_RESPONSE_24H', 'DEAL_STAGE_CHANGED')),
  condition JSONB,
  action VARCHAR(50) NOT NULL
    CHECK (action IN ('CREATE_TASK', 'SEND_WHATSAPP', 'SEND_EMAIL')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant_trigger ON automation_rules(tenant_id, trigger, is_active);

-- ============================================================================
-- 5. KPI Snapshots Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS kpi_snapshots (
  tenant_id UUID NOT NULL,
  date DATE NOT NULL,
  leads_new INTEGER DEFAULT 0,
  visits_done INTEGER DEFAULT 0,
  deals_won INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  PRIMARY KEY (tenant_id, date)
);

-- ============================================================================
-- 6. Soft Delete Columns (Core Tables)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'deleted_at') THEN
    ALTER TABLE properties ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'deleted_at') THEN
    ALTER TABLE clients ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visits')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'deleted_at') THEN
    ALTER TABLE visits ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_messages' AND column_name = 'deleted_at') THEN
    ALTER TABLE whatsapp_messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deals')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'deleted_at') THEN
    ALTER TABLE deals ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'negocios')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'negocios' AND column_name = 'deleted_at') THEN
    ALTER TABLE negocios ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ============================================================================
-- 7. Indexes for tenant filtering (if tenant/company columns exist)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tenant_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id)';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'company_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'tenant_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON properties(tenant_id)';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'company_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_properties_company_id ON properties(company_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deals')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'stage_id') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'tenant_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_deals_tenant_stage ON deals(tenant_id, stage_id)';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'company_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_deals_company_stage ON deals(company_id, stage_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'negocios')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'negocios' AND column_name = 'stage_id') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'negocios' AND column_name = 'tenant_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_negocios_tenant_stage ON negocios(tenant_id, stage_id)';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'negocios' AND column_name = 'company_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_negocios_company_stage ON negocios(company_id, stage_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_messages' AND column_name = 'created_at') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_messages' AND column_name = 'company_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_whatsapp_company_timestamp ON whatsapp_messages(company_id, created_at DESC)';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_messages' AND column_name = 'tenant_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_whatsapp_tenant_timestamp ON whatsapp_messages(tenant_id, created_at DESC)';
    END IF;
  END IF;
END $$;
