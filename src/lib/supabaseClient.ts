import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Validate at startup so missing vars surface immediately in the browser console.
if (!supabaseUrl || supabaseUrl.trim() === '') {
  console.error(
    '[supabaseClient] VITE_SUPABASE_URL is not set. ' +
    'Add it to your .env file (locally) or to the Render Environment Variables tab (production).'
  );
}
if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
  console.error(
    '[supabaseClient] VITE_SUPABASE_PUBLISHABLE_KEY is not set. ' +
    'Add it to your .env file (locally) or to the Render Environment Variables tab (production). ' +
    'Use the anon/publishable key ONLY — never the secret key.'
  );
}

/**
 * Singleton Supabase browser client.
 * Will be `null` if the required environment variables are missing,
 * which lets the app render an error state instead of crashing.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

/** True when Supabase is properly configured and the client is ready. */
export const isSupabaseReady = supabase !== null;
