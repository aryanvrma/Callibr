import { SupabaseClient } from '@supabase/supabase-js'
import { makeCall } from '@/lib/bolna/client'
import { Database } from '@/lib/database.types'

export async function initiateCallForCase(
  supabase: SupabaseClient<Database>,
  caseId: string
): Promise<{ success: true; executionId: string } | { success: false; error: string }> {
  const { data: verificationCase, error: caseError } = await supabase
    .from('verification_cases')
    .select('id, employers(hr_contact_phone, hr_contact_name), candidates(full_name)')
    .eq('id', caseId)
    .single()

  if (caseError || !verificationCase) {
    return { success: false, error: 'Case not found' }
  }

  const hrPhone = (verificationCase.employers as any)?.hr_contact_phone
  const candidateName = (verificationCase.candidates as any)?.full_name

  if (!hrPhone) {
    return { success: false, error: 'No HR phone number on file for this case' }
  }

  try {
    const result = await makeCall({
      phoneNumber: hrPhone,
      caseId,
      userData: { candidate_name: candidateName ?? 'the candidate' }
    })

    await supabase
      .from('verification_cases')
      .update({
        status: 'dialing',
        bolna_execution_id: result.execution_id,
        bolna_agent_id: process.env.BOLNA_AGENT_ID
      })
      .eq('id', caseId)

    return { success: true, executionId: result.execution_id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
