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
  return `<div style="background:#1e3a5f;padding:20px 28px;border-radius:8px 8px 0 0"><h1 style="color:#ffffff;margin:0;font-size:18px;font-weight:700">Trinity Anglican College</h1><p style="color:#cbd5e1;margin:4px 0 0;font-size:13px">${subtitle}</p></div>`
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

export function academicAdminCCEmail(
  adminName: string,
  leaderName: string,
  leaderRole: string,
  staffName: string,
  stepNumber: number,
  stepTitle: string,
  stepTiming: string
): string {
  return wrap(
    hdr('Probation Tracker — Meeting Coordination'),
    `<p>Dear ${adminName},</p>
     <p>This is to advise you that <strong>${leaderName}</strong> (${leaderRole}) has been notified to arrange the following probation step for <strong>${staffName}</strong>:</p>
     <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin:12px 0;font-size:13px">
       <strong>Step ${stepNumber}:</strong> ${stepTitle}<br>
       <span style="color:#64748b">${stepTiming}</span>
     </div>
     <p>As Academic Administration (Sub School), please arrange the meeting/observation on behalf of ${leaderName} and confirm the time directly with ${staffName}.</p>
     <p>Thank you for your support in coordinating this process.</p>
     <p>Warm regards,<br><strong>Trinity Anglican College Probation Tracker</strong></p>`
  )
}

export function reportShareEmail(
  recipientName: string,
  staffName: string,
  reportUrl: string,
  finalOutcome: string
): string {
  const isConfirmed = finalOutcome === 'Employment Confirmed'

  const confirmationTemplate = isConfirmed
    ? `<div style="margin-top:20px;border:2px dashed #86efac;border-radius:8px;padding:16px;background:#f0fdf4">
        <p style="margin:0 0 10px;font-weight:700;color:#166534;font-size:13px">✉ Action Required — Please send the following confirmation email to ${staffName}</p>
        <p style="margin:0 0 6px;font-size:12px;color:#374151"><strong>Suggested subject:</strong> Congratulations – Successful Completion of Probation Period</p>
        <hr style="border:none;border-top:1px solid #bbf7d0;margin:10px 0">
        <p style="font-size:12px;color:#374151;margin:4px 0">Dear ${staffName},</p>
        <p style="font-size:12px;color:#374151;margin:8px 0">I am delighted to formally confirm that you have <strong>successfully completed your probation period</strong> at Trinity Anglican College.</p>
        <p style="font-size:12px;color:#374151;margin:8px 0">This is a wonderful achievement and reflects your dedication, professionalism, and commitment to our students and the Trinity Teaching and Learning philosophy. Your growth over this period has been noticed and valued by your colleagues and leaders throughout the College.</p>
        <p style="font-size:12px;color:#374151;margin:8px 0">You will now transition into the <strong>Trinity Ascend: Teacher Excellence Framework</strong>, where your continued professional development will be supported. Your mentor or line manager will be in contact shortly to discuss your entry point into this framework.</p>
        <p style="font-size:12px;color:#374151;margin:8px 0">On behalf of the entire College community, we sincerely congratulate you and look forward to your continued contribution to Trinity Anglican College.</p>
        <p style="font-size:12px;color:#374151;margin:8px 0">Warm regards,<br><em>[Your name and title]</em></p>
        <hr style="border:none;border-top:1px solid #bbf7d0;margin:10px 0">
        <p style="font-size:11px;color:#6b7280;font-style:italic">Personalise the above as needed and send directly to ${staffName} to formally communicate their successful probation outcome.</p>
      </div>`
    : ''

  return wrap(
    hdr('Probation Tracker — Final Report'),
    `<p>Dear ${recipientName},</p>
     <p>The final probation report for <strong>${staffName}</strong> has been completed and is available for your review.</p>
     <div style="background:${isConfirmed ? '#f0fdf4' : '#f8fafc'};border:1px solid ${isConfirmed ? '#bbf7d0' : '#e2e8f0'};border-radius:8px;padding:12px 16px;margin:12px 0;font-size:13px">
       <strong>Final Outcome:</strong> ${finalOutcome}
     </div>
     ${isConfirmed
       ? `<p>As this staff member has successfully completed their probation, <strong>please send a formal confirmation email to ${staffName}</strong>. A suggested template is provided below for your use.</p>`
       : `<p>The report includes a summary of all steps, meeting notes, observations, and the final recommendation. Please review and retain for your records.</p>`
     }
     ${btn('View Full Report', reportUrl)}
     ${confirmationTemplate}
     <p style="margin-top:16px;font-size:12px;color:#64748b">This is an authorised share from the Trinity Anglican College Probation Tracker.</p>`
  )
}

