import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Allow backward compatibility during migration
function getSupabaseKey() {
  return process.env.SUPABASE_SECRET_KEY || 
         process.env.SUPABASE_SERVICE_ROLE_KEY || 
         process.env.SUPABASE_PUBLISHABLE_KEY || 
         process.env.SUPABASE_ANON_KEY;
}

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = getSupabaseKey();

  if (!url || !key || url.includes('MY_') || url === '') {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('Connected to Supabase PostgreSQL at:', url);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = getSupabaseKey();
  return Boolean(url && key && !url.includes('MY_') && url.trim() !== '');
}

export async function checkSupabaseHealth(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
