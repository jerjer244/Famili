/* Famili backend config.
   Leave empty = "Local mode" (accounts, sharing and groups live in this browser only).
   Fill in from Supabase → Project Settings → API to enable real cloud accounts, sync, sharing and groups.
   The anon key is safe to publish; access is protected by the Row Level Security rules in supabase.sql. */
window.FAMILI_CONFIG = { supabaseUrl: '', supabaseKey: '' };
