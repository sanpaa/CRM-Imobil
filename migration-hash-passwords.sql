-- ============================================================================
-- Password Hashing Migration
-- ============================================================================
-- This migration hashes plaintext passwords in the users table
-- Run this in Supabase SQL Editor to improve security
--
-- NOTE: After running this migration, the hardcoded password fallback in
-- UserService.js can be safely removed as the user will authenticate using
-- the bcrypt hash stored in the database.
-- ============================================================================

-- 1. Check current password status
SELECT 
    id, 
    username, 
    email,
    CASE 
        WHEN password_hash LIKE '$2a$%' OR password_hash LIKE '$2b$%' THEN 'hashed'
        ELSE 'plaintext'
    END as password_status
FROM users
WHERE id = 'dcffbe62-4247-4e6d-98dc-50097c0d6a64';

-- 2. Update Alan Carmo's password to bcrypt hash
-- Password: alan123
-- Bcrypt hash (cost=10): $2b$10$2chBwcqWkCXVL0JBif0R2Og3A0QO8d/CEy2o4yvGso44FrMFqO0oy
UPDATE users 
SET 
    password_hash = '$2b$10$2chBwcqWkCXVL0JBif0R2Og3A0QO8d/CEy2o4yvGso44FrMFqO0oy',
    updated_at = NOW()
WHERE id = 'dcffbe62-4247-4e6d-98dc-50097c0d6a64'
    AND NOT (password_hash LIKE '$2a$%' OR password_hash LIKE '$2b$%');

-- 3. Verify the update
SELECT 
    id, 
    username, 
    email,
    CASE 
        WHEN password_hash LIKE '$2a$%' OR password_hash LIKE '$2b$%' THEN 'hashed'
        ELSE 'plaintext'
    END as password_status,
    updated_at
FROM users
WHERE id = 'dcffbe62-4247-4e6d-98dc-50097c0d6a64';

-- 4. Optional: Find and report other users with plaintext passwords
SELECT 
    id, 
    username, 
    email,
    CASE 
        WHEN password_hash LIKE '$2a$%' OR password_hash LIKE '$2b$%' THEN 'hashed'
        ELSE 'plaintext'
    END as password_status
FROM users
WHERE NOT (password_hash LIKE '$2a$%' OR password_hash LIKE '$2b$%');

-- ============================================================================
-- IMPORTANT SECURITY NOTES:
-- ============================================================================
-- 1. This migration uses a pre-computed bcrypt hash for the password 'alan123'
-- 2. After running this migration, update UserService.js to remove the
--    hardcoded password fallback (lines 283-307)
-- 3. For production systems, users should change their passwords after
--    this migration to ensure they use strong, unique passwords
-- 4. Consider implementing a password reset flow that forces users to
--    update from the temporary password
-- ============================================================================
