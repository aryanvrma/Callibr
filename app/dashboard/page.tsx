import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">
        Welcome, {profile?.full_name ?? user.email}
      </h1>
      <p className="text-sm text-gray-500">Role: {profile?.role}</p>

      <form action={logout} className="mt-4">
        <button type="submit" className="rounded border px-3 py-1 text-sm">
          Log out
        </button>
      </form>
    </div>
  )
}
