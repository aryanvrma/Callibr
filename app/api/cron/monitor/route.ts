import { createClient } from '@/lib/supabase/server'
import { sendMonitoringAlert } from '@/lib/email/send-report'
import { NextResponse } from 'next/server'

// Runs on a schedule (see vercel.json) — checks for stuck cases and high
// recent failure rates, and emails an alert if thresholds are crossed.
// Thresholds are intentionally simple for now; tune once real volume exists.
const STUCK_THRESHOLD_HOURS = 2
const STUCK_COUNT_THRESHOLD = 5
const ERROR_RATE_THRESHOLD = 0.5 // 50% of recent calls failing

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const issues: string[] = []

  // 1. Cases stuck in dialing/needs_retry for too long
  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_HOURS * 60 * 60 * 1000).toISOString()
  const { data: stuckCases, error: stuckError } = await supabase
    .from('verification_cases')
    .select('id, status, updated_at')
    .in('status', ['dialing', 'needs_retry'])
    .lt('updated_at', cutoff)

  if (stuckError) {
    issues.push(`Failed to query stuck cases: ${stuckError.message}`)
  } else if ((stuckCases?.length ?? 0) >= STUCK_COUNT_THRESHOLD) {
    issues.push(
      `${stuckCases!.length} cases stuck in dialing/needs_retry for over ${STUCK_THRESHOLD_HOURS}h`
    )
  }

  // 2. Recent call failure rate (last 24h)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recentLogs, error: logsError } = await supabase
    .from('call_logs')
    .select('outcome')
    .gte('created_at', dayAgo)

  if (logsError) {
    issues.push(`Failed to query recent call logs: ${logsError.message}`)
  } else if (recentLogs && recentLogs.length > 0) {
    const failed = recentLogs.filter(
      (l) => l.outcome !== 'verified' && l.outcome !== 'partially_verified'
    ).length
    const errorRate = failed / recentLogs.length
    if (errorRate >= ERROR_RATE_THRESHOLD) {
      issues.push(
        `Call failure rate is ${(errorRate * 100).toFixed(0)}% over the last 24h (${failed}/${recentLogs.length})`
      )
    }
  }

  if (issues.length > 0) {
    const result = await sendMonitoringAlert({
      subject: `${issues.length} issue(s) detected`,
      issues
    })
    return NextResponse.json({ alerted: true, issues, emailResult: result })
  }

  return NextResponse.json({ alerted: false, message: 'All checks passed' })
}

