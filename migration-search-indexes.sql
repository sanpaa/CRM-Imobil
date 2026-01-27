-- ============================================================================
-- Global Search Indexes - CRM Imobiliario
-- Description: Adds indexes for fast ILIKE/contains searches
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
    -- Use text-based trigram indexes; fall back to casting when columns are JSONB.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'name') THEN
        CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON clients USING GIN (name gin_trgm_ops);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
        CREATE INDEX IF NOT EXISTS idx_clients_email_trgm ON clients USING GIN (email gin_trgm_ops);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'phone') THEN
        CREATE INDEX IF NOT EXISTS idx_clients_phone_trgm ON clients USING GIN (phone gin_trgm_ops);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'title') THEN
        CREATE INDEX IF NOT EXISTS idx_properties_title_trgm ON properties USING GIN (title gin_trgm_ops);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'description') THEN
        CREATE INDEX IF NOT EXISTS idx_properties_description_trgm ON properties USING GIN (description gin_trgm_ops);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'street') THEN
        CREATE INDEX IF NOT EXISTS idx_properties_street_trgm ON properties USING GIN (street gin_trgm_ops);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'neighborhood') THEN
        CREATE INDEX IF NOT EXISTS idx_properties_neighborhood_trgm ON properties USING GIN (neighborhood gin_trgm_ops);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'city') THEN
        CREATE INDEX IF NOT EXISTS idx_properties_city_trgm ON properties USING GIN (city gin_trgm_ops);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'cliente' AND data_type = 'jsonb') THEN
        CREATE INDEX IF NOT EXISTS idx_visits_cliente_trgm ON visits USING GIN ((cliente::text) gin_trgm_ops);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'cliente') THEN
        CREATE INDEX IF NOT EXISTS idx_visits_cliente_trgm ON visits USING GIN (cliente gin_trgm_ops);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'corretor' AND data_type = 'jsonb') THEN
        CREATE INDEX IF NOT EXISTS idx_visits_corretor_trgm ON visits USING GIN ((corretor::text) gin_trgm_ops);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'corretor') THEN
        CREATE INDEX IF NOT EXISTS idx_visits_corretor_trgm ON visits USING GIN (corretor gin_trgm_ops);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'codigo_referencia') THEN
        CREATE INDEX IF NOT EXISTS idx_visits_codigo_trgm ON visits USING GIN (codigo_referencia gin_trgm_ops);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'data_visita') THEN
        CREATE INDEX IF NOT EXISTS idx_visits_data_visita ON visits (data_visita DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'negocios' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_negocios_status_trgm ON negocios USING GIN (status gin_trgm_ops);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'negocios' AND column_name = 'codigo') THEN
        CREATE INDEX IF NOT EXISTS idx_negocios_codigo_trgm ON negocios USING GIN (codigo gin_trgm_ops);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'negocios' AND column_name = 'cliente') THEN
        CREATE INDEX IF NOT EXISTS idx_negocios_cliente_trgm ON negocios USING GIN (cliente gin_trgm_ops);
    END IF;
END $$;
