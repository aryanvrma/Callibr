import { createClient } from '@/lib/supabase/server'
import { extractVerificationData } from '@/lib/openai/extract'
import { TERMINAL_STATUSES } from '@/lib/bolna/client'
import { NextResponse } from 'next/server'

// Bolna POSTs here as call status progresses through:
// queued → initiated → ringing → in-progress → call-disconnected → completed
// (or a failure terminal: no-answer, busy, failed, canceled, stopped, error, balance-low)
//
// IMPORTANT — auto-retry interaction: if retry_config was enabled on the call,
// a failure status (e.g. 'no-answer') does NOT mean Bolna is done trying —
// it fires that failure event, then separately fires a 'scheduled' event for
// the next attempt. We must check retry_count against the configured
// max_retries before treating a failure as final. Only escalate to your own
// system once Bolna has genuinely exhausted its own retries.
export async function POST(req: Request) {
  const event = await req.json()

  if (!TERMINAL_STATUSES.includes(event.status)) {
    // 'scheduled' (a retry is queued for later), plus queued/initiated/
    // ringing/in-progress/call-disconnected — nothing to do yet
    return NextResponse.json({ received: true })
  }

  const caseId = event.context_details?.case_id
  if (!caseId) {
    console.error('Bolna webhook: no case_id found in context_details', event)
    return NextResponse.json({ error: 'Missing case_id' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.status !== 'completed' || !event.transcript) {
    // A failure status arrived — check whether Bolna still has retries left
    // before treating this as final.
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
      // Bolna will automatically retry — a 'scheduled' event should follow.
      // Leave the case status as 'dialing', don't touch retry_count ourselves.
      return NextResponse.json({
        received: true,
        note: `${event.status}, Bolna auto-retry pending (attempt ${retryCount}/${maxRetries})`
      })
    }

    // Bolna has genuinely given up — this is now our own escalation path.
    // Capped at 1 round of our own retries (i.e. one more makeCall() call,
    // which itself includes up to 3 Bolna-managed attempts) — 9 total dial
    // attempts (3 x 3) was too aggressive for one HR contact.
    const { data: currentCase } = await supabase
      .from('verification_cases')
      .select('retry_count')
      .eq('id', caseId)
      .single()

    const newStatus = (currentCase?.retry_count ?? 0) < 1 ? 'needs_retry' : 'escalated'

    await supabase.from('verification_cases').update({ status: newStatus }).eq('id', caseId)
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
    .select('retry_count')
    .eq('id', caseId)
    .single()

  const newStatus =
    extracted.outcome === 'verified' || extracted.outcome === 'partially_verified'
      ? 'verified'
      : (currentCase?.retry_count ?? 0) < 1
      ? 'needs_retry'
      : 'escalated'

  await supabase.from('verification_cases').update({ status: newStatus }).eq('id', caseId)

  return NextResponse.json({ received: true, outcome: extracted.outcome, newStatus })
}
