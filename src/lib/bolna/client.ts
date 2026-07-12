// Wrapper around Bolna's Voice AI API.
// Field names below are CONFIRMED against the real API reference
// (POST /call and GET /executions/{execution_id} pages).

const BOLNA_BASE = 'https://api.bolna.ai'

// Terminal statuses — call is fully done, one way or another.
// IMPORTANT: 'call-disconnected' is NOT in this list — it fires the instant
// the line drops but transcript/cost/recording aren't finalized yet. Only
// 'completed' and the failure states below are safe to act on.
export const TERMINAL_STATUSES = [
  'completed',
  'no-answer',
  'busy',
  'failed',
  'canceled',
  'stopped',
  'error',
  'balance-low'
] as const

export async function makeCall(params: {
  phoneNumber: string // E.164, e.g. +919876543210
  caseId: string
  userData?: Record<string, string> // injected into agent prompt as {variable_name}
  fromPhoneNumber?: string // omit to use account default
  retry?: {
    enabled?: boolean // default true — pass { enabled: false } to opt out
    maxRetries?: number // 1-3, default 3
    retryOnStatuses?: Array<'no-answer' | 'busy' | 'failed' | 'error'> // default ["no-answer", "busy", "failed"]
    retryOnVoicemail?: boolean // default false — leave false to avoid repeated voicemail deposits
    retryIntervalsMinutes?: number[] // default [30, 60, 120]
  }
}) {
  const res = await fetch(`${BOLNA_BASE}/call`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agent_id: process.env.BOLNA_AGENT_ID,
      recipient_phone_number: params.phoneNumber,
      ...(params.fromPhoneNumber ? { from_phone_number: params.fromPhoneNumber } : {}),
      user_data: {
        case_id: params.caseId,
        ...params.userData
      },
      retry_config: {
        enabled: params.retry?.enabled ?? true,
        max_retries: params.retry?.maxRetries ?? 3,
        retry_on_statuses: params.retry?.retryOnStatuses ?? ['no-answer', 'busy', 'failed'],
        retry_on_voicemail: params.retry?.retryOnVoicemail ?? false,
        retry_intervals_minutes: params.retry?.retryIntervalsMinutes ?? [30, 60, 120]
      }
    })
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Bolna makeCall failed: ${res.status} ${JSON.stringify(data)}`)
  }

  return data as { message: string; status: 'queued'; execution_id: string }
}

export async function getExecution(executionId: string) {
  const res = await fetch(`${BOLNA_BASE}/executions/${executionId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${process.env.BOLNA_API_KEY}` }
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Bolna getExecution failed: ${res.status} ${JSON.stringify(data)}`)
  }

  return data as {
    id: string
    agent_id: string
    status:
      | 'scheduled' | 'queued' | 'rescheduled' | 'initiated' | 'ringing'
      | 'in-progress' | 'call-disconnected' | 'completed'
      | 'balance-low' | 'busy' | 'no-answer' | 'canceled' | 'failed' | 'stopped' | 'error'
    conversation_duration?: number
    total_cost?: number
    error_message?: string
    answered_by_voice_mail?: boolean
    transcript?: string
    extracted_data?: Record<string, unknown> | null // populated only if agent has extraction_prompt configured
    context_details?: { case_id?: string; [key: string]: unknown }
    telephony_data?: { recording_url?: string; hangup_reason?: string }
  }
}
