'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from './prisma'
import { sendEmail, concernActivatedEmail, surveyInviteEmail } from './email'
import { CONCERN_TRIGGERS } from './constants'

// ── Supporting Staff ──────────────────────────────────────────────────────────

export async function createSupportingStaff(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const subSchool = formData.get('subSchool') as string
  const department = formData.get('department') as string

  await prisma.supportingStaff.create({
    data: { name, email, role, subSchool: subSchool || null, department: department || null },
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

  const staff = await prisma.staff.create({
    data: {
      name,
      email,
      subSchool,
      department: department || null,
      teachingRole: teachingRole || null,
      startDate: new Date(startDate),
      hodId: hodId || null,
      stageLeaderId: stageLeaderId || null,
      deanId: deanId || null,
      directorId: directorId || null,
      deputyId: deputyId || null,
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
