'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from './prisma'
import { sendEmail, nextStepNotifyEmail, academicAdminCCEmail } from './email'
import { STEPS } from './constants'

// ── Audit logging ─────────────────────────────────────────────────────────────

async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  performedBy: string,
  details?: string
) {
  await prisma.auditLog.create({ data: { action, entityType, entityId, performedBy, details } })
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
              status: i === 0 ? 'in_progress' : 'pending',
            })),
          },
        },
      },
    },
  })

  await logAudit('staff_created', 'Staff', staff.id, 'Admin', `Name: ${name}`)
  revalidatePath('/staff')
  redirect(`/staff/${staff.id}`)
}

export async function deleteStaff(id: string) {
  const member = await prisma.staff.findUnique({ where: { id }, select: { name: true } })
  await prisma.staff.update({ where: { id }, data: { deletedAt: new Date() } })
  await logAudit('staff_archived', 'Staff', id, 'Admin', `Name: ${member?.name}`)
  revalidatePath('/staff')
  redirect('/staff')
}

export async function restoreStaff(id: string) {
  const member = await prisma.staff.findUnique({ where: { id }, select: { name: true } })
  await prisma.staff.update({ where: { id }, data: { deletedAt: null } })
  await logAudit('staff_restored', 'Staff', id, 'Admin', `Name: ${member?.name}`)
  revalidatePath('/staff')
  redirect(`/staff/${id}`)
}

export async function generateTeacherToken(staffId: string) {
  const { randomUUID } = await import('crypto')
  const token = randomUUID()
  await prisma.staff.update({ where: { id: staffId }, data: { teacherToken: token } })
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

  await logAudit(
    'step_completed',
    'ProbationStep',
    stepId,
    data.completedBy,
    JSON.stringify({ stepNumber, outcome: data.outcome })
  )

  const probation = await prisma.probation.findUnique({
    where: { id: probationId },
    include: {
      steps: true,
      staff: {
        include: { hod: true, stageLeader: true, dean: true, director: true, deputy: true, academicAdmin: true },
      },
    },
  })
  if (!probation) return

  if (data.outcome === 'concern') {
    await prisma.probation.update({
      where: { id: probationId },
      data: { status: 'active' },
    })
  } else if (data.outcome === 'not_confirmed') {
    await prisma.probation.update({
      where: { id: probationId },
      data: { status: 'not_confirmed', currentStep: stepNumber },
    })
  } else if (data.outcome === 'confirmed') {
    await prisma.probation.update({
      where: { id: probationId },
      data: { status: 'completed', currentStep: stepNumber },
    })
  } else if (data.outcome === 'extended') {
    await prisma.probation.update({
      where: { id: probationId },
      data: { status: 'extended', currentStep: stepNumber },
    })
  } else {
    // commendation or additional_observation → advance to next step
    const nextStepNumber = stepNumber + 1
    if (nextStepNumber <= 6) {
      await prisma.probation.update({
        where: { id: probationId },
        data: { currentStep: nextStepNumber },
      })
      const nextStepRecord = probation.steps.find((s) => s.stepNumber === nextStepNumber)
      if (nextStepRecord) {
        await prisma.probationStep.update({
          where: { id: nextStepRecord.id },
          data: { status: 'in_progress' },
        })
      }

      const staff = probation.staff
      const currentStepDef = STEPS[stepNumber - 1]
      const nextStepDef = STEPS[nextStepNumber - 1]
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

      const nextLeaders: Array<{ name: string; email: string; portalToken: string }> = []
      if (nextStepNumber === 1 || nextStepNumber === 3) {
        if (staff.hod) nextLeaders.push(staff.hod)
        if (staff.stageLeader) nextLeaders.push(staff.stageLeader)
      } else if (nextStepNumber === 2 || nextStepNumber === 4) {
        if (staff.dean) nextLeaders.push(staff.dean)
      } else if (nextStepNumber === 5) {
        if (staff.director) nextLeaders.push(staff.director)
      } else if (nextStepNumber === 6) {
        if (staff.deputy) nextLeaders.push(staff.deputy)
      }

      for (const leader of nextLeaders) {
        const portalUrl = `${baseUrl}/portal/${leader.portalToken}`
        await sendEmail({
          to: leader.email,
          subject: `Action Required: Probation Step ${nextStepNumber} – ${staff.name}`,
          html: nextStepNotifyEmail(
            leader.name,
            staff.name,
            currentStepDef.title,
            nextStepNumber,
            nextStepDef.title,
            nextStepDef.timing,
            portalUrl
          ),
          type: 'next_step_notify',
          relatedId: probationId,
        })
      }

      // CC academic admin for meeting/observation steps
      const meetingSteps = [1, 3, 4, 5, 6]
      if (meetingSteps.includes(nextStepNumber) && staff.academicAdmin) {
        const admin = staff.academicAdmin
        const leaderForStep = nextLeaders[0]
        const leaderRole = (() => {
          if (nextStepNumber === 1 || nextStepNumber === 3) return staff.hod ? 'Head of Department' : 'Stage Leader'
          if (nextStepNumber === 4) return 'Dean of Studies'
          if (nextStepNumber === 5) return 'Director of Teaching & Learning'
          return 'Deputy Principal'
        })()
        await sendEmail({
          to: admin.email,
          subject: `Meeting Coordination – Step ${nextStepNumber}: ${staff.name}`,
          html: academicAdminCCEmail(
            admin.name,
            leaderForStep?.name ?? leaderRole,
            leaderRole,
            staff.name,
            nextStepNumber,
            nextStepDef.title,
            nextStepDef.timing
          ),
          type: 'academic_admin_cc',
          relatedId: probationId,
        })
      }
    }
  }

  revalidatePath(`/staff`)
}

// ── Early Concerns ────────────────────────────────────────────────────────────

export async function createEarlyConcern(formData: FormData) {
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

  await logAudit('concern_created', 'EarlyConcern', concern.id, triggeredBy, `Step: ${triggerStep}`)
  revalidatePath('/staff')
}

export async function resolveEarlyConcern(id: string, resolution: string) {
  await prisma.earlyConcern.update({
    where: { id },
    data: { status: 'resolved', resolution, resolvedAt: new Date() },
  })
  await logAudit('concern_resolved', 'EarlyConcern', id, 'Admin', resolution.slice(0, 100))
  revalidatePath('/staff')
}

// ── Acknowledgements ──────────────────────────────────────────────────────────

export async function acknowledgeStepAsTeacher(token: string, stepId: string) {
  const staff = await prisma.staff.findUnique({ where: { teacherToken: token } })
  if (!staff) return
  await prisma.probationStep.update({
    where: { id: stepId },
    data: { teacherAcknowledgedAt: new Date() },
  })
  await logAudit('step_teacher_acknowledged', 'ProbationStep', stepId, staff.name)
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
