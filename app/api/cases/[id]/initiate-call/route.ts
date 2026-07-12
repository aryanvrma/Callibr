import { createClient } from '@/lib/supabase/server'
import { makeCall } from '@/lib/bolna/client'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params
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

  const { data: verificationCase, error: caseError } = await supabase
    .from('verification_cases')
    .select('id, candidate_id, employer_id, employers(hr_contact_phone, hr_contact_name), candidates(full_name)')
    .eq('id', caseId)
    .single()

  if (caseError || !verificationCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  const hrPhone = (verificationCase.employers as any)?.hr_contact_phone
  const candidateName = (verificationCase.candidates as any)?.full_name

  if (!hrPhone) {
    return NextResponse.json({ error: 'No HR phone number on file for this case' }, { status: 400 })
  }

  const result = await makeCall({
    phoneNumber: hrPhone,
    caseId,
    variables: {
      candidate_name: candidateName ?? 'the candidate'
    }
  })

  await supabase
    .from('verification_cases')
    .update({
      status: 'dialing',
      bolna_execution_id: result.execution_id,
      bolna_agent_id: process.env.BOLNA_AGENT_ID
    })
    .eq('id', caseId)

  return NextResponse.json({ success: true, executionId: result.execution_id })
}
