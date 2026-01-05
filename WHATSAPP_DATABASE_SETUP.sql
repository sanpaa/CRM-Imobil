-- WhatsApp Integration Database Setup
-- Run these SQL queries in your Supabase dashboard

-- ============================================================================
-- TABLE 1: whatsapp_connections
-- ============================================================================
-- Stores WhatsApp connection information per company
-- One connection per company (UNIQUE constraint on company_id)

CREATE TABLE whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number TEXT,
  is_connected BOOLEAN DEFAULT false,
  session_data JSONB,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Create indexes for optimal query performance
CREATE INDEX idx_whatsapp_connections_company ON whatsapp_connections(company_id);
CREATE INDEX idx_whatsapp_connections_user ON whatsapp_connections(user_id);
CREATE INDEX idx_whatsapp_connections_connected ON whatsapp_connections(is_connected);

-- ============================================================================
-- TABLE 2: whatsapp_messages
-- ============================================================================
-- Stores all received WhatsApp messages
-- Each message has a unique message_id and timestamp

CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT,
  message_id TEXT UNIQUE,
  is_group BOOLEAN DEFAULT false,
  is_from_me BOOLEAN DEFAULT false,
  contact_name TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_whatsapp_messages_connection ON whatsapp_messages(connection_id);
CREATE INDEX idx_whatsapp_messages_company ON whatsapp_messages(company_id);
CREATE INDEX idx_whatsapp_messages_from ON whatsapp_messages(from_number);
CREATE INDEX idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);

-- ============================================================================
-- TABLE 3: whatsapp_auto_clients
-- ============================================================================
-- Maps automatically created clients from WhatsApp messages
-- Tracks which clients were auto-created from which WhatsApp numbers

CREATE TABLE whatsapp_auto_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(connection_id, phone_number)
);

-- Create index for fast lookups
CREATE INDEX idx_whatsapp_auto_clients_connection ON whatsapp_auto_clients(connection_id);

-- ============================================================================
-- VIEWS (OPTIONAL - for easier analytics)
-- ============================================================================

-- View: Recent messages per company
CREATE OR REPLACE VIEW whatsapp_messages_recent AS
SELECT 
    wm.id,
    wm.company_id,
    wm.from_number,
    wm.contact_name,
    wm.body,
    wm.timestamp,
    wm.is_group,
    wm.is_from_me
FROM whatsapp_messages wm
ORDER BY wm.timestamp DESC
LIMIT 100;

-- View: Connection status summary
CREATE OR REPLACE VIEW whatsapp_connections_status AS
SELECT 
    wc.company_id,
    wc.phone_number,
    wc.is_connected,
    wc.last_connected_at,
    COUNT(wm.id) as total_messages,
    COUNT(DISTINCT wm.from_number) as unique_contacts
FROM whatsapp_connections wc
LEFT JOIN whatsapp_messages wm ON wc.id = wm.connection_id
GROUP BY wc.id, wc.company_id, wc.phone_number, wc.is_connected, wc.last_connected_at;

-- ============================================================================
-- HELPFUL QUERIES FOR TESTING
-- ============================================================================

-- Check all connections
-- SELECT id, company_id, phone_number, is_connected, last_connected_at FROM whatsapp_connections;

-- Check recent messages from a number
-- SELECT * FROM whatsapp_messages WHERE from_number = '5511999999999' ORDER BY timestamp DESC LIMIT 10;

-- Check auto-created clients
-- SELECT wac.phone_number, c.name, c.email, wac.created_at FROM whatsapp_auto_clients wac JOIN clients c ON wac.client_id = c.id;

-- Check connection status
-- SELECT * FROM whatsapp_connections_status;

-- Count messages per day
-- SELECT DATE(timestamp) as day, COUNT(*) as message_count FROM whatsapp_messages GROUP BY DATE(timestamp) ORDER BY day DESC;

-- ============================================================================
-- RLS (ROW LEVEL SECURITY) - OPTIONAL
-- ============================================================================
-- Uncomment below if you want to add RLS policies
-- This ensures users can only see their company's WhatsApp data

-- ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE whatsapp_auto_clients ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their company's WhatsApp connections"
-- ON whatsapp_connections FOR SELECT
-- USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- CREATE POLICY "Users can view their company's WhatsApp messages"
-- ON whatsapp_messages FOR SELECT
-- USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- CREATE POLICY "Users can view their company's WhatsApp auto clients"
-- ON whatsapp_auto_clients FOR SELECT
-- USING (connection_id IN (SELECT id FROM whatsapp_connections WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid())));
