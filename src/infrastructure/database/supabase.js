/**
 * Supabase Database Client
 * Infrastructure layer - Database connection setup
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ogixrlwohcwdhitigpta.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naXhybHdvaGN3ZGhpdGlncHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDgzNDksImV4cCI6MjA4MDAyNDM0OX0.c02HNZRMZRGjcZcCAZ-U3LMjdUUEfdZwXo-hh5Tr5po';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
