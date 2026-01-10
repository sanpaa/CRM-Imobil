#!/usr/bin/env node

/**
 * Assign Subscription Plans to Existing Tenants Script
 * 
 * This script finds all existing companies (tenants) without active subscriptions
 * and assigns them a default subscription plan.
 * 
 * Default Plan Assignment Strategy:
 * - Companies without subscriptions will be assigned the 'Prime' plan (entry level)
 * - This ensures all existing tenants have a valid subscription
 * 
 * Usage:
 *   node scripts/assign-plans-to-existing-tenants.js
 * 
 * Or add to package.json and run:
 *   npm run migrate:assign-plans
 */

require('dotenv').config();
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
    logSection('Assign Subscription Plans to Existing Tenants');
    
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

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    logSection('Step 1: Fetching Available Plans');
    
    // Get all subscription plans
    const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

    if (plansError) {
        log(`\n❌ ERROR: Failed to fetch subscription plans: ${plansError.message}`, colors.red);
        
        if (plansError.message.includes('fetch failed') || plansError.message.includes('ENOTFOUND')) {
            log('\n🌐 Network Error - Possible causes:', colors.yellow);
            log('  1. Internet connection is unavailable', colors.yellow);
            log('  2. Supabase URL is incorrect', colors.yellow);
            log('  3. Supabase service is down', colors.yellow);
            log('\n💡 Solutions:', colors.cyan);
            log('  - Check your internet connection', colors.cyan);
            log('  - Verify SUPABASE_URL in .env file', colors.cyan);
            log('  - Try again later if Supabase is having issues', colors.cyan);
        } else if (plansError.message.includes('relation') || plansError.message.includes('does not exist')) {
            log('\n📋 Database Table Missing - Action Required:', colors.yellow);
            log('  The subscription_plans table does not exist yet.', colors.yellow);
            log('\n💡 Solutions:', colors.cyan);
            log('  1. Run the multi-tenant migration SQL first:', colors.cyan);
            log('     - Open Supabase SQL Editor', colors.cyan);
            log('     - Execute: migration-multi-tenant.sql', colors.cyan);
            log('  2. Then run this script again', colors.cyan);
        } else if (plansError.message.includes('JWT') || plansError.message.includes('auth')) {
            log('\n🔐 Authentication Error:', colors.yellow);
            log('  The Supabase key may be invalid or expired.', colors.yellow);
            log('\n💡 Solutions:', colors.cyan);
            log('  - Verify SUPABASE_ANON_KEY in .env file', colors.cyan);
            log('  - Get a fresh key from Supabase dashboard', colors.cyan);
        }
        
        process.exit(1);
    }

    if (!plans || plans.length === 0) {
        log('\n❌ ERROR: No active subscription plans found in database!', colors.red);
        log('\n📋 MANUAL ACTION REQUIRED:', colors.yellow);
        log('1. Run the multi-tenant migration SQL first:', colors.yellow);
        log('   migration-multi-tenant.sql', colors.yellow);
        log('2. Then run this script again', colors.yellow);
        process.exit(1);
    }

    log(`\n✓ Found ${plans.length} active subscription plans:`, colors.green);
    plans.forEach(plan => {
        log(`  - ${plan.display_name} (${plan.name}): R$ ${plan.price_monthly}/mês`, colors.blue);
    });

    // Find the default plan (Prime - cheapest entry level)
    const defaultPlan = plans.find(p => p.name === 'prime');
    
    if (!defaultPlan) {
        log('\n⚠️  WARNING: Prime plan not found, using first available plan', colors.yellow);
        if (plans.length > 0) {
            log(`Using: ${plans[0].display_name} (${plans[0].name})`, colors.yellow);
        }
    }
    
    const selectedPlan = defaultPlan || plans[0];
    log(`\n✓ Default plan selected: ${selectedPlan.display_name} (${selectedPlan.name})`, colors.green);

    logSection('Step 2: Fetching Companies (Tenants)');

    // Get all active companies
    const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, email, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

    if (companiesError) {
        log(`\n❌ ERROR: Failed to fetch companies: ${companiesError.message}`, colors.red);
        process.exit(1);
    }

    if (!companies || companies.length === 0) {
        log('\n✓ No companies found in database', colors.yellow);
        log('This is expected for a new installation.', colors.yellow);
        process.exit(0);
    }

    log(`\n✓ Found ${companies.length} active companies:`, colors.green);
    companies.forEach((company, index) => {
        log(`  ${index + 1}. ${company.name} (${company.email || 'no email'})`, colors.blue);
    });

    logSection('Step 3: Checking Existing Subscriptions');

    // Skip subscription query if no companies exist
    let existingSubscriptions = [];
    if (companies.length > 0) {
        // Get all existing subscriptions
        const { data, error: subsError } = await supabase
            .from('tenant_subscriptions')
            .select('tenant_id, status, subscription_plans(name, display_name)')
            .in('tenant_id', companies.map(c => c.id));

        if (subsError) {
            log(`\n❌ ERROR: Failed to fetch existing subscriptions: ${subsError.message}`, colors.red);
            process.exit(1);
        }
        
        existingSubscriptions = data || [];
    }

    // Map of tenant_id to subscription status
    const subscriptionMap = new Map();
    existingSubscriptions.forEach(sub => {
        subscriptionMap.set(sub.tenant_id, sub);
    });

    // Partition companies into those with and without active subscriptions in single pass
    const companiesWithSubs = [];
    const companiesWithoutSubs = [];
    
    companies.forEach(company => {
        const sub = subscriptionMap.get(company.id);
        if (sub && sub.status === 'active') {
            companiesWithSubs.push(company);
        } else {
            companiesWithoutSubs.push(company);
        }
    });

    if (companiesWithSubs.length > 0) {
        log(`\n✓ ${companiesWithSubs.length} companies already have active subscriptions:`, colors.green);
        companiesWithSubs.forEach((company) => {
            const sub = subscriptionMap.get(company.id);
            const planName = sub.subscription_plans?.display_name || 'Unknown';
            log(`  - ${company.name}: ${planName}`, colors.blue);
        });
    }

    if (companiesWithoutSubs.length === 0) {
        log('\n✅ All companies already have active subscriptions!', colors.green + colors.bright);
        log('No action needed.', colors.green);
        process.exit(0);
    }

    log(`\n⚠️  Found ${companiesWithoutSubs.length} companies WITHOUT active subscriptions:`, colors.yellow);
    companiesWithoutSubs.forEach((company, index) => {
        log(`  ${index + 1}. ${company.name}`, colors.yellow);
    });

    logSection('Step 4: Assigning Default Plans');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const company of companiesWithoutSubs) {
        log(`\nProcessing: ${company.name}...`, colors.cyan);
        
        // Capture timestamp once for consistency
        const now = new Date().toISOString();
        
        // Check if there's an inactive subscription
        const existingSub = subscriptionMap.get(company.id);
        
        if (existingSub && existingSub.status !== 'active') {
            // Update existing subscription to active
            log(`  → Updating existing ${existingSub.status} subscription to active...`, colors.blue);
            
            // Store original status for safer update condition
            const originalStatus = existingSub.status;
            
            const { data: updated, error: updateError } = await supabase
                .from('tenant_subscriptions')
                .update({ 
                    status: 'active',
                    plan_id: selectedPlan.id,
                    started_at: now,
                    updated_at: now
                })
                .eq('tenant_id', company.id)
                .eq('status', originalStatus)
                .select()
                .single();

            if (updateError) {
                log(`  ✗ Failed to update subscription: ${updateError.message}`, colors.red);
                errors.push({ company: company.name, error: updateError.message });
                errorCount++;
            } else {
                log(`  ✓ Successfully updated subscription to ${selectedPlan.display_name}`, colors.green);
                successCount++;
            }
        } else {
            // Create new subscription
            log(`  → Creating new subscription with ${selectedPlan.display_name} plan...`, colors.blue);
            
            const { data: created, error: createError } = await supabase
                .from('tenant_subscriptions')
                .insert({
                    tenant_id: company.id,
                    plan_id: selectedPlan.id,
                    status: 'active',
                    started_at: now,
                    auto_renew: true,
                    current_users: 0,
                    current_properties: 0,
                    additional_users: 0
                })
                .select()
                .single();

            if (createError) {
                log(`  ✗ Failed to create subscription: ${createError.message}`, colors.red);
                errors.push({ company: company.name, error: createError.message });
                errorCount++;
            } else {
                log(`  ✓ Successfully created subscription with ${selectedPlan.display_name}`, colors.green);
                successCount++;
            }
        }
    }

    logSection('Migration Summary');

    log(`\n📊 Results:`, colors.cyan);
    log(`  • Total companies processed: ${companiesWithoutSubs.length}`, colors.blue);
    log(`  • Successfully assigned: ${successCount}`, colors.green);
    log(`  • Errors: ${errorCount}`, errorCount > 0 ? colors.red : colors.green);
    log(`  • Companies already with subscriptions: ${companiesWithSubs.length}`, colors.blue);

    if (errors.length > 0) {
        log('\n❌ Errors encountered:', colors.red);
        errors.forEach((err, index) => {
            log(`  ${index + 1}. ${err.company}: ${err.error}`, colors.red);
        });
    }

    if (successCount > 0) {
        log('\n✅ Migration completed successfully!', colors.green + colors.bright);
        log(`\n${successCount} companies now have active subscriptions with the ${selectedPlan.display_name} plan.`, colors.green);
        log('\n💡 Next steps:', colors.cyan);
        log('  1. Verify subscriptions in the Supabase dashboard', colors.cyan);
        log('  2. Users can upgrade their plans through the CRM interface', colors.cyan);
        log('  3. Run: npm run verify to check system status', colors.cyan);
    } else if (errorCount > 0) {
        log('\n⚠️  Migration completed with errors', colors.yellow);
        log('Please review the errors above and try again.', colors.yellow);
        process.exit(1);
    }

    log('\n');
}

main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});
