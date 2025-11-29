/**
 * Database Initialization Script
 * Creates the required tables in Supabase if they don't exist
 * 
 * Run this script with: node src/infrastructure/database/init.js
 * 
 * NOTE: This SQL should be run directly in Supabase SQL Editor
 * as the anon key doesn't have permissions to create tables
 */

const SQL_SCHEMA = `
-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL(10, 2),
    parking INTEGER,
    image_url TEXT,
    image_urls TEXT[] DEFAULT '{}',
    street VARCHAR(255),
    neighborhood VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact VARCHAR(50) NOT NULL,
    featured BOOLEAN DEFAULT FALSE,
    sold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo TEXT,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    description TEXT,
    primary_color VARCHAR(20) DEFAULT '#004AAD',
    secondary_color VARCHAR(20) DEFAULT '#F5A623',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'agent')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_sold ON properties(sold);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_settings_updated_at ON store_settings;
CREATE TRIGGER update_store_settings_updated_at
    BEFORE UPDATE ON store_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional - for production)
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed)
-- CREATE POLICY "Allow public read" ON properties FOR SELECT USING (true);
-- CREATE POLICY "Allow public read" ON store_settings FOR SELECT USING (true);
`;

console.log('='.repeat(60));
console.log('CRM-Imobil Database Schema');
console.log('='.repeat(60));
console.log('');
console.log('Please run the following SQL in your Supabase SQL Editor:');
console.log('Go to: https://supabase.com/dashboard/project/ogixrlwohcwdhitigpta/sql/new');
console.log('');
console.log('-'.repeat(60));
console.log(SQL_SCHEMA);
console.log('-'.repeat(60));
console.log('');
console.log('After running the SQL, your database will be ready to use!');
console.log('='.repeat(60));
