#!/usr/bin/env node
/**
 * Setup Verification Script
 * Run this script to check your CRM-Imobil configuration
 * 
 * Usage: node verify-setup.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('═'.repeat(60));
console.log('🔍 CRM-Imobil Setup Verification');
console.log('═'.repeat(60));
console.log('');

// Step 1: Check environment variables
console.log('📋 Step 1: Checking Environment Variables...');
console.log('');

const checks = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    adminUsername: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD,
    port: process.env.PORT
};

let envOk = true;

if (checks.supabaseUrl) {
    console.log('✅ SUPABASE_URL: Configured');
} else {
    console.log('❌ SUPABASE_URL: NOT SET');
    envOk = false;
}

if (checks.supabaseKey) {
    console.log('✅ SUPABASE_KEY: Configured');
} else {
    console.log('❌ SUPABASE_KEY: NOT SET');
    envOk = false;
}

if (checks.adminUsername) {
    console.log(`✅ ADMIN_USERNAME: ${checks.adminUsername}`);
} else {
    console.log('⚠️  ADMIN_USERNAME: Using default (admin)');
}

if (checks.adminPassword) {
    console.log('✅ ADMIN_PASSWORD: Configured');
} else {
    console.log('⚠️  ADMIN_PASSWORD: Using default (admin123)');
}

if (checks.port) {
    console.log(`✅ PORT: ${checks.port}`);
} else {
    console.log('⚠️  PORT: Using default (3000)');
}

console.log('');

if (!envOk) {
    console.log('❌ Environment variables are not properly configured!');
    console.log('');
    console.log('Please create a .env file with:');
    console.log('  SUPABASE_URL=https://your-project.supabase.co');
    console.log('  SUPABASE_KEY=your-anon-key-here');
    console.log('');
    console.log('See .env.example for a template.');
    console.log('');
    process.exit(1);
}

// Step 2: Test Supabase connection
console.log('🔌 Step 2: Testing Supabase Connection...');
console.log('');

async function testSupabase() {
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );

    try {
        // Test properties table
        const { data: propData, error: propError } = await supabase
            .from('properties')
            .select('count', { count: 'exact', head: true });

        if (propError) {
            console.log('❌ Properties table: NOT ACCESSIBLE');
            console.log(`   Error: ${propError.message}`);
            if (propError.message.includes('does not exist') || propError.message.includes('relation')) {
                console.log('   → The table probably doesn\'t exist yet.');
                console.log('   → Run the SQL from src/infrastructure/database/init.js in Supabase SQL Editor');
            }
        } else {
            console.log('✅ Properties table: Accessible');
        }

        // Test users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });

        if (userError) {
            console.log('❌ Users table: NOT ACCESSIBLE');
            console.log(`   Error: ${userError.message}`);
        } else {
            console.log('✅ Users table: Accessible');
        }

        // Test store_settings table
        const { data: settingsData, error: settingsError } = await supabase
            .from('store_settings')
            .select('count', { count: 'exact', head: true });

        if (settingsError) {
            console.log('❌ Store Settings table: NOT ACCESSIBLE');
            console.log(`   Error: ${settingsError.message}`);
        } else {
            console.log('✅ Store Settings table: Accessible');
        }

        console.log('');

        // Test storage bucket
        console.log('🗂️  Step 3: Testing Storage Bucket...');
        console.log('');

        const { data: buckets, error: bucketError } = await supabase
            .storage
            .listBuckets();

        if (bucketError) {
            console.log('❌ Storage: NOT ACCESSIBLE');
            console.log(`   Error: ${bucketError.message}`);
        } else {
            const propertyImagesBucket = buckets.find(b => b.name === 'property-images');
            if (propertyImagesBucket) {
                console.log('✅ Storage bucket "property-images": Found');
                if (propertyImagesBucket.public) {
                    console.log('✅ Bucket is PUBLIC (correct)');
                } else {
                    console.log('⚠️  Bucket is PRIVATE (should be public for image uploads)');
                }
            } else {
                console.log('❌ Storage bucket "property-images": NOT FOUND');
                console.log('   → Create it in Supabase Dashboard > Storage');
                console.log('   → Make sure it\'s PUBLIC');
            }
        }

        console.log('');
        console.log('═'.repeat(60));
        console.log('✅ Verification Complete!');
        console.log('═'.repeat(60));
        console.log('');
        console.log('Next steps:');
        console.log('1. If any tables are missing, run the SQL from:');
        console.log('   src/infrastructure/database/init.js');
        console.log('2. If storage bucket is missing, create "property-images" bucket');
        console.log('3. Start the server with: npm run dev');
        console.log('');

    } catch (error) {
        console.log('');
        console.log('❌ Connection Error:', error.message);
        console.log('');
        console.log('This could mean:');
        console.log('1. Network connectivity issues');
        console.log('2. Invalid Supabase URL or KEY');
        console.log('3. Supabase project is paused or deleted');
        console.log('');
        console.log('Please check:');
        console.log('- Your .env file has the correct SUPABASE_URL and SUPABASE_KEY');
        console.log('- Your Supabase project is active at https://supabase.com/dashboard');
        console.log('');
    }
}

testSupabase();
