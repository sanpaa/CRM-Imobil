-- ============================================================================
-- Property Details - Add rooms/areas fields
-- Description: Adds suites, kitchens, room flags, and area fields to properties
-- ============================================================================

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
    ADD COLUMN IF NOT EXISTS suites INTEGER,
    ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
    ADD COLUMN IF NOT EXISTS garages INTEGER,
    ADD COLUMN IF NOT EXISTS kitchens INTEGER,
    ADD COLUMN IF NOT EXISTS area_privativa DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS area_construtiva DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS area_terreno DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS floor INTEGER,
    ADD COLUMN IF NOT EXISTS furnished BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pronto',
    ADD COLUMN IF NOT EXISTS dining_room BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS living_room BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS service_area BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS closet BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS custom_options JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;
