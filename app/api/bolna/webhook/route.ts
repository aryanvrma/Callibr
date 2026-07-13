cat > ~/Callibr/app/api/bolna/webhook/route.ts << 'ENDOFFILE'
import { createClient } from '@/lib/supabase/server'
import { extractVerificationData } from '@/lib/openai/extract'
import { TERMINAL_STATUSES } from '@/lib/bolna/client'
import { sendReportReadyEmail, sendEscalationEmail } from '@/lib/email/send-report'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const event = await req.json()

  if (!TERMINAL_STATUSES.includes(event.status)) {
    return NextResponse.json({ received: true })
  }

  const caseId = event.context_details?.case_id
  if (!caseId) {
    console.error('Bolna webhook: no case_id found in context_details', event)
    return NextResponse.json({ error: 'Missing case_id' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.status !== 'completed' || !event.transcript) {
    const retryCount = event.retry_count ?? 0
    const maxRetries = event.retry_config?.max_retries ?? 0
    const retriesExhausted = !event.retry_config?.enabled || retryCount >= maxRetries

    await supabase.from('call_logs').insert({
      case_id: caseId,
      call_provider: 'bolna',
      call_sid: event.id,
      outcome: event.status,
      extracted_data: event.retry_history ? { retry_history: event.retry_history } : null
    })

    if (!retriesExhausted) {
      return NextResponse.json({
        received: true,
        note: `${event.status}, Bolna auto-retry pending (attempt ${retryCount}/${maxRetries})`
      })
    }

    const { data: currentCase } = await supabase
      .from('verification_cases')
      .select('retry_count, candidate_id, clients:client_id (contact_email), candidates:candidate_id (full_name)')
      .eq('id', caseId)
      .single()

    const newStatus = (currentCase?.retry_count ?? 0) < 1 ? 'needs_retry' : 'escalated'

    await supabase.from('verification_cases').update({ status: newStatus }).eq('id', caseId)

    if (newStatus === 'escalated') {
      const clientEmail = (currentCase as any)?.clients?.contact_email
      const candidateName = (currentCase as any)?.candidates?.full_name ?? 'Candidate'
      if (clientEmail) {
        const result = await sendEscalationEmail({
          to: clientEmail,
          candidateName,
          caseId,
          reason: `Employer could not be reached (${event.status}, retries exhausted)`
        })
        if (!result.success) {
          console.error('Failed to send escalation email for case', caseId, result.error)
        }
      } else {
        console.error('No client contact_email found for case', caseId, '- skipping escalation email')
      }
    }

    return NextResponse.json({
      received: true,
      note: `${event.status}, Bolna retries exhausted, marked ${newStatus}`
    })
  }

  const extracted = await extractVerificationData(event.transcript)

  await supabase.from('call_logs').insert({
    case_id: caseId,
    call_provider: 'bolna',
    call_sid: event.id,
    transcript: event.transcript,
    extracted_data: extracted,
    outcome: extracted.outcome
  })

  const { data: currentCase } = await supabase
    .from('verification_cases')
    .select('retry_count, candidate_id, clients:client_id (contact_email), candidates:candidate_id (full_name)')
    .eq('id', caseId)
    .single()

  const newStatus =
    extracted.outcome === 'verified' || extracted.outcome === 'partially_verified'
      ? 'verified'
      : (currentCase?.retry_count ?? 0) < 1
      ? 'needs_retry'
      : 'escalated'

  await supabase.from('verification_cases').update({ status: newStatus }).eq('id', caseId)

  if (newStatus === 'verified' || newStatus === 'escalated') {
    const clientEmail = (currentCase as any)?.clients?.contact_email
    const candidateName = (currentCase as any)?.candidates?.full_name ?? 'Candidate'

    if (clientEmail) {
      const result =
        newStatus === 'verified'
          ? await sendReportReadyEmail({ to: clientEmail, candidateName, caseId })
          : await sendEscalationEmail({
              to: clientEmail,
              candidateName,
              caseId,
              reason: `Verification outcome: ${extracted.outcome}`
            })

      if (!result.success) {
        console.error(`Failed to send ${newStatus} email for case`, caseId, result.error)
      }
    } else {
      console.error('No client contact_email found for case', caseId, '- skipping notification email')
    }
  }

  return NextResponse.json({ received: true, outcome: extracted.outcome, newStatus })
}
ENDOFFILE

