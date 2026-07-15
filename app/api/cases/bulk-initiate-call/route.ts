import { createClient } from '@/lib/supabase/server'
import { initiateCallForCase } from '@/lib/cases/initiate-call'
import { NextResponse } from 'next/server'

const CALLABLE_STATUSES = ['pending', 'needs_retry']

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: cases } = await supabase
    .from('verification_cases')
    .select('id')
    .in('status', CALLABLE_STATUSES)

  if (!cases?.length) {
    return NextResponse.json({ triggered: 0, failed: [], message: 'No callable cases found' })
  }

  const results = []
  // sequential with a small delay — avoids hammering Bolna's API with a
  // burst of simultaneous calls if you have a large batch pending
  for (const c of cases) {
    const result = await initiateCallForCase(supabase, c.id)
    results.push({ caseId: c.id, ...result })
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  const succeeded = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  return NextResponse.json({
    triggered: succeeded.length,
    failed: failed.map((f) => ({ caseId: f.caseId, error: (f as any).error }))
  })
}
