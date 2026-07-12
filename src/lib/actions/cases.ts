'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function createCase(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not logged in' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profile not found' }
  }

  // clients must be linked to a client_id to submit cases; admins can
  // submit on behalf of any client via a client_id field on the form
  // (not built yet — for now, admins also need client_id set on their profile)
  const clientId = profile.client_id
  if (!clientId) {
    return { error: 'Your account is not linked to a client organization. Contact support.' }
  }

  const candidateName = formData.get('candidateName') as string
  const candidatePhone = formData.get('candidatePhone') as string
  const candidateEmail = formData.get('candidateEmail') as string
  const employerName = formData.get('employerName') as string
  const hrContactName = formData.get('hrContactName') as string
  const hrContactPhone = formData.get('hrContactPhone') as string
  const hrContactEmail = formData.get('hrContactEmail') as string
  const checkType = formData.get('checkType') as string
  const consentGiven = formData.get('consentGiven') === 'on'

  if (!candidateName || !candidatePhone) {
    return { error: 'Candidate name and phone are required' }
  }
  if (!employerName || !hrContactPhone) {
    return { error: 'Employer name and HR contact phone are required' }
  }
  if (!consentGiven) {
    return { error: 'Candidate consent confirmation is required before submitting' }
  }

  // Use the admin client for the actual writes — RLS on these tables only
  // covers reads right now. Authorization already happened above (verified
  // user, verified profile, verified clientId belongs to this exact user).
  const admin = createAdminClient()

  const { data: candidate, error: candidateError } = await admin
    .from('candidates')
    .insert({ full_name: candidateName, phone: candidatePhone, email: candidateEmail || null })
    .select('id')
    .single()

  if (candidateError || !candidate) {
    return { error: `Failed to create candidate record: ${candidateError?.message}` }
  }

  const { data: employer, error: employerError } = await admin
    .from('employers')
    .insert({
      name: employerName,
      hr_contact_name: hrContactName || null,
      hr_contact_phone: hrContactPhone,
      hr_contact_email: hrContactEmail || null
    })
    .select('id')
    .single()

  if (employerError || !employer) {
    return { error: `Failed to create employer record: ${employerError?.message}` }
  }

  const { data: newCase, error: caseError } = await admin
    .from('verification_cases')
    .insert({
      client_id: clientId,
      candidate_id: candidate.id,
      employer_id: employer.id,
      status: 'pending',
      check_type: checkType || 'employment'
    })
    .select('id')
    .single()

  if (caseError || !newCase) {
    return { error: `Failed to create case: ${caseError?.message}` }
  }

  redirect('/dashboard')
}

export interface BulkUploadResult {
  totalRows: number
  succeeded: number
  failed: Array<{ row: number; reason: string }>
}

// Expected CSV header (in any column order):
// candidate_name,candidate_phone,candidate_email,employer_name,hr_contact_name,hr_contact_phone,hr_contact_email,check_type
export async function createCasesFromCsv(
  prevState: BulkUploadResult | { error: string } | null,
  formData: FormData
): Promise<BulkUploadResult | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('id', user.id)
    .single()

  if (!profile?.client_id) {
    return { error: 'Your account is not linked to a client organization. Contact support.' }
  }

  const consentGiven = formData.get('consentGivenBulk') === 'on'
  if (!consentGiven) {
    return { error: 'Consent confirmation is required for bulk upload' }
  }

  const file = formData.get('csvFile') as File | null
  if (!file || file.size === 0) {
    return { error: 'No CSV file selected' }
  }

  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)

  if (lines.length < 2) {
    return { error: 'CSV file has no data rows' }
  }

  // simple comma parser — does not handle commas inside quoted fields.
  // fine for names/phones/emails, but if a company name contains a comma,
  // this will misparse it. Switch to papaparse if that becomes an issue.
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const requiredCols = ['candidate_name', 'candidate_phone', 'employer_name', 'hr_contact_phone']
  const missingCols = requiredCols.filter((c) => !headers.includes(c))
  if (missingCols.length > 0) {
    return { error: `CSV is missing required columns: ${missingCols.join(', ')}` }
  }

  const admin = createAdminClient()
  const clientId = profile.client_id

  const result: BulkUploadResult = { totalRows: lines.length - 1, succeeded: 0, failed: [] }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] ?? '' })

    if (!row.candidate_name || !row.candidate_phone) {
      result.failed.push({ row: i + 1, reason: 'Missing candidate_name or candidate_phone' })
      continue
    }
    if (!row.employer_name || !row.hr_contact_phone) {
      result.failed.push({ row: i + 1, reason: 'Missing employer_name or hr_contact_phone' })
      continue
    }

    const { data: candidate, error: candErr } = await admin
      .from('candidates')
      .insert({
        full_name: row.candidate_name,
        phone: row.candidate_phone,
        email: row.candidate_email || null
      })
      .select('id')
      .single()

    if (candErr || !candidate) {
      result.failed.push({ row: i + 1, reason: `Candidate insert failed: ${candErr?.message}` })
      continue
    }

    const { data: employer, error: empErr } = await admin
      .from('employers')
      .insert({
        name: row.employer_name,
        hr_contact_name: row.hr_contact_name || null,
        hr_contact_phone: row.hr_contact_phone,
        hr_contact_email: row.hr_contact_email || null
      })
      .select('id')
      .single()

    if (empErr || !employer) {
      result.failed.push({ row: i + 1, reason: `Employer insert failed: ${empErr?.message}` })
      continue
    }

    const { error: caseErr } = await admin.from('verification_cases').insert({
      client_id: clientId,
      candidate_id: candidate.id,
      employer_id: employer.id,
      status: 'pending',
      check_type: row.check_type || 'employment'
    })

    if (caseErr) {
      result.failed.push({ row: i + 1, reason: `Case insert failed: ${caseErr.message}` })
      continue
    }

    result.succeeded++
  }

  return result
}