export function probationExtendedEmail(
  recipientName: string,
  staffName: string,
  fromStepNumber: number,
  extensionReason: string,
  concernUrl: string
): string {
  const stepLabel = `Step ${fromStepNumber}`
  return wrap(
    hdr('Probation Tracker — Probation Period Extended'),
    `<p>Dear ${recipientName},</p>
     <p>This is to advise you that the probation period for <strong>${staffName}</strong> has been <strong>extended</strong>, effective from ${stepLabel}.</p>
     <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:12px 0;font-size:13px">
       <strong>Reason for extension:</strong> ${extensionReason || 'Refer to the concern record for full context.'}
     </div>
     <p>The probation process will continue from ${stepLabel}. A revised support plan should be developed in consultation with the relevant leaders and communicated to ${staffName} promptly.</p>
     ${btn('View Concern Record', concernUrl)}
     <div style="margin-top:20px;border:2px dashed #fcd34d;border-radius:8px;padding:16px;background:#fffbeb">
       <p style="margin:0 0 10px;font-weight:700;color:#92400e;font-size:13px">✉ Suggested Template — Communicate Extension to ${staffName}</p>
       <p style="margin:0 0 6px;font-size:12px;color:#374151"><strong>Suggested subject:</strong> Extension of Your Probation Period – Trinity Anglican College</p>
       <hr style="border:none;border-top:1px solid #fde68a;margin:10px 0">
       <p style="font-size:12px;color:#374151;margin:4px 0">Dear ${staffName},</p>
       <p style="font-size:12px;color:#374151;margin:8px 0">Following your recent meeting and in consideration of the feedback and support provided to date, the College has determined that it is in your best interest to extend your probation period.</p>
       <p style="font-size:12px;color:#374151;margin:8px 0">Your probation will continue from <strong>${stepLabel}</strong>. During this extended period, you will continue to be supported by your assigned leaders, and a revised support plan will be discussed with you in the coming days.</p>
       <p style="font-size:12px;color:#374151;margin:8px 0">We want to assure you that this decision is made with your professional growth in mind. You will have the opportunity to demonstrate your development and receive the support you need to succeed at Trinity Anglican College.</p>
       <p style="font-size:12px;color:#374151;margin:8px 0">If you have any questions or concerns, please contact your [Dean of Studies / Director of Teaching &amp; Learning] directly.</p>
       <p style="font-size:12px;color:#374151;margin:8px 0">Warm regards,<br><em>[Your name and title]</em></p>
       <hr style="border:none;border-top:1px solid #fde68a;margin:10px 0">
       <p style="font-size:11px;color:#6b7280;font-style:italic">Personalise and send the above to ${staffName} to formally communicate the probation extension.</p>
     </div>`
  )
}

export function teacherPortalEmail(staffName: string, portalUrl: string): string {
  return wrap(
    hdr('Probation Tracker — Your Probation Portal'),
    `<p>Dear ${staffName},</p>
     <p>You can now access your personal probation portal to view your progress through the 6-step probation process and acknowledge feedback from each step.</p>
     ${btn('Access Your Probation Portal', portalUrl)}
     <p style="margin-top:16px;font-size:12px;color:#64748b">This portal link is personal to you — please do not share it with others.</p>`
  )
}

export function stepOverdueEmail(
  leaderName: string,
  staffName: string,
  stepNumber: number,
  stepTitle: string,
  portalUrl: string
): string {
  return wrap(
    hdr('Probation Tracker — Step Overdue'),
    `<p>Dear ${leaderName},</p>
     <p>The following probation step is <strong>overdue</strong> for <strong>${staffName}</strong> and has not yet been completed:</p>
     <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:12px 0;font-size:13px">
       <strong>Step ${stepNumber}:</strong> ${stepTitle}
     </div>
     <p>Please log in to your portal and complete this step at your earliest convenience.</p>
     ${btn('Go to Your Portal', portalUrl)}`
  )
}

export function stepUpcomingEmail(
  leaderName: string,
  staffName: string,
  stepNumber: number,
  stepTitle: string,
  stepTiming: string,
  portalUrl: string
): string {
  return wrap(
    hdr('Probation Tracker — Step Due Soon'),
    `<p>Dear ${leaderName},</p>
     <p>This is a reminder that the following probation step for <strong>${staffName}</strong> is due within the next 7 days:</p>
     <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin:12px 0;font-size:13px">
       <strong>Step ${stepNumber}:</strong> ${stepTitle}<br>
       <span style="color:#64748b">${stepTiming}</span>
     </div>
     ${btn('Go to Your Portal', portalUrl)}`
  )
}

export function weeklyDigestEmail(
  adminName: string,
  items: Array<{ staffName: string; stepNumber: number; stepTitle: string; status: 'overdue' | 'due_soon' | 'in_progress' }>
): string {
  const rows = items.map((item) => {
    const colour = item.status === 'overdue' ? '#fef2f2' : item.status === 'due_soon' ? '#fffbeb' : '#f0fdf4'
    const badge = item.status === 'overdue' ? '⚠ Overdue' : item.status === 'due_soon' ? '⏰ Due Soon' : '● In Progress'
    return `<tr style="background:${colour}">
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${item.staffName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">Step ${item.stepNumber}: ${item.stepTitle}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px">${badge}</td>
    </tr>`
  }).join('')

  return wrap(
    hdr('Probation Tracker — Weekly Summary'),
    `<p>Dear ${adminName},</p>
     <p>Here is your weekly summary of probation steps requiring attention:</p>
     ${items.length === 0
       ? '<p style="color:#64748b">No steps currently require attention. All probations are on track.</p>'
       : `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
            <thead><tr style="background:#1e3a5f;color:#fff">
              <th style="padding:8px 12px;text-align:left">Staff Member</th>
              <th style="padding:8px 12px;text-align:left">Step</th>
              <th style="padding:8px 12px;text-align:left">Status</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>`
     }
     <p style="font-size:12px;color:#64748b">Log in to the Probation Tracker to take action on any overdue or upcoming steps.</p>`
  )
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
