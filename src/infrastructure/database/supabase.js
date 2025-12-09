/**
 * Supabase Database Client
 * Infrastructure layer - Database connection setup
 * 
 * IMPORTANT: Set environment variables for production:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_KEY: Your Supabase anon key
 */
const { createClient } = require('@supabase/supabase-js');
const { hasValidSupabaseCredentials } = require('../../utils/envUtils');

// Load from environment variables - fallback values are for development only
// In production, these MUST be set as environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
let isOfflineMode = false;

if (hasValidSupabaseCredentials(supabaseUrl, supabaseKey)) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Database conectado com sucesso!');
} else {
    isOfflineMode = true;
    console.log('');
    console.log('📘 Modo somente-leitura ativado (sem banco de dados configurado)');
    console.log('💡 Para habilitar todas as funcionalidades, configure o Supabase no arquivo .env');
    console.log('📖 Veja DATABASE_SETUP.md para instruções');
    console.log('');
    
    // Create a mock client that always fails gracefully with proper method chaining
    const createMockQueryBuilder = () => {
        const errorResponse = { data: null, error: { message: 'Database not configured', silent: true } };
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
        const errorResponse = { data: null, error: { message: 'Storage not configured', silent: true } };
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
module.exports.isOfflineMode = isOfflineMode;
