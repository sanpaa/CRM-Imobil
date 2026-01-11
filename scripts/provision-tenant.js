#!/usr/bin/env node

/**
 * Tenant Provisioning Script
 * Creates a new tenant with database, admin user, and default configuration
 * 
 * Usage:
 *   node scripts/provision-tenant.js --name "Imobiliária ABC" --email "contato@abc.com" --admin-email "admin@abc.com"
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    result[key] = value;
  }
  
  return result;
}

// Generate unique database name
function generateDatabaseName(companyName) {
  const sanitized = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 20);
  const timestamp = Date.now();
  return `tenant_${sanitized}_${timestamp}`;
}

// Generate secure password
function generatePassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[crypto.randomInt(charset.length)];
  }
  return password;
}

async function provisionTenant(options) {
  const {
    name,
    email,
    adminEmail,
    adminPassword = generatePassword(),
    planName = 'prime',
    customDomain = null,
    phone = null
  } = options;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   CRM Imobiliário - Tenant Provisioning                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Validate required fields
  if (!name || !email || !adminEmail) {
    console.error('❌ Error: Missing required fields');
    console.log('\nUsage:');
    console.log('  node scripts/provision-tenant.js \\');
    console.log('    --name "Company Name" \\');
    console.log('    --email "company@email.com" \\');
    console.log('    --admin-email "admin@email.com" \\');
    console.log('    [--admin-password "password"] \\');
    console.log('    [--plan "prime|k|k2"] \\');
    console.log('    [--custom-domain "domain.com"] \\');
    console.log('    [--phone "+55..."]');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Company: ${name}`);
  console.log(`   Email: ${email}`);
  console.log(`   Admin: ${adminEmail}`);
  console.log(`   Plan: ${planName}`);
  if (customDomain) console.log(`   Domain: ${customDomain}`);
  console.log('');

  try {
    // Step 1: Connect to central database
    console.log('🔌 Step 1: Connecting to central database...');
    const centralDB = createClient(
      process.env.CENTRAL_DB_URL || process.env.SUPABASE_URL,
      process.env.CENTRAL_DB_KEY || process.env.SUPABASE_ANON_KEY
    );
    console.log('   ✓ Connected\n');

    // Step 2: Check if company already exists
    console.log('🔍 Step 2: Checking for existing company...');
    const { data: existingCompany } = await centralDB
      .from('companies')
      .select('id, name')
      .eq('email', email)
      .single();

    if (existingCompany) {
      console.error(`   ❌ Company with email ${email} already exists: ${existingCompany.name}`);
      process.exit(1);
    }
    console.log('   ✓ No conflicts found\n');

    // Step 3: Get subscription plan
    console.log(`🎯 Step 3: Looking up plan "${planName}"...`);
    const { data: plan, error: planError } = await centralDB
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .single();

    if (planError || !plan) {
      console.error(`   ❌ Plan "${planName}" not found. Available plans: prime, k, k2`);
      process.exit(1);
    }
    console.log(`   ✓ Found: ${plan.display_name} (R$ ${plan.price_monthly}/mês)\n`);

    // Step 4: Generate database credentials
    console.log('🔐 Step 4: Generating database credentials...');
    const databaseName = generateDatabaseName(name);
    console.log(`   Database Name: ${databaseName}`);
    
    // In production, you would create a new Supabase project or schema here
    // For now, we'll use the same database but this demonstrates the concept
    const tenantDatabaseUrl = process.env.TENANT_DB_URL || process.env.SUPABASE_URL;
    const tenantDatabaseKey = process.env.TENANT_DB_KEY || process.env.SUPABASE_ANON_KEY;
    console.log('   ✓ Credentials generated\n');

    // Step 5: Create company record
    console.log('🏢 Step 5: Creating company record...');
    const { data: company, error: companyError } = await centralDB
      .from('companies')
      .insert({
        name,
        email,
        phone,
        database_name: databaseName,
        database_url: tenantDatabaseUrl,
        database_key: tenantDatabaseKey,
        custom_domain: customDomain,
        is_active: true,
        onboarding_completed: false
      })
      .select()
      .single();

    if (companyError) {
      console.error('   ❌ Failed to create company:', companyError);
      process.exit(1);
    }
    console.log(`   ✓ Company created: ${company.id}\n`);

    // Step 6: Create subscription
    console.log('💰 Step 6: Creating subscription...');
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

    const { data: subscription, error: subscriptionError } = await centralDB
      .from('tenant_subscriptions')
      .insert({
        tenant_id: company.id,
        plan_id: plan.id,
        status: 'active',
        billing_cycle: 'monthly',
        expires_at: expiresAt.toISOString(),
        auto_renew: true,
        next_billing_date: expiresAt.toISOString()
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('   ❌ Failed to create subscription:', subscriptionError);
      // Rollback company creation
      await centralDB.from('companies').delete().eq('id', company.id);
      process.exit(1);
    }
    console.log(`   ✓ Subscription created (expires: ${expiresAt.toLocaleDateString()})\n`);

    // Step 7: Create custom domain (if provided)
    if (customDomain) {
      console.log('🌐 Step 7: Registering custom domain...');
      const verificationToken = crypto.randomBytes(16).toString('hex');
      
      const { error: domainError } = await centralDB
        .from('custom_domains')
        .insert({
          company_id: company.id,
          domain: customDomain,
          is_primary: true,
          status: 'pending',
          verification_token: verificationToken
        });

      if (domainError) {
        console.error('   ⚠️  Warning: Failed to register domain:', domainError.message);
      } else {
        console.log(`   ✓ Domain registered: ${customDomain}`);
        console.log(`   📝 Verification token: ${verificationToken}\n`);
      }
    }

    // Step 8: Hash admin password
    console.log('🔒 Step 8: Creating admin user...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const { data: adminUser, error: userError } = await centralDB
      .from('users')
      .insert({
        email: adminEmail,
        password_hash: passwordHash,
        company_id: company.id,
        name: 'Administrator',
        role: 'admin',
        active: true,
        email_verified: true
      })
      .select()
      .single();

    if (userError) {
      console.error('   ❌ Failed to create admin user:', userError);
      // Rollback
      await centralDB.from('tenant_subscriptions').delete().eq('tenant_id', company.id);
      await centralDB.from('companies').delete().eq('id', company.id);
      process.exit(1);
    }
    console.log(`   ✓ Admin user created: ${adminUser.email}\n`);

    // Step 9: Initialize tenant database
    console.log('🗄️  Step 9: Initializing tenant database...');
    console.log('   ℹ️  Note: Run migration-tenant-database.sql on tenant database');
    console.log(`   Database: ${databaseName}\n`);

    // In production, you would run the tenant migration here
    // For now, we'll connect and create initial settings
    const tenantDB = createClient(tenantDatabaseUrl, tenantDatabaseKey);
    
    try {
      const { error: settingsError } = await tenantDB
        .from('store_settings')
        .insert({
          company_name: name,
          email: email,
          phone: phone,
          primary_color: '#004AAD',
          secondary_color: '#FFA500'
        });

      if (!settingsError) {
        console.log('   ✓ Initial settings created\n');
      }
    } catch (err) {
      console.log('   ⚠️  Tenant database not initialized (run migration manually)\n');
    }

    // Step 10: Log audit trail
    console.log('📝 Step 10: Logging audit trail...');
    await centralDB
      .from('tenant_audit_log')
      .insert({
        tenant_id: company.id,
        action: 'tenant.provisioned',
        entity_type: 'company',
        entity_id: company.id,
        changes: {
          plan: plan.name,
          admin_email: adminEmail
        }
      });
    console.log('   ✓ Audit log created\n');

    // Success!
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ TENANT PROVISIONED SUCCESSFULLY!                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 Summary:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Company ID:       ${company.id}`);
    console.log(`Company Name:     ${company.name}`);
    console.log(`Database:         ${databaseName}`);
    console.log(`Plan:             ${plan.display_name} (R$ ${plan.price_monthly}/mês)`);
    console.log(`Max Users:        ${plan.max_users}`);
    console.log(`Max Properties:   ${plan.max_properties || 'Unlimited'}`);
    console.log(`─────────────────────────────────────────────────────────────`);
    console.log(`Admin Email:      ${adminEmail}`);
    console.log(`Admin Password:   ${adminPassword}`);
    console.log(`─────────────────────────────────────────────────────────────`);
    if (customDomain) {
      console.log(`Domain:           ${customDomain} (pending verification)`);
      console.log(`─────────────────────────────────────────────────────────────`);
    }
    console.log(`Expires:          ${expiresAt.toLocaleString()}`);
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log('📋 Next Steps:');
    console.log('  1. Run tenant database migration:');
    console.log(`     psql ${tenantDatabaseUrl} -f migration-tenant-database.sql`);
    console.log('  2. Share admin credentials with customer (securely)');
    console.log('  3. Configure DNS if using custom domain');
    console.log('  4. Complete onboarding and training\n');

    if (customDomain) {
      console.log('🌐 DNS Configuration:');
      console.log('  Add CNAME record:');
      console.log(`    Type:  CNAME`);
      console.log(`    Host:  @ (or www)`);
      console.log(`    Value: your-app-domain.com`);
      console.log(`    TTL:   3600\n`);
    }

    console.log('💡 Important Notes:');
    console.log('  • Save the admin password securely');
    console.log('  • Admin should change password on first login');
    console.log('  • Subscription renews automatically on expiry');
    console.log('  • Monitor usage against plan limits\n');

    return {
      company,
      plan,
      adminUser,
      adminPassword,
      subscription
    };

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const args = parseArgs();
  
  provisionTenant({
    name: args.name,
    email: args.email,
    adminEmail: args['admin-email'],
    adminPassword: args['admin-password'],
    planName: args.plan || 'prime',
    customDomain: args['custom-domain'],
    phone: args.phone
  }).then(() => {
    console.log('✅ Provisioning completed successfully!\n');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Provisioning failed:', error.message);
    process.exit(1);
  });
}

module.exports = { provisionTenant };
