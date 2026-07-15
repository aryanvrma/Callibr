import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendReportReadyEmail({
  to,
  candidateName,
  caseId
}: {
  to: string
  candidateName: string
  caseId: string
}) {
  const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cases/${caseId}/report`

  try {
    const result = await resend.emails.send({
      from: 'Callibr <onboarding@resend.dev>',
      to,
      subject: `Verification Complete: ${candidateName}`,
      html: `
        <h2>Verification Report Ready</h2>
        <p>The background verification for <strong>${candidateName}</strong> has been completed.</p>
        <p><a href="${reportUrl}">View the full report</a></p>
      `
    })

    if (result.error) {
      console.error('sendReportReadyEmail failed:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, id: result.data?.id }
  } catch (err) {
    console.error('sendReportReadyEmail threw:', err)
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function sendEscalationEmail({
  to,
  candidateName,
  caseId,
  reason
}: {
  to: string
  candidateName: string
  caseId: string
  reason: string
}) {
  const caseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cases/${caseId}`

  try {
    const result = await resend.emails.send({
      from: 'Callibr <onboarding@resend.dev>',
      to,
      subject: `Action Needed: Verification Escalated for ${candidateName}`,
      html: `
        <h2>Verification Needs Attention</h2>
        <p>The verification case for <strong>${candidateName}</strong> could not be completed automatically.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><a href="${caseUrl}">View case details</a></p>
      `
    })

    if (result.error) {
      console.error('sendEscalationEmail failed:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, id: result.data?.id }
  } catch (err) {
    console.error('sendEscalationEmail threw:', err)
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function sendMonitoringAlert({
  subject,
  issues
}: {
  subject: string
  issues: string[]
}) {
  const alertEmail = process.env.ALERT_EMAIL
  if (!alertEmail) {
    console.error('ALERT_EMAIL not set, skipping monitoring alert')
    return { success: false, error: 'ALERT_EMAIL not configured' }
  }

  try {
    const result = await resend.emails.send({
      from: 'Callibr Monitoring <onboarding@resend.dev>',
      to: alertEmail,
      subject: `[Callibr Alert] ${subject}`,
      html: `
        <h2>Callibr System Alert</h2>
        <ul>
          ${issues.map((i) => `<li>${i}</li>`).join('')}
        </ul>
        <p>Checked at: ${new Date().toISOString()}</p>
      `
    })

    if (result.error) {
      console.error('sendMonitoringAlert failed:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, id: result.data?.id }
  } catch (err) {
    console.error('sendMonitoringAlert threw:', err)
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
