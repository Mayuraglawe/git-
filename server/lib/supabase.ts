import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found in environment variables');
  console.warn('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
}

/**
 * Supabase client for server-side operations
 * Used for database queries, authentication, and real-time subscriptions
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Server-side, no session persistence needed
  },
});

/**
 * Helper function to check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey);
}

/**
 * Get Supabase configuration status
 */
export function getSupabaseStatus() {
  return {
    configured: isSupabaseConfigured(),
    url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not set',
    hasKey: !!supabaseKey,
  };
}
