import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/env.client';

export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);
