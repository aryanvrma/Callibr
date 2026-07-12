import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface ExtractedVerificationData {
  job_title: string | null
  start_date: string | null
  end_date: string | null
  still_employed: boolean
  reason_for_leaving_category: string | null
  would_rehire: 'yes' | 'no' | 'unable_to_disclose' | 'unknown'
  outcome:
    | 'verified'
    | 'partially_verified'
    | 'no_record_found'
    | 'wrong_number'
    | 'callback_requested'
    | 'refused'
    | 'voicemail_left'
  confidence: number
  notes: string
}

export async function extractVerificationData(
  transcript: string
): Promise<ExtractedVerificationData> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Extract employment verification details from this call transcript between a verification agent and an employer HR contact. Return strict JSON matching this shape:
{
  "job_title": string or null,
  "start_date": string or null (YYYY-MM or best available),
  "end_date": string or null,
  "still_employed": boolean,
  "reason_for_leaving_category": string or null,
  "would_rehire": "yes" | "no" | "unable_to_disclose" | "unknown",
  "outcome": "verified" | "partially_verified" | "no_record_found" | "wrong_number" | "callback_requested" | "refused" | "voicemail_left",
  "confidence": number between 0 and 1,
  "notes": string
}`
      },
      { role: 'user', content: transcript }
    ]
  })

  const content = res.choices[0].message.content
  if (!content) {
    throw new Error('OpenAI extraction returned empty content')
  }

  return JSON.parse(content) as ExtractedVerificationData
}
