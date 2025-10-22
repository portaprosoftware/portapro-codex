// ✅ Use environment variables instead of hardcoding Supabase credentials.
// ✅ Safe for multiple deployments (each Vercel project can use different DB).
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Pull from Vite environment variables (these MUST be set in Vercel)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail clearly if missing:
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '❌ Supabase environment variables are missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

// ✅ Export a Supabase client using environment values
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
});
