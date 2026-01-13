-- ============================================
-- Storage Policies: property-documents bucket
-- Purpose: Secure access to property documents
-- ============================================

-- IMPORTANT: Create the bucket first in Supabase Storage UI:
-- Bucket name: property-documents
-- Public bucket: YES (or configure RLS policies below)

-- ============================================
-- Policy 1: Public Read Access
-- Allow anyone to read/download documents
-- ============================================
CREATE POLICY "Public Access - Read Documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-documents');

-- ============================================
-- Policy 2: Authenticated Users Can Upload
-- Allow authenticated users to upload documents
-- ============================================
CREATE POLICY "Authenticated Users Can Upload Documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'property-documents' 
    AND auth.role() = 'authenticated'
);

-- ============================================
-- Policy 3: Users Can Update Their Own Documents
-- Allow users to update documents from their company
-- ============================================
CREATE POLICY "Users Can Update Own Company Documents"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'property-documents'
    AND auth.role() = 'authenticated'
    -- Add additional logic if you have company_id in path
);

-- ============================================
-- Policy 4: Users Can Delete Their Own Documents
-- Allow users to delete documents from their company
-- ============================================
CREATE POLICY "Users Can Delete Own Company Documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'property-documents'
    AND auth.role() = 'authenticated'
    -- Add additional logic if you have company_id in path
);

-- ============================================
-- Verification
-- ============================================

-- List all policies for property-documents bucket
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%Documents%';

-- ============================================
-- NOTES
-- ============================================
-- 1. Create bucket 'property-documents' in Supabase Storage
-- 2. Set bucket to PUBLIC for easier access
-- 3. Adjust policies based on your security requirements
-- 4. Consider adding company_id validation in policies
-- 5. File organization: {company_id}/{property_id}/{filename}
