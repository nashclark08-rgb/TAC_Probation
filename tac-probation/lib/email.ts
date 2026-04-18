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

  // Transport: set SMTP_HOST/PORT/USER/PASS env vars to enable real sending
  // import nodemailer from 'nodemailer'
  // const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } })
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

// ── HTML helpers ───────────────────────────────────────────────────────────────

function hdr(subtitle: string) {
  return `<div style="background:#1e3a5f;padding:20px 28px;border-radius:8px 8px 0 0"><h1 style="color:#9e1b32;margin:0;font-size:18px;font-weight:700">Trinity Anglican College</h1><p style="color:#cbd5e1;margin:4px 0 0;font-size:13px">${subtitle}</p></div>`
}

const ftr = `<p style="margin-top:28px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px">Trinity Anglican College · Probation Tracker<br>This is an automated message — please do not reply directly to this email.</p>`

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px">${text}</a>`
}

function wrap(headerHtml: string, body: string) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">${headerHtml}<div style="background:#f8fafc;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">${body}${ftr}</div></div>`
}

// ── Email templates ────────────────────────────────────────────────────────────

export function welcomeStaffEmail(staffName: string, startDate: string): string {
  const steps = [
    ['1', 'Welcome &amp; Expectations', 'Term 1, Wks 1–2'],
    ['2', 'Early Progress Review', 'Term 1, Wks 3–4'],
    ['3', 'Observation – Professional Knowledge', 'Term 1, Wks 5–10'],
    ['4', 'Observation – Professional Practice', 'Term 2, Wks 1–5'],
    ['5', 'Progress Review – Formal Meeting', 'Term 2, Wks 6–8'],
    ['6', 'Final Recommendation &amp; Decision', 'Term 2, Wks 9–10'],
  ]
  const rows = steps.map(([n, title, timing], i) =>
    `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}"><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${n}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${title}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b">${timing}</td></tr>`
  ).join('')

  return wrap(
    hdr('Probation Tracker — Welcome'),
    `<p>Dear ${staffName},</p>
     <p>Welcome to Trinity Anglican College! We are delighted to have you join our teaching community.</p>
     <p>As part of your appointment, you will participate in our <strong>6-Step Probation Process</strong> over your first two terms with us. This structured program is designed to support your professional growth and integration into life at Trinity.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
       <thead><tr style="background:#1e3a5f;color:#fff"><th style="padding:8px 12px;text-align:left">Step</th><th style="padding:8px 12px;text-align:left">Title</th><th style="padding:8px 12px;text-align:left">Timing</th></tr></thead>
       <tbody>${rows}</tbody>
     </table>
     <p>Your probation commencement date is <strong>${startDate}</strong>. Your assigned supporting staff will be in touch shortly.</p>
     <p>If you have any questions, please speak with your Head of Department, Stage Leader, or the Dean of Studies.</p>
     <p>We look forward to supporting you on this journey.</p>
     <p>Warm regards,<br><strong>Trinity Anglican College</strong></p>`
  )
}

export function welcomeSupporterAssignmentEmail(
  supporterName: string,
  role: string,
  staffName: string,
  staffStartDate: string,
  portalUrl: string
): string {
  return wrap(
    hdr('Probation Tracker — Staff Assignment'),
    `<p>Dear ${supporterName},</p>
     <p>You have been assigned as <strong>${role}</strong> for the probation process of <strong>${staffName}</strong>, who commenced on ${staffStartDate}.</p>
     <p>Your role is to support ${staffName} through the relevant steps of the Trinity Probation Process. You can view their progress and review step details via your secure personal portal at any time.</p>
     ${btn('Access Your Portal', portalUrl)}
     <p style="margin-top:16px;font-size:12px;color:#64748b">This portal link is personal to you — please do not share it with others.</p>`
  )
}

