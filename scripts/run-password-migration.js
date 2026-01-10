#!/usr/bin/env node

/**
 * Password Hashing Migration Script
 * 
 * This script runs the migration-hash-passwords.sql file to hash
 * plaintext passwords in the database using bcrypt.
 * 
 * IMPORTANT: This script requires direct database access via Supabase.
 * The SQL should be run manually in the Supabase SQL Editor.
 * 
 * Usage:
 *   node scripts/run-password-migration.js
 * 
 * Or add to package.json and run:
 *   npm run migrate:passwords
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

// ANSI color codes for better output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(70));
    log(title, colors.bright + colors.cyan);
    console.log('='.repeat(70));
}

async function main() {
    logSection('Password Hashing Migration');
    
    // Check for Supabase credentials
    if (!supabaseUrl || !supabaseKey) {
        log('\n❌ ERROR: Supabase credentials not found!', colors.red);
        log('\nPlease configure the following environment variables:', colors.yellow);
        log('  - SUPABASE_URL', colors.yellow);
        log('  - SUPABASE_ANON_KEY', colors.yellow);
        log('\nCopy .env.example to .env and fill in your credentials.', colors.yellow);
        process.exit(1);
    }

    log(`\n✓ Supabase URL: ${supabaseUrl}`, colors.green);
    log('✓ Supabase credentials found', colors.green);

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'migration-hash-passwords.sql');
    
    if (!fs.existsSync(migrationPath)) {
        log(`\n❌ ERROR: Migration file not found at ${migrationPath}`, colors.red);
        process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    log(`✓ Migration file loaded: migration-hash-passwords.sql`, colors.green);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    logSection('Running Migration');
    
    log('\n⚠️  IMPORTANT NOTICE:', colors.yellow + colors.bright);
    log('This script cannot execute SQL directly due to permission restrictions.', colors.yellow);
    log('The anon/public key does not have permission to execute raw SQL.', colors.yellow);
    
    log('\n📋 MANUAL STEPS REQUIRED:', colors.cyan + colors.bright);
    log('1. Go to your Supabase project dashboard', colors.cyan);
    log('2. Navigate to the SQL Editor', colors.cyan);
    log('3. Copy the contents of migration-hash-passwords.sql', colors.cyan);
    log('4. Paste and execute in the SQL Editor', colors.cyan);
    
    logSection('Checking Current Password Status');
    
    try {
        // Check if we can query the users table
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, email, password_hash')
            .eq('id', 'dcffbe62-4247-4e6d-98dc-50097c0d6a64')
            .single();

        if (error) {
            log(`\n❌ Unable to query users table: ${error.message}`, colors.red);
            log('\nThis is expected if the table does not exist or RLS policies prevent access.', colors.yellow);
            log('Please run the migration manually in Supabase SQL Editor.', colors.yellow);
        } else if (users) {
            log('\n✓ Found user: Alan Carmo', colors.green);
            log(`  - User ID: ${users.id}`, colors.blue);
            log(`  - Username: ${users.username}`, colors.blue);
            log(`  - Email: ${users.email}`, colors.blue);
            
            const isBcryptHash = users.password_hash && 
                                (users.password_hash.startsWith('$2a$') || 
                                 users.password_hash.startsWith('$2b$'));
            
            if (isBcryptHash) {
                log(`  - Password Status: ✓ HASHED (bcrypt)`, colors.green);
                log('\n✓ Migration appears to be already applied!', colors.green + colors.bright);
                log('The password is already securely hashed with bcrypt.', colors.green);
            } else {
                log(`  - Password Status: ⚠️  PLAINTEXT or UNKNOWN`, colors.yellow);
                log('\n⚠️  ACTION REQUIRED:', colors.yellow + colors.bright);
                log('Please run migration-hash-passwords.sql in Supabase SQL Editor.', colors.yellow);
            }
        }
    } catch (err) {
        log(`\n❌ Error checking password status: ${err.message}`, colors.red);
    }

    logSection('Migration File Contents');
    log('\nYou can copy the following SQL to run in Supabase SQL Editor:\n', colors.cyan);
    log('─'.repeat(70), colors.blue);
    console.log(migrationSQL);
    log('─'.repeat(70), colors.blue);
    
    logSection('Next Steps');
    log('\n1. Run the migration in Supabase SQL Editor (see above)', colors.cyan);
    log('2. After successful migration, remove hardcoded fallback from UserService.js', colors.cyan);
    log('3. Restart the application', colors.cyan);
    log('\n');
}

main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});
