-- ============================================
-- Migration: Add document_urls to properties table
-- Purpose: Support document attachment in property registration
-- ============================================

-- Add document_urls column (array of text)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS document_urls text[];

-- Add comment to the column
COMMENT ON COLUMN properties.document_urls IS 'Array of URLs for attached documents (PDF, DOC, DOCX, XLS, XLSX, TXT) - max 10 documents';

-- Add constraint to limit maximum number of documents to 10
ALTER TABLE properties 
ADD CONSTRAINT check_document_urls_limit 
CHECK (array_length(document_urls, 1) IS NULL OR array_length(document_urls, 1) <= 10);

-- Create GIN index for better performance on document_urls queries
CREATE INDEX IF NOT EXISTS idx_properties_document_urls 
ON properties USING GIN (document_urls);

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'properties' 
  AND column_name = 'document_urls';

-- Show sample of properties with document_urls
SELECT 
    id,
    title,
    document_urls,
    array_length(document_urls, 1) as document_count
FROM properties
LIMIT 5;
