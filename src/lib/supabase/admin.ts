import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

// SERVER-ONLY. Never import this in a Client Component or expose
// SUPABASE_SERVICE_ROLE_KEY to the browser — this client bypasses RLS
// entirely. Use it only in server actions / route handlers where you've
// already verified the user's identity and role in code, and you
// explicitly scope the write to that user's own data (e.g. their client_id).
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
