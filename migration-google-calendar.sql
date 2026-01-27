-- Migration: Google Calendar integration tables

-- Table for OAuth connection per company
CREATE TABLE IF NOT EXISTS google_calendar_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_connected BOOLEAN DEFAULT FALSE,
    email TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    calendar_id TEXT DEFAULT 'primary',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_google_calendar_connections_company_user
ON google_calendar_connections(company_id, user_id);

-- Table for mapping visits to Google Calendar events
CREATE TABLE IF NOT EXISTS google_calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    user_id UUID NOT NULL,
    visit_id UUID NOT NULL,
    event_id TEXT NOT NULL,
    calendar_id TEXT DEFAULT 'primary',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_google_calendar_events_company_user_visit
ON google_calendar_events(company_id, user_id, visit_id);

-- updated_at trigger helpers
CREATE OR REPLACE FUNCTION update_google_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_google_calendar_connections_updated_at ON google_calendar_connections;
CREATE TRIGGER trigger_update_google_calendar_connections_updated_at
    BEFORE UPDATE ON google_calendar_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_google_calendar_updated_at();

DROP TRIGGER IF EXISTS trigger_update_google_calendar_events_updated_at ON google_calendar_events;
CREATE TRIGGER trigger_update_google_calendar_events_updated_at
    BEFORE UPDATE ON google_calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_google_calendar_updated_at();