export function welcomeNewSupporterEmail(supporterName: string, role: string, portalUrl: string): string {
  return wrap(
    hdr('Probation Tracker — Welcome'),
    `<p>Dear ${supporterName},</p>
     <p>You have been added to the Trinity Anglican College Probation Tracker as a <strong>${role}</strong>.</p>
     <p>When new probationary staff are assigned to you, you will receive a notification email. You can access your secure personal portal below to view assigned staff and their progress at any time.</p>
     ${btn('Access Your Portal', portalUrl)}
     <p style="margin-top:16px;font-size:12px;color:#64748b">This portal link is personal to you — please do not share it with others.</p>`
  )
}

export function nextStepNotifyEmail(
  leaderName: string,
  staffName: string,
  completedStepTitle: string,
  nextStepNumber: number,
  nextStepTitle: string,
  nextStepTiming: string,
  portalUrl: string
): string {
  return wrap(
    hdr('Probation Tracker — Action Required'),
    `<p>Dear ${leaderName},</p>
     <p>The following probation step for <strong>${staffName}</strong> has been completed:</p>
     <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin:12px 0;font-size:13px">
       <strong>Completed:</strong> ${completedStepTitle}
     </div>
     <p>The process is now moving to the next step, which requires your attention:</p>
     <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin:12px 0;font-size:13px">
       <strong>Step ${nextStepNumber}:</strong> ${nextStepTitle}<br>
       <span style="color:#64748b">${nextStepTiming}</span>
     </div>
     <p>Please log in to your portal to review ${staffName}'s progress and complete this step when ready.</p>
     ${btn('Go to Your Portal', portalUrl)}
     <p style="margin-top:16px;font-size:12px;color:#64748b">This portal link is personal to you — please do not share it with others.</p>`
  )
}

export function stepDueEmail(staffName: string, stepTitle: string, leaderName: string, stepUrl: string): string {
  return wrap(
    hdr('Probation Tracker — Step Due'),
    `<p>Dear ${leaderName},</p>
     <p>This is a reminder that the following probation step is now due:</p>
     <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;font-size:13px">
       <p style="margin:0 0 4px"><strong>Teacher:</strong> ${staffName}</p>
       <p style="margin:0"><strong>Step:</strong> ${stepTitle}</p>
     </div>
     ${btn('View Step', stepUrl)}`
  )
}

export function concernActivatedEmail(staffName: string, triggerStep: number, concerns: string[], url: string): string {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px"><div style="background:#9e1b32;padding:20px 28px;border-radius:8px 8px 0 0"><h1 style="color:#fff;margin:0;font-size:18px;font-weight:700">Early Concerns Pathway Activated</h1><p style="color:#fca5a5;margin:4px 0 0;font-size:13px">Trinity Anglican College · Probation Tracker</p></div><div style="background:#f8fafc;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px"><p>The Early Concerns Pathway has been activated for <strong>${staffName}</strong> at Step ${triggerStep}.</p><p><strong>Concerns identified:</strong></p><ul>${concerns.map((c) => `<li>${c}</li>`).join('')}</ul><p>Immediate action is required from the Director of Teaching &amp; Learning, Dean of Studies, Deputy Principal, and HR.</p><a href="${url}" style="display:inline-block;background:#9e1b32;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">View Concern Record</a>${ftr}</div></div>`
}

export function surveyInviteEmail(staffName: string, surveyUrl: string, deanName: string): string {
  return wrap(
    hdr('Probation Tracker — Early Progress Review'),
    `<p>You have been asked by <strong>${deanName}</strong> to provide confidential feedback on the initial professional practice of <strong>${staffName}</strong>.</p>
     <p>Your feedback will contribute to the Early Progress Review (Step 2) of the Trinity Anglican College Probation Process.</p>
     ${btn('Provide Feedback', surveyUrl)}
     <p style="margin-top:16px;font-size:12px;color:#64748b">Your responses are confidential and will only be viewed by the Dean of Studies.</p>`
  )
}
