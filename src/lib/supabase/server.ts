import { createClient } from '@supabase/supabase-js';

// Server-only client. Uses the service role key, so this file must
// NEVER be imported into a client component.
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}