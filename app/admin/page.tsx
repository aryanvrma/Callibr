import { createClient } from '@/lib/supabase/server'
import { CallButton } from './_components/call-button'
import Link from 'next/link'

export default async function AdminHomePage() {
  const supabase = await createClient()

  const { data: cases } = await supabase
    .from('verification_cases')
    .select('id, status, check_type, created_at, candidates(full_name), clients(company_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  const CALLABLE_STATUSES = ['pending', 'needs_retry']

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">All verification cases</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Candidate</th>
            <th>Client</th>
            <th>Status</th>
            <th>Type</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cases?.map((c: any) => (
            <tr key={c.id} className="border-b">
              <td className="py-2">
                <Link href={`/dashboard/cases/${c.id}`} className="text-blue-600 hover:underline">
                  {c.candidates?.full_name}
                </Link>
              </td>
              <td>{c.clients?.company_name}</td>
              <td>{c.status}</td>
              <td>{c.check_type}</td>
              <td>{new Date(c.created_at).toLocaleDateString()}</td>
              <td>
                {CALLABLE_STATUSES.includes(c.status) && <CallButton caseId={c.id} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!cases?.length && (
        <p className="text-gray-500 mt-4">No cases yet.</p>
      )}
    </div>
  )
}
