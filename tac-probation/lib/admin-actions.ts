'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from './prisma'
import {
  sendEmail,
  concernActivatedEmail,
  surveyInviteEmail,
  welcomeStaffEmail,
  welcomeSupporterAssignmentEmail,
  welcomeNewSupporterEmail,
  reportShareEmail,
} from './email'
import { CONCERN_TRIGGERS } from './constants'

const ROLE_LABELS: Record<string, string> = {
  hod: 'Head of Department',
  stage_leader: 'Stage Leader',
  dean_of_studies: 'Dean of Studies',
  director_tl: 'Director of Teaching & Learning',
  deputy_principal: 'Deputy Principal',
  hr: 'HR',
  curriculum_leader: 'Curriculum Leader',
  middle_leader: 'Middle Leader',
  academic_admin: 'Academic Administration (Sub School)',
  principal: 'College Principal',
}

// ── Supporting Staff ──────────────────────────────────────────────────────────

export async function createSupportingStaff(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const subSchool = formData.get('subSchool') as string
  const department = formData.get('department') as string

  const supporter = await prisma.supportingStaff.create({
    data: { name, email, role, subSchool: subSchool || null, department: department || null },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const portalUrl = `${baseUrl}/portal/${supporter.portalToken}`
  const roleLabel = ROLE_LABELS[role] ?? role

  await sendEmail({
    to: email,
    subject: 'Trinity Anglican College – Probation Tracker Access',
    html: welcomeNewSupporterEmail(name, roleLabel, portalUrl),
    type: 'welcome_new_supporter',
    relatedId: supporter.id,
  })

  revalidatePath('/admin/supporters')
  redirect('/admin/supporters')
}

export async function updateSupportingStaff(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const subSchool = formData.get('subSchool') as string
  const department = formData.get('department') as string

  await prisma.supportingStaff.update({
    where: { id },
    data: { name, email, role, subSchool: subSchool || null, department: department || null },
  })
  revalidatePath('/admin/supporters')
  redirect('/admin/supporters')
}

export async function deleteSupportingStaff(id: string) {
  await prisma.supportingStaff.delete({ where: { id } })
  revalidatePath('/admin/supporters')
}

// ── Term Calendar ─────────────────────────────────────────────────────────────

export async function upsertTerm(formData: FormData) {
  const year = parseInt(formData.get('year') as string)
  const term = parseInt(formData.get('term') as string)
  const startDate = new Date(formData.get('startDate') as string)
  const endDate = new Date(formData.get('endDate') as string)

  await prisma.termCalendar.upsert({
    where: { year_term: { year, term } },
    update: { startDate, endDate },
    create: { year, term, startDate, endDate },
  })
  revalidatePath('/admin/terms')
}

// ── Staff (admin create with full assignments) ────────────────────────────────

export async function adminCreateStaff(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const subSchool = formData.get('subSchool') as string
  const department = formData.get('department') as string
  const teachingRole = formData.get('teachingRole') as string
  const startDate = formData.get('startDate') as string
  const hodId = formData.get('hodId') as string
  const stageLeaderId = formData.get('stageLeaderId') as string
  const deanId = formData.get('deanId') as string
  const directorId = formData.get('directorId') as string
  const deputyId = formData.get('deputyId') as string
  const academicAdminId = formData.get('academicAdminId') as string
  const principalId = formData.get('principalId') as string

  const { randomUUID } = await import('crypto')
  const teacherToken = randomUUID()

  const staff = await prisma.staff.create({
    data: {
      name,
      email,
      subSchool,
      department: department || null,
      teachingRole: teachingRole || null,
      startDate: new Date(startDate),
      teacherToken,
      hodId: hodId || null,
      stageLeaderId: stageLeaderId || null,
      deanId: deanId || null,
      directorId: directorId || null,
      deputyId: deputyId || null,
      academicAdminId: academicAdminId || null,
      principalId: principalId || null,
      probation: {
        create: {
          status: 'active',
          currentStep: 1,
          steps: {
            create: Array.from({ length: 6 }, (_, i) => ({
              stepNumber: i + 1,
              status: i === 0 ? 'in_progress' : 'pending',
            })),
          },
        },
      },
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const startDateFormatted = new Date(startDate).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Welcome email to the new teacher
  await sendEmail({
    to: email,
    subject: 'Welcome to Trinity Anglican College – Probation Process',
    html: welcomeStaffEmail(name, startDateFormatted),
    type: 'welcome_staff',
    relatedId: staff.id,
  })

  // Assignment emails to each unique assigned supporter
  const supporterIds = [hodId, stageLeaderId, deanId, directorId, deputyId, academicAdminId, principalId].filter(Boolean) as string[]
  const uniqueIds = [...new Set(supporterIds)]

  if (uniqueIds.length > 0) {
    const supporters = await prisma.supportingStaff.findMany({
      where: { id: { in: uniqueIds } },
    })

    for (const supporter of supporters) {
      const portalUrl = `${baseUrl}/portal/${supporter.portalToken}`
      const roleLabel = ROLE_LABELS[supporter.role] ?? supporter.role

      await sendEmail({
        to: supporter.email,
        subject: `Probation Assignment: ${name} – Trinity Anglican College`,
        html: welcomeSupporterAssignmentEmail(
          supporter.name,
          roleLabel,
          name,
          startDateFormatted,
          portalUrl
        ),
        type: 'welcome_supporter_assignment',
        relatedId: staff.id,
      })
    }
  }

  await prisma.auditLog.create({
    data: {
      action: 'staff_created',
      entityType: 'Staff',
      entityId: staff.id,
      performedBy: 'Admin',
      details: `Name: ${name}, School: ${subSchool}`,
    },
  })

  revalidatePath('/staff')
  redirect(`/staff/${staff.id}`)
}

// ── Survey (Step 2) ───────────────────────────────────────────────────────────

export async function createAndSendSurvey(formData: FormData) {
  const stepId = formData.get('stepId') as string
  const sentById = formData.get('sentById') as string
  const recipientEmails = formData.get('recipientEmails') as string
  const staffName = formData.get('staffName') as string

  const emails = recipientEmails.split(',').map((e) => e.trim()).filter(Boolean)

  const sentBy = sentById ? await prisma.supportingStaff.findUnique({ where: { id: sentById } }) : null

  const survey = await prisma.survey.upsert({
    where: { stepId },
    update: { recipientEmails: emails.join(','), sentById: sentById || null, sentAt: new Date() },
    create: { stepId, sentById: sentById || null, recipientEmails: emails.join(','), sentAt: new Date() },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  for (const email of emails) {
    const surveyUrl = `${baseUrl}/survey/${survey.id}?email=${encodeURIComponent(email)}`
    await sendEmail({
      to: email,
      subject: `Feedback Request: ${staffName} – Early Progress Review`,
      html: surveyInviteEmail(staffName, surveyUrl, sentBy?.name ?? 'The Dean of Studies'),
      type: 'survey_invite',
      relatedId: survey.id,
    })
  }

  revalidatePath('/staff')
}

// ── Report sharing ────────────────────────────────────────────────────────────

export async function shareReportWithContacts(staffId: string) {
  const [member, hrContacts] = await Promise.all([
    prisma.staff.findUnique({
      where: { id: staffId },
      include: { probation: { include: { steps: true } }, principal: true },
    }),
    prisma.supportingStaff.findMany({ where: { role: 'hr' } }),
  ])
  if (!member) return

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const reportUrl = `${baseUrl}/staff/${staffId}/report`
  const step6 = member.probation?.steps.find((s: { stepNumber: number; outcome: string | null }) => s.stepNumber === 6)
  const finalOutcome = step6?.outcome ?? 'Pending'

  const outcomeLabels: Record<string, string> = {
    confirmed: 'Employment Confirmed',
    extended: 'Probation Extended',
    not_confirmed: 'Not Confirmed',
  }
  const outcomeLabel = outcomeLabels[finalOutcome] ?? finalOutcome

  const recipients: { name: string; email: string }[] = [
    ...hrContacts.map((h) => ({ name: h.name, email: h.email })),
    ...(member.principal ? [{ name: member.principal.name, email: member.principal.email }] : []),
  ]

  for (const recipient of recipients) {
    await sendEmail({
      to: recipient.email,
      subject: `Final Probation Report: ${member.name} – Trinity Anglican College`,
      html: reportShareEmail(recipient.name, member.name, reportUrl, outcomeLabel),
      type: 'report_share',
      relatedId: staffId,
    })
  }

  revalidatePath(`/staff/${staffId}`)
}

// ── Out-of-cycle concern initiation ──────────────────────────────────────────

export async function initiateOutOfCycleConcern(formData: FormData) {
  const probationId = formData.get('probationId') as string
  const triggeredBy = formData.get('triggeredBy') as string
  const triggerStep = parseInt(formData.get('triggerStep') as string)
  const triggers = formData.getAll('triggers') as string[]
  const actionsTaken = formData.get('actionsTaken') as string
  const supportMeasures = formData.getAll('supportMeasures') as string[]

  const concern = await prisma.earlyConcern.create({
    data: {
      probationId,
      triggeredBy,
      triggerStep,
      triggers: JSON.stringify(triggers),
      actionsTaken,
      supportMeasures: JSON.stringify(supportMeasures),
      status: 'active',
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'concern_created_out_of_cycle',
      entityType: 'EarlyConcern',
      entityId: concern.id,
      performedBy: triggeredBy,
      details: `Out-of-cycle initiation at Step ${triggerStep}`,
    },
  })

  // Send stakeholder notifications
  const full = await prisma.earlyConcern.findUnique({
    where: { id: concern.id },
    include: { probation: { include: { staff: { include: { director: true, deputy: true, dean: true } } } } },
  })

  if (full) {
    const staff = full.probation.staff
    const triggerLabels = (JSON.parse(full.triggers) as string[]).map(
      (id) => CONCERN_TRIGGERS.find((t) => t.id === id)?.label ?? id
    )
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const url = `${baseUrl}/concerns/${concern.id}`
    const recipients = [staff.director?.email, staff.deputy?.email, staff.dean?.email].filter(Boolean) as string[]
    for (const email of recipients) {
      await sendEmail({
        to: email,
        subject: `URGENT: Early Concerns Pathway – ${staff.name}`,
        html: concernActivatedEmail(staff.name, full.triggerStep, triggerLabels, url),
        type: 'concern_activated',
        relatedId: concern.id,
      })
    }
  }

  revalidatePath('/concerns')
  redirect(`/concerns/${concern.id}`)
}

// ── Concern notifications ─────────────────────────────────────────────────────

export async function notifyConcernStakeholders(concernId: string) {
  const concern = await prisma.earlyConcern.findUnique({
    where: { id: concernId },
    include: { probation: { include: { staff: { include: { director: true, deputy: true, dean: true } } } } },
  })
  if (!concern) return

  const staff = concern.probation.staff
  const triggers = (JSON.parse(concern.triggers) as string[]).map(
    (id) => CONCERN_TRIGGERS.find((t) => t.id === id)?.label ?? id
  )
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const url = `${baseUrl}/concerns/${concernId}`

  const recipients = [staff.director?.email, staff.deputy?.email, staff.dean?.email].filter(Boolean) as string[]

  for (const email of recipients) {
    await sendEmail({
      to: email,
      subject: `URGENT: Early Concerns Pathway – ${staff.name}`,
      html: concernActivatedEmail(staff.name, concern.triggerStep, triggers, url),
      type: 'concern_activated',
      relatedId: concernId,
    })
  }

  revalidatePath('/concerns')
}
