#!/usr/bin/env node
/**
 * Supabase Storage Setup Script
 * This script helps you set up the required storage bucket for image uploads
 * 
 * Usage: node setup-storage.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('═'.repeat(70));
console.log('🗂️  Supabase Storage Setup for CRM-Imobil');
console.log('═'.repeat(70));
console.log('');

// Check environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.log('❌ Error: Supabase credentials not found!');
    console.log('');
    console.log('Please create a .env file with:');
    console.log('  SUPABASE_URL=https://your-project-id.supabase.co');
    console.log('  SUPABASE_KEY=your-anon-key-here');
    console.log('');
    console.log('Get these values from:');
    console.log('https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api');
    console.log('');
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

/**
 * Helper function to generate Supabase dashboard URL
 * @param {string} path - The path after the project ID
 * @returns {string} - Full dashboard URL
 */
function getDashboardUrl(path = '') {
    const baseUrl = process.env.SUPABASE_URL || '';
    // Extract project ID from URL (e.g., https://abcd1234.supabase.co -> abcd1234)
    const projectId = baseUrl.replace('https://', '').split('.')[0];
    return `https://supabase.com/dashboard/project/${projectId}${path}`;
}

async function checkAndCreateBucket() {
    try {
        console.log('🔍 Checking for existing buckets...');
        console.log('');
        
        // List existing buckets
        const { data: buckets, error: listError } = await supabase
            .storage
            .listBuckets();
        
        if (listError) {
            throw new Error(`Failed to list buckets: ${listError.message}`);
        }
        
        console.log(`📦 Found ${buckets.length} bucket(s):`);
        buckets.forEach(bucket => {
            const publicStatus = bucket.public ? '✅ PUBLIC' : '⚠️  PRIVATE';
            console.log(`   - ${bucket.name} ${publicStatus}`);
        });
        console.log('');
        
        // Check if property-images bucket exists
        const propertyImagesBucket = buckets.find(b => b.name === 'property-images');
        
        if (propertyImagesBucket) {
            console.log('✅ Bucket "property-images" already exists!');
            console.log('');
            
            if (propertyImagesBucket.public) {
                console.log('✅ Bucket is PUBLIC - Image uploads will work correctly!');
                console.log('');
                console.log('═'.repeat(70));
                console.log('✅ Storage setup is complete!');
                console.log('═'.repeat(70));
                console.log('');
                console.log('You can now:');
                console.log('1. Run: npm run verify - to verify complete setup');
                console.log('2. Run: npm run dev - to start the server');
                console.log('');
            } else {
                console.log('⚠️  WARNING: Bucket exists but is PRIVATE!');
                console.log('');
                console.log('Image uploads may fail because the bucket is not public.');
                console.log('');
                console.log('To fix this:');
                console.log('1. Go to: ' + getDashboardUrl('/storage/buckets'));
                console.log('2. Click on "property-images" bucket');
                console.log('3. Click "Edit bucket" or settings');
                console.log('4. Enable "Public bucket"');
                console.log('5. Save changes');
                console.log('');
            }
        } else {
            console.log('❌ Bucket "property-images" NOT found!');
            console.log('');
            console.log('📋 MANUAL SETUP REQUIRED:');
            console.log('═'.repeat(70));
            console.log('');
            console.log('The anon key cannot create storage buckets.');
            console.log('You need to create the bucket manually:');
            console.log('');
            console.log('METHOD 1: Using Supabase Dashboard (Recommended)');
            console.log('─'.repeat(70));
            console.log('');
            console.log('1. Go to: ' + getDashboardUrl('/storage/buckets'));
            console.log('2. Click "New bucket" or "+ New bucket"');
            console.log('3. Bucket name: property-images');
            console.log('4. ✅ Check "Public bucket" (IMPORTANT!)');
            console.log('5. Click "Create bucket"');
            console.log('');
            console.log('');
            console.log('METHOD 2: Using SQL (Advanced)');
            console.log('─'.repeat(70));
            console.log('');
            console.log('1. Go to: ' + getDashboardUrl('/sql/new'));
            console.log('2. Run this SQL:');
            console.log('');
            console.log(`INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');`);
            console.log('');
            console.log('');
            console.log('After creating the bucket, run this script again to verify!');
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('');
        console.log('This might mean:');
        console.log('1. Invalid Supabase credentials in .env');
        console.log('2. Network connectivity issues');
        console.log('3. Supabase project is paused or deleted');
        console.log('');
        console.log('Please check your .env file and Supabase project status.');
        console.log('');
        process.exit(1);
    }
}

checkAndCreateBucket();
