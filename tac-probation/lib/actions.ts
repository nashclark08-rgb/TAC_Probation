'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from './prisma'
import { sendEmail, nextStepNotifyEmail, academicAdminCCEmail, probationExtendedEmail } from './email'
import { STEPS } from './constants'

// ── Audit logging ─────────────────────────────────────────────────────────────

async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  performedBy: string,
  details?: string,
  staffId?: string
) {
  await prisma.auditLog.create({ data: { action, entityType, entityId, performedBy, details, staffId: staffId ?? null } })
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export async function createStaff(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const subSchool = formData.get('subSchool') as string
  const department = formData.get('department') as string | null
  const startDate = formData.get('startDate') as string

  if (!name || !email || !subSchool || !startDate) {
    throw new Error('Required fields missing')
  }

  const staff = await prisma.staff.create({
    data: {
      name,
      email,
      subSchool,
      department: department || null,
      startDate: new Date(startDate),
      probation: {
        create: {
          status: 'active',
          currentStep: 1,
          steps: {
            create: Array.from({ length: 6 }, (_, i) => ({
              stepNumber: i + 1,
              sortOrder: i + 1,
              status: i === 0 ? 'in_progress' : 'pending',
            })),
          },
        },
      },
    },
  })

  await logAudit('staff_created', 'Staff', staff.id, 'Admin', `Name: ${name}`, staff.id)
  revalidatePath('/staff')
  redirect(`/staff/${staff.id}`)
}

export async function deleteStaff(id: string) {
  const member = await prisma.staff.findUnique({ where: { id }, select: { name: true } })
  await prisma.staff.update({ where: { id }, data: { deletedAt: new Date() } })
  await logAudit('staff_archived', 'Staff', id, 'Admin', `Name: ${member?.name}`, id)
  revalidatePath('/staff')
  redirect('/staff')
}

export async function restoreStaff(id: string) {
  const member = await prisma.staff.findUnique({ where: { id }, select: { name: true } })
  await prisma.staff.update({ where: { id }, data: { deletedAt: null } })
  await logAudit('staff_restored', 'Staff', id, 'Admin', `Name: ${member?.name}`, id)
  revalidatePath('/staff')
  redirect(`/staff/${id}`)
}

export async function generateTeacherToken(staffId: string) {
  const { randomUUID } = await import('crypto')
  const token = randomUUID()
  await prisma.staff.update({ where: { id: staffId }, data: { teacherToken: token } })
  await logAudit('teacher_token_generated', 'Staff', staffId, 'Admin', undefined, staffId)
  revalidatePath(`/staff/${staffId}`)
}

// ── Step completion ───────────────────────────────────────────────────────────

export async function completeStep(
  stepId: string,
  probationId: string,
  stepNumber: number,
  data: {
    outcome: string
    completedBy: string
    notes: string
    supportActions: string
    formData?: string
  }
) {
  const currentStepRecord = await prisma.probationStep.findUnique({ where: { id: stepId } })

  await prisma.probationStep.update({
    where: { id: stepId },
    data: {
      status: 'completed',
      outcome: data.outcome,
      completedBy: data.completedBy,
      notes: data.notes,
      supportActions: data.supportActions,
      formData: data.formData || null,
      completedAt: new Date(),
    },
  })

  const probation = await prisma.probation.findUnique({
    where: { id: probationId },
    include: {
      steps: { orderBy: { sortOrder: 'asc' } },
      staff: {
        include: { hod: true, stageLeader: true, dean: true, director: true, deputy: true, academicAdmin: true },
      },
    },
  })
  if (!probation) return

  const staffId = probation.staff.id

  await logAudit(
    'step_completed',
    'ProbationStep',
    stepId,
    data.completedBy,
    JSON.stringify({ stepNumber, outcome: data.outcome, isCustom: currentStepRecord?.isCustom }),
    staffId
  )

  if (data.outcome === 'concern') {
    await prisma.probation.update({ where: { id: probationId }, data: { status: 'active' } })
  } else if (data.outcome === 'not_confirmed') {
    await prisma.probation.update({ where: { id: probationId }, data: { status: 'not_confirmed', currentStep: stepNumber } })
  } else if (data.outcome === 'confirmed') {
    await prisma.probation.update({ where: { id: probationId }, data: { status: 'completed', currentStep: stepNumber } })
  } else if (data.outcome === 'extended') {
    await prisma.probation.update({ where: { id: probationId }, data: { status: 'extended', currentStep: stepNumber } })
  } else {
    // commendation or additional_observation → advance to next step by sortOrder
    const currentSortOrder = currentStepRecord?.sortOrder ?? stepNumber
    const nextStepRecord = probation.steps.find((s) => s.sortOrder > currentSortOrder && s.status === 'pending')

    if (nextStepRecord) {
      await prisma.probationStep.update({ where: { id: nextStepRecord.id }, data: { status: 'in_progress' } })
      await prisma.probation.update({ where: { id: probationId }, data: { currentStep: nextStepRecord.stepNumber } })

      const staff = probation.staff
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
      const nextStepNum = nextStepRecord.stepNumber

      // Only send standard step notifications for non-custom steps
      if (!nextStepRecord.isCustom) {
        const currentStepDef = STEPS[stepNumber - 1]
        const nextStepDef = STEPS[nextStepNum - 1]
        const nextLeaders: Array<{ name: string; email: string; portalToken: string }> = []

        if (nextStepNum === 1 || nextStepNum === 3) {
          if (staff.hod) nextLeaders.push(staff.hod)
          if (staff.stageLeader) nextLeaders.push(staff.stageLeader)
        } else if (nextStepNum === 2 || nextStepNum === 4) {
          if (staff.dean) nextLeaders.push(staff.dean)
        } else if (nextStepNum === 5) {
          if (staff.director) nextLeaders.push(staff.director)
        } else if (nextStepNum === 6) {
          if (staff.deputy) nextLeaders.push(staff.deputy)
        }

        for (const leader of nextLeaders) {
          await sendEmail({
            to: leader.email,
            subject: `Action Required: Probation Step ${nextStepNum} – ${staff.name}`,
            html: nextStepNotifyEmail(
              leader.name, staff.name,
              currentStepDef?.title ?? `Step ${stepNumber}`,
              nextStepNum, nextStepDef.title, nextStepDef.timing,
              `${baseUrl}/portal/${leader.portalToken}`
            ),
            type: 'next_step_notify',
            relatedId: probationId,
          })
        }

        const meetingSteps = [1, 3, 4, 5, 6]
        if (meetingSteps.includes(nextStepNum) && staff.academicAdmin) {
          const admin = staff.academicAdmin
          const leaderRole = (() => {
            if (nextStepNum === 1 || nextStepNum === 3) return staff.hod ? 'Head of Department' : 'Stage Leader'
            if (nextStepNum === 4) return 'Dean of Studies'
            if (nextStepNum === 5) return 'Director of Teaching & Learning'
            return 'Deputy Principal'
          })()
          await sendEmail({
            to: admin.email,
            subject: `Meeting Coordination – Step ${nextStepNum}: ${staff.name}`,
            html: academicAdminCCEmail(
              admin.name, nextLeaders[0]?.name ?? leaderRole, leaderRole,
              staff.name, nextStepNum, nextStepDef.title, nextStepDef.timing
            ),
            type: 'academic_admin_cc',
            relatedId: probationId,
          })
        }
      }
    }
  }

  revalidatePath(`/staff`)
}

// ── Extend Probation ──────────────────────────────────────────────────────────

export async function extendProbation(probationId: string, formData: FormData) {
  const reason = formData.get('reason') as string
  const extendedBy = formData.get('extendedBy') as string
  const fromStep = parseInt(formData.get('fromStep') as string)
  const extensionEndDateRaw = formData.get('extensionEndDate') as string | null

  const probation = await prisma.probation.findUnique({
    where: { id: probationId },
    include: { staff: { include: { director: true, deputy: true, dean: true } } },
  })
  if (!probation) return

  await prisma.probation.update({
    where: { id: probationId },
    data: {
      status: 'extended',
      extensionReason: reason,
      extendedAt: new Date(),
      extendedBy,
      extensionFromStep: fromStep,
      extensionEndDate: extensionEndDateRaw ? new Date(extensionEndDateRaw) : null,
    },
  })

  const staffId = probation.staff.id
  await logAudit(
    'probation_extended',
    'Probation',
    probationId,
    extendedBy,
    `Extended from Step ${fromStep}: ${reason}`,
    staffId
  )

  // Notify Director and Deputy with candidate template
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const concernUrl = `${baseUrl}/staff/${staffId}`
  const recipients = [probation.staff.director, probation.staff.deputy, probation.staff.dean]
    .filter(Boolean) as Array<{ name: string; email: string }>

  for (const r of recipients) {
    await sendEmail({
      to: r.email,
      subject: `Probation Extended: ${probation.staff.name} – Trinity Anglican College`,
      html: probationExtendedEmail(r.name, probation.staff.name, fromStep, reason, concernUrl),
      type: 'probation_extended',
      relatedId: probationId,
    })
  }

  revalidatePath(`/staff/${staffId}`)
  revalidatePath('/staff')
}

// ── Add Custom Step ───────────────────────────────────────────────────────────

export async function addCustomStep(probationId: string, formData: FormData) {
  const afterStepNumber = parseInt(formData.get('afterStepNumber') as string)
  const customLabel = (formData.get('customLabel') as string).trim().toLowerCase()
  const customTitle = (formData.get('customTitle') as string).trim()
  const addedBy = formData.get('addedBy') as string

  // Find the base step and all custom steps already after it
  const allSteps = await prisma.probationStep.findMany({
    where: { probationId },
    orderBy: { sortOrder: 'asc' },
  })

  const baseStep = allSteps.find((s) => s.stepNumber === afterStepNumber && !s.isCustom)
  if (!baseStep) throw new Error(`Step ${afterStepNumber} not found on this probation record.`)

  // Count existing custom steps for this base step number to compute sortOrder
  const existingCustomCount = allSteps.filter(
    (s) => s.isCustom && s.stepNumber === afterStepNumber
  ).length

  const newSortOrder = baseStep.sortOrder + (existingCustomCount + 1) * 0.1

  // Check for sortOrder collision (shouldn't happen but guard anyway)
  const collision = allSteps.find((s) => Math.abs(s.sortOrder - newSortOrder) < 0.001)
  if (collision) throw new Error('A step already exists at that position. Please refresh and try again.')

  const newStep = await prisma.probationStep.create({
    data: {
      probationId,
      stepNumber: afterStepNumber,
      customLabel,
      isCustom: true,
      sortOrder: newSortOrder,
      customTitle,
      status: 'pending',
    },
  })

  const probation = await prisma.probation.findUnique({
    where: { id: probationId },
    include: { staff: true },
  })
  const staffId = probation?.staff.id

  await logAudit(
    'custom_step_added',
    'ProbationStep',
    newStep.id,
    addedBy,
    `Step ${afterStepNumber}${customLabel}: ${customTitle}`,
    staffId
  )

  if (staffId) {
    revalidatePath(`/staff/${staffId}`)
  }
  revalidatePath('/staff')
}

// ── Reset Step ────────────────────────────────────────────────────────────────

export async function resetStep(stepId: string, formData: FormData) {
  const reason = formData.get('reason') as string
  const resetBy = formData.get('resetBy') as string

  const step = await prisma.probationStep.findUnique({
    where: { id: stepId },
    include: { probation: { include: { staff: true } } },
  })
  if (!step) return

  await prisma.probationStep.update({
    where: { id: stepId },
    data: {
      status: 'in_progress',
      outcome: null,
      completedAt: null,
      completedBy: null,
    },
  })

  // Set probation back to active and update currentStep
  await prisma.probation.update({
    where: { id: step.probationId },
    data: { status: 'active', currentStep: step.stepNumber },
  })

  const staffId = step.probation.staff.id
  await logAudit(
    'step_reset',
    'ProbationStep',
    stepId,
    resetBy,
    `Step ${step.stepNumber}${step.customLabel ?? ''} reset. Reason: ${reason}`,
    staffId
  )

  revalidatePath(`/staff/${staffId}`)
  revalidatePath('/staff')
}

// ── Activate Custom Step ──────────────────────────────────────────────────────

export async function activateCustomStep(stepId: string) {
  const step = await prisma.probationStep.findUnique({
    where: { id: stepId },
    include: { probation: { include: { staff: true } } },
  })
  if (!step || step.status !== 'pending') return

  await prisma.probationStep.update({ where: { id: stepId }, data: { status: 'in_progress' } })
  await prisma.probation.update({
    where: { id: step.probationId },
    data: { currentStep: step.stepNumber },
  })

  const staffId = step.probation.staff.id
  await logAudit('custom_step_activated', 'ProbationStep', stepId, 'Admin', undefined, staffId)
  revalidatePath(`/staff/${staffId}`)
}

// ── Early Concerns ────────────────────────────────────────────────────────────

export async function createEarlyConcern(formData: FormData) {
  const probationId = formData.get('probationId') as string
  const triggeredBy = formData.get('triggeredBy') as string
  const triggerStep = parseInt(formData.get('triggerStep') as string)
  const triggers = formData.getAll('triggers') as string[]
  const actionsTaken = formData.get('actionsTaken') as string
  const supportMeasures = formData.getAll('supportMeasures') as string[]

  const probation = await prisma.probation.findUnique({ where: { id: probationId }, select: { staffId: true } })

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

  await logAudit('concern_created', 'EarlyConcern', concern.id, triggeredBy, `Step: ${triggerStep}`, probation?.staffId)
  revalidatePath('/staff')
}

export async function resolveEarlyConcern(id: string, resolution: string) {
  const concern = await prisma.earlyConcern.findUnique({
    where: { id },
    include: { probation: { select: { staffId: true } } },
  })
  await prisma.earlyConcern.update({
    where: { id },
    data: { status: 'resolved', resolution, resolvedAt: new Date() },
  })
  await logAudit('concern_resolved', 'EarlyConcern', id, 'Admin', resolution.slice(0, 100), concern?.probation.staffId)
  revalidatePath('/staff')
}

// ── Acknowledgements ──────────────────────────────────────────────────────────

export async function acknowledgeStepAsTeacher(token: string, stepId: string) {
  const staff = await prisma.staff.findUnique({ where: { teacherToken: token } })
  if (!staff) return
  await prisma.probationStep.update({ where: { id: stepId }, data: { teacherAcknowledgedAt: new Date() } })
  await logAudit('step_teacher_acknowledged', 'ProbationStep', stepId, staff.name, undefined, staff.id)
  revalidatePath(`/teacher/${token}`)
}

export async function acknowledgeStepAsSupporter(stepId: string, supporterToken: string) {
  const supporter = await prisma.supportingStaff.findUnique({ where: { portalToken: supporterToken } })
  if (!supporter) return
  await prisma.probationStep.update({
    where: { id: stepId },
    data: { acknowledgedAt: new Date(), acknowledgedBy: supporter.name },
  })
  await logAudit('step_supporter_acknowledged', 'ProbationStep', stepId, supporter.name)
  revalidatePath(`/portal/${supporterToken}`)
}

export async function saveTeacherReflection(token: string, stepId: string, reflection: string) {
  const staff = await prisma.staff.findUnique({ where: { teacherToken: token } })
  if (!staff) return
  await prisma.probationStep.update({ where: { id: stepId }, data: { teacherReflection: reflection } })
  await logAudit('teacher_reflection_saved', 'ProbationStep', stepId, staff.name, undefined, staff.id)
  revalidatePath(`/teacher/${token}`)
}
