// Wrapper around Tabbly's campaign-based calling API.
// Field names below are confirmed against tabbly.gitbook.io/tabbly-docs
// (Create Campaign, Add Contacts, Get Call Logs pages).
//
// One thing worth testing empirically: the Add Contacts docs mark
// `sip_call_id` as "Required" even though no call has happened yet at the
// point you're adding a contact. This is likely a documentation error —
// try omitting it or passing an empty string first; if Tabbly rejects the
// request, generate a placeholder value instead.

const TABBLY_BASE = 'https://www.tabbly.io/dashboard/agents/endpoints'

export async function createCampaign(params: {
  caseId: string
  startTime?: string // "HH:MM", defaults below
  endTime?: string
  firstLine?: string
}) {
  const res = await fetch(`${TABBLY_BASE}/create-campaign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaign_name: `case-${params.caseId}`,
      agent_id: process.env.TABBLY_AGENT_ID,
      start_time: params.startTime ?? '09:00',
      end_time: params.endTime ?? '18:00',
      time_zone: 'IST',
      custom_first_line:
        params.firstLine ??
        'Hi, this is Priya calling from Callibr regarding an employment verification.',
      api_key: process.env.TABBLY_API_KEY,
      created_by: 1
    })
  })

  if (!res.ok) {
    throw new Error(`Tabbly createCampaign failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return data.campaign_id as string
}

export async function addContact(params: {
  campaignId: number
  phoneNumber: string // E.164 format, e.g. +919876543210
  contactName: string
  caseId: string // your internal verification_cases.id — passed via custom_identifiers so it round-trips back on the call log
  customFirstLine?: string
  customInstruction?: string
}) {
  const res = await fetch(`${TABBLY_BASE}/add-campaign-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TABBLY_API_KEY,
      phone_number: params.phoneNumber,
      campaign_id: params.campaignId,
      participant_identity: params.contactName,
      use_agent_id: Number(process.env.TABBLY_AGENT_ID),
      created_by: 'callibr-api',
      custom_first_line:
        params.customFirstLine ??
        'Hi, this is Priya calling from Callibr regarding an employment verification.',
      custom_instruction: params.customInstruction ?? '',
      // marked "Required" in docs despite no call existing yet — test with
      // empty string first; if Tabbly 400s on this, generate a placeholder
      // (e.g. `case-${params.caseId}-${Date.now()}`) instead.
      sip_call_id: '',
      custom_identifiers: JSON.stringify({ case_id: params.caseId })
    })
  })

  const data = await res.json()

  if (!res.ok || data.status === 'error') {
    throw new Error(`Tabbly addContact failed: ${res.status} ${JSON.stringify(data)}`)
  }

  return data as { status: string; id: number }
}

export async function getCallLogs(params: {
  campaignId?: number
  dateFrom?: string // YYYY-MM-DD
  dateTo?: string
  callStatus?: string
  limit?: number
  offset?: number
}) {
  const query = new URLSearchParams({
    api_key: process.env.TABBLY_API_KEY!,
    organization_id: process.env.TABBLY_ORG_ID!,
    ...(params.campaignId ? { campaign_id: String(params.campaignId) } : {}),
    ...(params.dateFrom ? { date_from: params.dateFrom } : {}),
    ...(params.dateTo ? { date_to: params.dateTo } : {}),
    ...(params.callStatus ? { call_status: params.callStatus } : {}),
    ...(params.limit ? { limit: String(params.limit) } : {}),
    ...(params.offset ? { offset: String(params.offset) } : {})
  })

  const res = await fetch(`${TABBLY_BASE}/call-logs-v2?${query.toString()}`, {
    method: 'GET'
  })

  const data = await res.json()

  if (!res.ok || data.status === 'error') {
    throw new Error(`Tabbly getCallLogs failed: ${res.status} ${JSON.stringify(data)}`)
  }

  return data as {
    status: string
    total_records: number
    filtered_records: number
    data: Array<{
      id: string
      called_to: string
      use_agent_id: string
      called_time: string
      campaign_id: string
      call_recording?: string
      call_duration?: string
      call_sentiment?: string
      call_transcript?: string
      call_summary?: string
      call_status: string // observed values include "completed" — exact full set not documented, log real values as you see them
      custom_identifiers?: string // JSON string you set in addContact — parse to get case_id back
    }>
  }
}
