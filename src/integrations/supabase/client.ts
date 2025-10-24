import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ybtzqxizhphtvauklwvj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidHpxeGl6aHBodHZhdWtsd3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDk1OTQsImV4cCI6MjA1MTQyNTU5NH0.bQFkhtX1Ev9NuREWljIwBxrV7FqTvyiYTmpUMKYOIx4";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
