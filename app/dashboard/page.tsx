import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/lib/actions/auth'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  dialing: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-blue-100 text-blue-700',
  needs_retry: 'bg-yellow-100 text-yellow-700',
  escalated: 'bg-orange-100 text-orange-700',
  verified: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700'
}

export default async function DashboardPage() {
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

  const { data: cases } = await supabase
    .from('verification_cases')
    .select('id, status, check_type, created_at, candidates(full_name), employers(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">
            Welcome, {profile?.full_name ?? user.email}
          </h1>
          <p className="text-sm text-gray-500">Role: {profile?.role}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/new-case"
            className="rounded bg-black px-4 py-2 text-sm text-white">
            New request
          </Link>
          <form action={logout}>
            <button type="submit" className="rounded border px-3 py-2 text-sm">
              Log out
            </button>
          </form>
        </div>
      </div>

      {!profile?.client_id && profile?.role === 'client' && (
        <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded p-3 mb-4">
          Your account isn't linked to a client organization yet — contact support before
          submitting requests.
        </p>
      )}

      <h2 className="text-sm font-medium text-gray-500 mb-2">Verification requests</h2>

      {!cases?.length && (
        <p className="text-gray-500 text-sm">No requests yet.</p>
      )}

      {!!cases?.length && (
        <table className="w-full text-sm border rounded overflow-hidden">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="py-2 px-3">Candidate</th>
              <th className="px-3">Employer</th>
              <th className="px-3">Type</th>
              <th className="px-3">Status</th>
              <th className="px-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c: any) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="py-2 px-3">
                  <Link href={`/dashboard/cases/${c.id}`} className="text-blue-600 hover:underline">
                    {c.candidates?.full_name}
                  </Link>
                </td>
                <td className="px-3">{c.employers?.name}</td>
                <td className="px-3">{c.check_type}</td>
                <td className="px-3">
                  <span className={`px-2 py-1 rounded text-xs ${STATUS_STYLES[c.status] ?? ''}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-3 text-gray-500">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
