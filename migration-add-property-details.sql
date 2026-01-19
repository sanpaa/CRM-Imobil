-- ============================================================================
-- Property Details - Add rooms/areas fields
-- Description: Adds suites, kitchens, room flags, and area totals to properties
-- ============================================================================

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS suites INTEGER,
    ADD COLUMN IF NOT EXISTS kitchens INTEGER,
    ADD COLUMN IF NOT EXISTS total_area DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS built_area DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS dining_room BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS living_room BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS service_area BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS closet BOOLEAN DEFAULT FALSE;
