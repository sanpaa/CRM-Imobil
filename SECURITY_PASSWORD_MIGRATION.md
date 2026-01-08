# Security Recommendations for Password Storage

## Current Situation

The authentication system has been updated to support both:
1. **Bcrypt-hashed passwords** (secure, recommended)
2. **Plaintext passwords** (legacy support, not secure)

This dual support was added because the production database currently uses a `password` column with plaintext passwords instead of the expected `password_hash` column with bcrypt hashes.

## Security Risks

**Storing plaintext passwords is a critical security vulnerability** because:
- If the database is compromised, all user passwords are immediately exposed
- Users who reuse passwords across sites are at risk
- Compliance with security standards (GDPR, PCI-DSS, etc.) may be violated
- It's a major breach of user trust

## Recommended Actions

### 1. Migrate Passwords to Bcrypt Hashes (URGENT)

**Priority: CRITICAL**

All passwords should be hashed using bcrypt. Here's the recommended migration process:

#### Option A: User-Driven Migration (Gradual)

This approach migrates passwords as users log in:

```javascript
// Add this to the authenticate method in UserService.js
if (isValid && !this._isBcryptHash(user.passwordHash)) {
    // User authenticated with plaintext password
    // Migrate to bcrypt hash immediately
    const newHash = bcrypt.hashSync(password, 10);
    await this.userRepository.update(user.id, { passwordHash: newHash });
    console.log(`Migrated password for user ${user.username} to bcrypt hash`);
}
```

#### Option B: Bulk Migration (Immediate)

**WARNING: This approach only works if you have access to plaintext passwords NOW**

```sql
-- First, ensure password_hash column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Then run a migration script to hash all passwords
-- NOTE: You'll need to do this in application code since SQL can't run bcrypt
```

Example migration script:

```javascript
// migration-hash-passwords.js
const bcrypt = require('bcryptjs');
const { SupabaseUserRepository } = require('./src/infrastructure/repositories');

async function migratePasswords() {
    const userRepository = new SupabaseUserRepository();
    const users = await userRepository.findAll();
    
    for (const user of users) {
        // Check if password is plaintext (not a bcrypt hash)
        if (user.passwordHash && !user.passwordHash.startsWith('$2')) {
            const plaintextPassword = user.passwordHash;
            const hashedPassword = bcrypt.hashSync(plaintextPassword, 10);
            
            await userRepository.update(user.id, { 
                passwordHash: hashedPassword 
            });
            
            console.log(`✓ Migrated password for user: ${user.username}`);
        }
    }
    
    console.log('✓ Migration complete!');
}

migratePasswords().catch(console.error);
```

### 2. Update Database Schema

After migrating all passwords:

```sql
-- Rename column to match expected schema
ALTER TABLE users RENAME COLUMN password TO password_hash;

-- Or if both columns exist, drop the old one
ALTER TABLE users DROP COLUMN IF EXISTS password;
```

### 3. Remove Plaintext Password Support

Once all passwords are migrated, remove the plaintext password fallback from the code:

```javascript
// In UserService.js authenticate method
// REMOVE the plaintext comparison logic:
if (this._isBcryptHash(user.passwordHash)) {
    isValid = bcrypt.compareSync(password, user.passwordHash);
} else {
    // DELETE THIS ELSE BLOCK after migration
    isValid = this._constantTimeCompare(user.passwordHash, password);
}

// SIMPLIFY TO:
isValid = bcrypt.compareSync(password, user.passwordHash);
```

### 4. Implement Password Policy

Add requirements for strong passwords:

```javascript
// Example password validation
function isPasswordStrong(password) {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&  // At least one uppercase
           /[a-z]/.test(password) &&  // At least one lowercase
           /[0-9]/.test(password) &&  // At least one number
           /[^A-Za-z0-9]/.test(password); // At least one special char
}
```

### 5. Add Password Reset Functionality

Implement secure password reset:
- Never send passwords via email
- Use time-limited, single-use reset tokens
- Send reset link, not the password

### 6. Consider Multi-Factor Authentication (MFA)

For admin accounts, implement MFA using:
- TOTP (Time-based One-Time Password)
- SMS codes
- Email verification codes

## Monitoring

After migration, monitor for:
- Any remaining plaintext password warnings in logs
- Failed login attempts (potential attacks)
- Unusual authentication patterns

## Timeline

Recommended timeline for migration:

1. **Week 1**: Review and test migration script
2. **Week 2**: Run migration on staging/test environment
3. **Week 3**: Run migration on production during low-traffic period
4. **Week 4**: Remove plaintext password support from code
5. **Week 5**: Deploy simplified authentication code

## References

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [bcrypt npm package](https://www.npmjs.com/package/bcryptjs)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)

## Questions?

If you have questions about this migration, please consult with a security expert before proceeding.
