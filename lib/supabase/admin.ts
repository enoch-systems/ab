import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client — SERVER ONLY (API routes / Edge Functions).
 * Bypasses RLS. Never import from a client component, never prefix the
 * key with NEXT_PUBLIC_.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  return createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
