# Password Security Migration Guide

## Overview

This guide explains how to secure user passwords by migrating from plaintext to bcrypt-hashed passwords in the database.

## Security Issue

Previously, user 'Alan Carmo' had a plaintext password stored in the database, which is a critical security vulnerability. Additionally, there was a hardcoded credential fallback in the code that allowed authentication with plaintext passwords.

## What Was Fixed

### 1. Created Migration Script
- **File**: `scripts/run-password-migration.js`
- **Purpose**: Helper script to guide through the password migration process
- **Usage**: `npm run migrate:passwords`

This script:
- Checks Supabase connection
- Displays the migration SQL
- Verifies if the migration has been applied
- Provides step-by-step instructions

### 2. Removed Hardcoded Credentials
- **File**: `src/application/services/UserService.js`
- **Change**: Removed hardcoded credential fallback for 'Alan Carmo' (lines 283-323)
- **Impact**: The application no longer accepts hardcoded credentials

After the database migration is run, users will authenticate using bcrypt-hashed passwords stored in the database.

## How to Run the Migration

### Option 1: Using the Helper Script (Recommended)

1. Ensure your `.env` file has valid Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

2. Run the migration helper:
   ```bash
   npm run migrate:passwords
   ```

3. Follow the on-screen instructions to run the SQL in Supabase SQL Editor

### Option 2: Manual Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open and copy the contents of `migration-hash-passwords.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute

## Migration Details

The migration:
- Checks if Alan Carmo's password is already hashed
- Updates the password to a bcrypt hash (password remains 'alan123')
- Uses bcrypt cost factor of 10 for secure hashing
- Only updates if password is not already hashed (safe to run multiple times)

### Password Mapping
- **Username**: Alan Carmo / alancarmocorretor@gmail.com
- **Password**: alan123 (unchanged, but now hashed)
- **Hash**: `$2b$10$2chBwcqWkCXVL0JBif0R2Og3A0QO8d/CEy2o4yvGso44FrMFqO0oy`

## Post-Migration Steps

After running the migration:

1. ✅ **Verify** the migration was successful:
   ```bash
   npm run migrate:passwords
   ```
   The script will indicate if the password is hashed.

2. ✅ **Test authentication** with the user credentials

3. ✅ **Restart the application** if it's currently running

4. ⚠️ **Recommend password change** - Users should change their passwords to ensure strong, unique passwords

## Security Best Practices

### Implemented ✅
- Bcrypt password hashing (cost=10)
- Removed hardcoded credentials from code
- Constant-time password comparison for timing attack prevention
- Migration script to ensure safe transition

### Recommended for Future 📋
- Implement password strength requirements
- Add password reset functionality
- Implement multi-factor authentication (MFA) for admin accounts
- Regular security audits
- Force password change after migration

## Verification

To verify the security fix is working:

1. **Run the verification script**:
   ```bash
   npm run verify:auth
   ```
   
   This will check:
   - ✅ Bcrypt hash verification works
   - ✅ Hash format detection is correct
   - ✅ Hardcoded credentials are removed
   - ✅ Authentication flow is intact

2. Check for security warnings in logs:
   - ❌ OLD: `[SECURITY] Using hardcoded credential fallback for Alan Carmo`
   - ✅ NEW: No such warnings should appear

3. Attempt login with Alan Carmo credentials:
   - Should authenticate via database bcrypt hash
   - Should NOT use hardcoded fallback

## Troubleshooting

### "Unable to query users table"
- This is expected if RLS (Row Level Security) policies prevent access
- Run the migration manually in Supabase SQL Editor with admin credentials

### "Database not configured"
- Ensure `.env` file has valid `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- See `DATABASE_SETUP.md` for configuration help

### Authentication fails after migration
- Verify the migration was executed successfully
- Check that the password hash was updated in the database
- Ensure the application has been restarted

## Related Files

- `migration-hash-passwords.sql` - SQL migration script
- `scripts/run-password-migration.js` - Helper script
- `src/application/services/UserService.js` - Authentication logic
- `SECURITY_PASSWORD_MIGRATION.md` - Detailed security recommendations

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `SECURITY_PASSWORD_MIGRATION.md` for detailed guidance
3. Consult with a security expert if needed

---

**Status**: 🔐 Security vulnerability fixed - hardcoded credentials removed from code. Database migration script provided and ready to run.
