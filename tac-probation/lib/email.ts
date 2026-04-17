import { prisma } from './prisma'

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  type: string
  relatedId?: string
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to]

  // --- Transport layer (configure once deployment target is known) ---
  // For now we log to the database and console.
  // To enable real sending, set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars
  // and uncomment the nodemailer block below.

  // import nodemailer from 'nodemailer'
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: Number(process.env.SMTP_PORT ?? 587),
  //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  // })
  // await transporter.sendMail({ from: process.env.SMTP_FROM, to: recipients.join(','), subject: payload.subject, html: payload.html })

  console.log(`[EMAIL] To: ${recipients.join(', ')} | Subject: ${payload.subject}`)

  await prisma.emailLog.create({
    data: {
      to: recipients.join(', '),
      subject: payload.subject,
      type: payload.type,
      relatedId: payload.relatedId,
      status: 'logged',
    },
  })
}

export function stepDueEmail(staffName: string, stepTitle: string, leaderName: string, stepUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="background:#1e3a5f;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="color:#c9a84c;margin:0;font-size:18px">Trinity Anglican College</h1>
        <p style="color:#fff;margin:4px 0 0;font-size:13px">Teaching Staff Probation &amp; PDI Framework</p>
      </div>
      <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
        <p>Dear ${leaderName},</p>
        <p>This is a reminder that the following probation step is now due:</p>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 4px"><strong>Teacher:</strong> ${staffName}</p>
          <p style="margin:0"><strong>Step:</strong> ${stepTitle}</p>
        </div>
        <a href="${stepUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">View Step</a>
        <p style="margin-top:24px;font-size:12px;color:#94a3b8">Trinity Anglican College · PDI Framework</p>
      </div>
    </div>
  `
}

export function concernActivatedEmail(staffName: string, triggerStep: number, concerns: string[], url: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="background:#dc2626;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:18px">Early Concerns Pathway Activated</h1>
        <p style="color:#fecaca;margin:4px 0 0;font-size:13px">Trinity Anglican College · PDI Framework</p>
      </div>
      <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
        <p>The Early Concerns Pathway has been activated for <strong>${staffName}</strong> at Step ${triggerStep}.</p>
        <p><strong>Concerns identified:</strong></p>
        <ul>${concerns.map((c) => `<li>${c}</li>`).join('')}</ul>
        <p>Immediate action is required from the Director of Teaching &amp; Learning, Dean of Studies, Deputy Principal, and HR.</p>
        <a href="${url}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">View Concern Record</a>
      </div>
    </div>
  `
}

export function surveyInviteEmail(staffName: string, surveyUrl: string, deanName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="background:#1e3a5f;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="color:#c9a84c;margin:0;font-size:18px">Trinity Anglican College</h1>
        <p style="color:#fff;margin:4px 0 0;font-size:13px">Teaching Staff Probation — Early Progress Review</p>
      </div>
      <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
        <p>You have been asked by <strong>${deanName}</strong> to provide confidential feedback on the initial professional practice of <strong>${staffName}</strong>.</p>
        <p>Your feedback will contribute to the Early Progress Review (Step 2) of the Teaching Staff Probation &amp; PDI Framework.</p>
        <a href="${surveyUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Provide Feedback</a>
        <p style="margin-top:16px;font-size:12px;color:#94a3b8">Your responses are confidential and will only be viewed by the Dean of Studies.</p>
      </div>
    </div>
  `
}
