import { createClient } from '@supabase/supabase-js';

/** True when the public Supabase configuration was supplied at build time. */
export const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
/** Supabase client shared by auth and persistence services. */
export const supabase = isSupabaseConfigured ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }) : null;
