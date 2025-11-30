/**
 * Supabase Database Client
 * Infrastructure layer - Database connection setup
 * 
 * IMPORTANT: Set environment variables for production:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_KEY: Your Supabase anon key
 */
const { createClient } = require('@supabase/supabase-js');

// Load from environment variables - fallback values are for development only
// In production, these MUST be set as environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('⚠️  Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_KEY environment variables.');
    console.warn('⚠️  Running in offline mode - data will not be persisted.');
    
    // Create a mock client that always fails gracefully with proper method chaining
    const createMockQueryBuilder = () => {
        const errorResponse = { data: null, error: { message: 'Database not configured' } };
        const builder = {
            select: () => builder,
            insert: () => builder,
            update: () => builder,
            delete: () => builder,
            eq: () => builder,
            single: () => Promise.resolve(errorResponse),
            limit: () => builder,
            order: () => builder,
            then: (resolve) => resolve(errorResponse)
        };
        return builder;
    };
    
    // Create mock storage client
    const createMockStorageBuilder = () => {
        const errorResponse = { data: null, error: { message: 'Storage not configured' } };
        const builder = {
            upload: () => Promise.resolve(errorResponse),
            remove: () => Promise.resolve(errorResponse),
            list: () => Promise.resolve(errorResponse),
            getPublicUrl: () => ({ data: { publicUrl: '' } })
        };
        return builder;
    };
    
    supabase = {
        from: () => createMockQueryBuilder(),
        storage: {
            from: () => createMockStorageBuilder()
        }
    };
}

module.exports = supabase;
