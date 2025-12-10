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
-- ============================================
-- PART 1: DATABASE TABLES
-- ============================================
-- Run this first in Supabase SQL Editor

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

const STORAGE_POLICY_SQL = `
-- ============================================
-- PART 2: STORAGE BUCKET POLICIES
-- ============================================
-- Run this AFTER creating the storage bucket manually

-- Insert the storage bucket policy to allow public access
-- This is required for image uploads and public viewing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Create policy to allow anyone to upload images
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'property-images');

-- Create policy to allow anyone to read images
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Create policy to allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images');
`;

console.log('='.repeat(70));
console.log('🏗️  CRM-Imobil Database and Storage Setup');
console.log('='.repeat(70));
console.log('');
console.log('📋 STEP 1: Create Database Tables');
console.log('─'.repeat(70));
console.log('');
console.log('1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new');
console.log('2. Copy and run the following SQL:');
console.log('');
console.log('─'.repeat(70));
console.log(SQL_SCHEMA);
console.log('─'.repeat(70));
console.log('');
console.log('');
console.log('🗂️  STEP 2: Create Storage Bucket for Images');
console.log('─'.repeat(70));
console.log('');
console.log('OPTION A: Manual Creation (Recommended for beginners)');
console.log('');
console.log('1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage/buckets');
console.log('2. Click "New bucket"');
console.log('3. Bucket name: property-images');
console.log('4. ✅ Check "Public bucket" (VERY IMPORTANT!)');
console.log('5. Click "Create bucket"');
console.log('');
console.log('OPTION B: SQL Creation (For advanced users)');
console.log('');
console.log('Run this SQL in the SQL Editor:');
console.log('');
console.log('─'.repeat(70));
console.log(STORAGE_POLICY_SQL);
console.log('─'.repeat(70));
console.log('');
console.log('');
console.log('⚙️  STEP 3: Configure Environment Variables');
console.log('─'.repeat(70));
console.log('');
console.log('Create a .env file in the project root with:');
console.log('');
console.log('  SUPABASE_URL=https://your-project-id.supabase.co');
console.log('  SUPABASE_KEY=your-anon-key-here');
console.log('  PORT=3000');
console.log('');
console.log('Get these values from:');
console.log('https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api');
console.log('');
console.log('');
console.log('✅ STEP 4: Verify Setup');
console.log('─'.repeat(70));
console.log('');
console.log('Run: npm run verify');
console.log('');
console.log('This will check if everything is configured correctly.');
console.log('');
console.log('');
console.log('🚀 STEP 5: Start the Server');
console.log('─'.repeat(70));
console.log('');
console.log('Run: npm run dev');
console.log('');
console.log('='.repeat(70));
console.log('');
console.log('⚠️  COMMON ERRORS:');
console.log('');
console.log('❌ "Bucket not found" - You need to create the storage bucket (Step 2)');
console.log('❌ "Upload failed" - Make sure the bucket is PUBLIC');
console.log('❌ "Table does not exist" - Run the database SQL first (Step 1)');
console.log('');
console.log('📚 For more help, see: DATABASE_SETUP.md');
console.log('='.repeat(70));
