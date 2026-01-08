# Authentication Fix Summary

## Problem

Users were unable to log in despite having valid credentials in the database. The error was:
```
POST https://crm-imobil.onrender.com/api/auth/login 401 (Unauthorized)
❌ Backend login error: Usuário ou senha inválidos
```

### Example of Failed Login
```json
{
  "email": "paulo.sanches@crm-imobil.com",
  "password": "Pc131415"
}
```

## Root Causes

### Issue 1: Email Not Accepted by Netlify Function
The Netlify serverless function (`netlify/functions/auth.js`) only extracted `username` from the request body:

```javascript
// BEFORE (broken)
const { username, password } = JSON.parse(event.body);
if (!username || !password) {
    return errorResponse(400, 'Usuário e senha são obrigatórios');
}
```

However, the frontend and some users were sending `email` instead of `username`.

### Issue 2: Database Schema Mismatch
The production database has:
- Column name: `password` (not `password_hash`)
- Values: Plaintext passwords (e.g., "Pc131415")

But the code expected:
- Column name: `password_hash`
- Values: Bcrypt hashes (e.g., "$2b$10$...")

## Solution

### Fix 1: Accept Both Username and Email
Updated Netlify function to accept either field:

```javascript
// AFTER (fixed)
const { username, email, password } = JSON.parse(event.body);
const identifier = username || email;

if (!identifier || !password) {
    return errorResponse(400, 'Usuário e senha são obrigatórios');
}

const result = await userService.authenticate(identifier, password);
```

### Fix 2: Support Both Plaintext and Bcrypt Passwords

#### Repository Layer (`SupabaseUserRepository.js`)
Updated to read from either column:

```javascript
passwordHash: row.password_hash || row.password
```

#### Service Layer (`UserService.js`)
Enhanced authentication to handle both:

1. **Detect password format** by checking for bcrypt hash prefix:
   ```javascript
   _isBcryptHash(passwordHash) {
       return passwordHash.startsWith('$2a$') || 
              passwordHash.startsWith('$2b$') || 
              passwordHash.startsWith('$2y$');
   }
   ```

2. **Use appropriate comparison**:
   - Bcrypt hashes: Use `bcrypt.compareSync()`
   - Plaintext: Use `_constantTimeCompare()` (timing-attack resistant)

3. **Log security warnings** when plaintext passwords are detected

## Security Improvements

### 1. Constant-Time Comparison
Prevents timing attacks on plaintext password comparison:

```javascript
_constantTimeCompare(a, b) {
    // Pad to same length to prevent length-based timing attacks
    const maxLength = Math.max(bufferA.length, bufferB.length);
    const paddedA = Buffer.alloc(maxLength);
    const paddedB = Buffer.alloc(maxLength);
    
    bufferA.copy(paddedA);
    bufferB.copy(paddedB);
    
    // Use crypto.timingSafeEqual for constant-time comparison
    const buffersEqual = crypto.timingSafeEqual(paddedA, paddedB);
    const lengthsEqual = bufferA.length === bufferB.length;
    return buffersEqual && lengthsEqual;
}
```

### 2. Proper Error Handling
- Distinguishes between bcrypt errors and plaintext passwords
- Logs warnings for security issues
- Doesn't mask real errors

### 3. Hash Format Detection
- Explicitly checks for bcrypt format before attempting comparison
- Prevents false positives from bcrypt errors

## Testing

Created comprehensive tests verifying:
- ✓ Bcrypt hashed passwords (correct and incorrect)
- ✓ Plaintext passwords (correct and incorrect)  
- ✓ Constant-time comparison security
- ✓ All user credentials from the problem statement
- ✓ Different string lengths
- ✓ Empty strings

CodeQL Security Scan: **0 alerts**

## Files Modified

1. `netlify/functions/auth.js` - Accept email parameter
2. `src/infrastructure/repositories/SupabaseUserRepository.js` - Read both columns
3. `src/application/services/UserService.js` - Enhanced authentication logic

## Next Steps (Recommended)

See `SECURITY_PASSWORD_MIGRATION.md` for:
1. Migrating plaintext passwords to bcrypt hashes
2. Updating database schema
3. Removing plaintext password support
4. Implementing password policies

## Result

Users can now successfully log in with:
- ✅ Username or email
- ✅ Bcrypt-hashed passwords (secure)
- ✅ Plaintext passwords (legacy support)

The authentication system is now backward compatible while maintaining security best practices where possible.
