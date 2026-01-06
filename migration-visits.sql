-- Migration: Create visits table for Visit Itinerary feature
-- This table stores visit information for real estate property visits

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Main visit data
    data_visita DATE NOT NULL,
    hora_visita TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'Agendada' CHECK (status IN ('Agendada', 'Realizada', 'Cancelada')),
    observacoes TEXT,
    
    -- Reference code
    codigo_referencia VARCHAR(100),
    
    -- Client information (JSONB for flexibility)
    cliente JSONB,
    -- Expected structure: { nome, telefoneResidencial, telefoneComercial }
    
    -- Broker information (JSONB for flexibility)
    corretor JSONB,
    -- Expected structure: { nome, creci, telefone }
    
    -- Owner information (JSONB for flexibility)
    proprietario JSONB,
    -- Expected structure: { nome, telefone, email }
    
    -- Properties visited (array of JSONB objects)
    imoveis JSONB DEFAULT '[]'::jsonb,
    -- Expected structure: [{ 
    --   referenciaImovel, 
    --   enderecoCompleto, 
    --   empreendimento,
    --   dormitorios,
    --   suites,
    --   banheiros,
    --   vagas,
    --   areaTotal,
    --   areaConstruida,
    --   valorVendaSugerido,
    --   avaliacao: {
    --     estadoConservacao (1-5),
    --     localizacao (1-5),
    --     valorImovel (1-5),
    --     interesse (DESCARTOU | INTERESSOU | INTERESSOU_E_ASSINOU_PROPOSTA)
    --   }
    -- }]
    
    -- Real estate agency information (JSONB for flexibility)
    imobiliaria JSONB,
    -- Expected structure: { nome, endereco, telefone, logoUrl }
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on visit date for faster queries
CREATE INDEX IF NOT EXISTS idx_visits_data_visita ON visits(data_visita DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);

-- Create index on codigo_referencia for lookups
CREATE INDEX IF NOT EXISTS idx_visits_codigo_referencia ON visits(codigo_referencia);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on UPDATE
DROP TRIGGER IF EXISTS trigger_update_visits_updated_at ON visits;
CREATE TRIGGER trigger_update_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_visits_updated_at();

-- Add comment to table
COMMENT ON TABLE visits IS 'Stores real estate visit itinerary information including clients, brokers, owners, and visited properties with evaluations';

-- Add comments to columns
COMMENT ON COLUMN visits.data_visita IS 'Date of the visit';
COMMENT ON COLUMN visits.hora_visita IS 'Time of the visit';
COMMENT ON COLUMN visits.status IS 'Visit status: Agendada (Scheduled), Realizada (Completed), Cancelada (Cancelled)';
COMMENT ON COLUMN visits.observacoes IS 'General observations about the visit';
COMMENT ON COLUMN visits.codigo_referencia IS 'Reference code for the visit';
COMMENT ON COLUMN visits.cliente IS 'Client information in JSON format';
COMMENT ON COLUMN visits.corretor IS 'Broker information in JSON format';
COMMENT ON COLUMN visits.proprietario IS 'Owner information in JSON format';
COMMENT ON COLUMN visits.imoveis IS 'Array of visited properties with details and evaluations in JSON format';
COMMENT ON COLUMN visits.imobiliaria IS 'Real estate agency information in JSON format';
