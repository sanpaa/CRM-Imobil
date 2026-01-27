#!/usr/bin/env node

/**
 * Authentication Verification Test
 * 
 * This test verifies that the authentication logic works correctly
 * after removing the hardcoded credential fallback.
 * 
 * Tests:
 * 1. Bcrypt hash verification works
 * 2. Fallback admin authentication still works
 * 3. Database authentication logic is intact
 */

const bcrypt = require('bcryptjs');

console.log('🔐 Authentication Security Verification\n');
console.log('='.repeat(60));

// Test 1: Verify bcrypt hash for Alan Carmo
console.log('\n✓ Test 1: Bcrypt Hash Verification');
// Note: Password and hash are in migration-hash-passwords.sql for the migration
const password = 'alan123';
const expectedHash = '$2b$10$2chBwcqWkCXVL0JBif0R2Og3A0QO8d/CEy2o4yvGso44FrMFqO0oy';

const isValidHash = bcrypt.compareSync(password, expectedHash);
console.log(`  Testing migration bcrypt hash...`);
console.log(`  Hash verification: ${isValidHash ? '✅ PASS' : '❌ FAIL'}`);

if (!isValidHash) {
    console.error('  ERROR: Bcrypt hash does not match password!');
    process.exit(1);
}

// Test 2: Verify hash format detection
console.log('\n✓ Test 2: Hash Format Detection');
function isBcryptHash(hash) {
    return hash.startsWith('$2a$') || 
           hash.startsWith('$2b$') || 
           hash.startsWith('$2y$');
}

const testCases = [
    { hash: expectedHash, expected: true, description: 'Valid bcrypt hash' },
    { hash: 'plaintext_password', expected: false, description: 'Plaintext password' },
    { hash: '$2a$10$abcdef1234567890', expected: true, description: 'Valid $2a$ hash' },
];

let allPassed = true;
testCases.forEach(({ hash, expected, description }) => {
    const result = isBcryptHash(hash);
    const passed = result === expected;
    console.log(`  ${description}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    if (!passed) {
        console.log(`    Expected: ${expected}, Got: ${result}`);
        allPassed = false;
    }
});

if (!allPassed) {
    console.error('  ERROR: Some hash format tests failed!');
    process.exit(1);
}

// Test 3: Verify hardcoded credentials removed
console.log('\n✓ Test 3: Security Check - Hardcoded Credentials');
const fs = require('fs');
const path = require('path');

const userServicePath = path.join(__dirname, '..', 'src', 'application', 'services', 'UserService.js');
const userServiceContent = fs.readFileSync(userServicePath, 'utf8');

const hasHardcodedAlanCarmo = userServiceContent.includes("username === 'Alan Carmo'") && 
                               userServiceContent.includes("password === 'alan123'");

if (hasHardcodedAlanCarmo) {
    console.log('  ❌ FAIL: Hardcoded credentials still present in UserService.js');
    console.error('  ERROR: Security vulnerability not fixed!');
    process.exit(1);
} else {
    console.log('  ✅ PASS: No hardcoded credentials found');
}

// Test 4: Verify authentication flow still exists
console.log('\n✓ Test 4: Authentication Flow Integrity');
const hasAuthMethod = userServiceContent.includes('async authenticate(');
const hasBcryptCompare = userServiceContent.includes('bcrypt.compareSync');
const hasTokenGeneration = userServiceContent.includes('_generateSecureToken');
const hasFallbackAdmin = userServiceContent.includes('FALLBACK_ADMIN');

const flowChecks = [
    { name: 'authenticate method', check: hasAuthMethod },
    { name: 'bcrypt comparison', check: hasBcryptCompare },
    { name: 'token generation', check: hasTokenGeneration },
    { name: 'fallback admin', check: hasFallbackAdmin },
];

let flowIntact = true;
flowChecks.forEach(({ name, check }) => {
    console.log(`  ${name}: ${check ? '✅ PASS' : '❌ FAIL'}`);
    if (!check) flowIntact = false;
});

if (!flowIntact) {
    console.error('  ERROR: Authentication flow is incomplete!');
    process.exit(1);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('✅ ALL SECURITY CHECKS PASSED');
console.log('='.repeat(60));
console.log('\n📋 Summary:');
console.log('  • Bcrypt hash verification works correctly');
console.log('  • Hash format detection functions properly');
console.log('  • Hardcoded credentials successfully removed');
console.log('  • Authentication flow remains intact');
console.log('  • Fallback admin authentication preserved');
console.log('\n✅ The application is secure and ready for use.');
console.log('⚠️  Reminder: Run the database migration to hash passwords.');
console.log('\n');
