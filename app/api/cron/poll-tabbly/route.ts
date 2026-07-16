import { createClient } from '@/lib/supabase/server'
import { getCallLogs } from '@/lib/tabbly/client'
import { extractVerificationData } from '@/lib/openai/extract'
import { NextResponse } from 'next/server'

// Called on a schedule (see vercel.json cron config below) — checks every
// case currently in 'dialing' status against Tabbly's call logs, and
// processes any that have completed.
export async function GET(req: Request) {
  // basic protection so this route can't be triggered by randoms —
  // Vercel Cron sends this header automatically; verify it matches your secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: pendingCases } = await supabase
    .from('verification_cases')
    .select('id, tabbly_campaign_id, retry_count')
    .eq('status', 'dialing')
    .not('tabbly_campaign_id', 'is', null)

  const results = []

  for (const c of pendingCases ?? []) {
    try {
      const logs = await getCallLogs({ campaignId: Number(c.tabbly_campaign_id) })
      const completedCall = logs.data?.find(
        (call) => call.call_status === 'completed' && call.call_transcript
      )

      if (!completedCall) {
        continue // still waiting, check again next run — log logs.data[0]?.call_status
        // the first few times you run this for real, to learn what in-progress
        // statuses actually look like (docs mention "call answered" and
        // "voicemail" as example values, but the full set isn't documented)
      }

      const extracted = await extractVerificationData(completedCall.call_transcript!)

      await supabase.from('call_logs').insert({
        case_id: c.id,
        call_provider: 'tabbly',
        call_sid: completedCall.id,
        transcript: completedCall.call_transcript,
        extracted_data: extracted as any,
        outcome: extracted.outcome
      })

      const newStatus =
        extracted.outcome === 'verified' || extracted.outcome === 'partially_verified'
          ? 'verified'
          : c.retry_count < 3
          ? 'needs_retry'
          : 'escalated'

      await supabase
        .from('verification_cases')
        .update({ status: newStatus })
        .eq('id', c.id)

      results.push({ caseId: c.id, outcome: extracted.outcome, newStatus })
    } catch (err) {
      console.error(`Failed processing case ${c.id}:`, err)
      results.push({ caseId: c.id, error: String(err) })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
