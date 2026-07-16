import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
  .from('profiles')
  .select('role, full_name, client_id')
  .eq('id', user.id)
  .single()

return { user, profile: profile as { role: string; full_name: string; client_id: string } | null }
}

export async function requireAdmin() {
  const { user, profile } = await requireUser()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return { user, profile }
}
