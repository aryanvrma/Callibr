import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
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

export default async function CaseDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: caseData } = await supabase
    .from('verification_cases')
    .select(`
      id, status, check_type, retry_count, created_at, updated_at,
      candidates ( full_name, phone, email ),
      employers ( name, hr_contact_name, hr_contact_phone, hr_contact_email ),
      clients ( company_name )
    `)
    .eq('id', id)
    .single()

  if (!caseData) notFound()

  const { data: callLogs } = await supabase
    .from('call_logs')
    .select('*')
    .eq('case_id', id)
    .order('created_at', { ascending: false })

  const candidate = caseData.candidates as any
  const employer = caseData.employers as any
  const client = caseData.clients as any

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <div>
        <a href="javascript:history.back()" className="text-sm text-gray-500">&larr; Back</a>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{candidate?.full_name}</h1>
        <div className="flex items-center gap-3">
          {caseData.status === 'verified' && (
            <Link href={`/dashboard/cases/${id}/report`} className="text-sm text-blue-600 hover:underline">
              View report
            </Link>
          )}
          <span className={`px-3 py-1 rounded text-sm ${STATUS_STYLES[caseData.status] ?? ''}`}>
            {caseData.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Candidate</h2>
          <p className="text-sm">{candidate?.full_name}</p>
          <p className="text-sm text-gray-600">{candidate?.phone}</p>
          {candidate?.email && <p className="text-sm text-gray-600">{candidate.email}</p>}
        </div>

        <div className="border rounded p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Employer / HR contact</h2>
          <p className="text-sm">{employer?.name}</p>
          <p className="text-sm text-gray-600">{employer?.hr_contact_name}</p>
          <p className="text-sm text-gray-600">{employer?.hr_contact_phone}</p>
        </div>
      </div>

      <div className="border rounded p-4 text-sm text-gray-500 space-y-1">
        <p>Client: {client?.company_name}</p>
        <p>Check type: {caseData.check_type}</p>
        <p>Retry rounds used: {caseData.retry_count}</p>
        <p>Submitted: {new Date(caseData.created_at).toLocaleString()}</p>
        <p>Last updated: {new Date(caseData.updated_at).toLocaleString()}</p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-2">Call history</h2>

        {!callLogs?.length && (
          <p className="text-sm text-gray-500">No calls placed yet.</p>
        )}

        <div className="space-y-4">
          {callLogs?.map((log) => (
            <div key={log.id} className="border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{log.outcome ?? 'unknown outcome'}</span>
                <span className="text-xs text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>

              {log.extracted_data && (
                <div className="text-sm bg-gray-50 rounded p-3 mb-2 space-y-1">
                  {Object.entries(log.extracted_data as Record<string, unknown>).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-gray-500">{key}:</span> {String(value)}
                    </p>
                  ))}
                </div>
              )}

              {log.transcript && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-500">View transcript</summary>
                  <pre className="whitespace-pre-wrap text-xs mt-2 bg-gray-50 rounded p-3">
                    {log.transcript}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
