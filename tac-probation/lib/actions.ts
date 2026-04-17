'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from './prisma'

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

  revalidatePath('/staff')
  redirect(`/staff/${staff.id}`)
}

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

  const probation = await prisma.probation.findUnique({
    where: { id: probationId },
    include: { steps: true },
  })
  if (!probation) return

  if (data.outcome === 'concern') {
    // Early concerns pathway - don't auto-advance
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
    const nextStep = stepNumber + 1
    if (nextStep <= 6) {
      await prisma.probation.update({
        where: { id: probationId },
        data: { currentStep: nextStep },
      })
      const nextStepRecord = probation.steps.find((s) => s.stepNumber === nextStep)
      if (nextStepRecord) {
        await prisma.probationStep.update({
          where: { id: nextStepRecord.id },
          data: { status: 'in_progress' },
        })
      }
    }
  }

  revalidatePath(`/staff`)
}

export async function createEarlyConcern(formData: FormData) {
  const probationId = formData.get('probationId') as string
  const triggeredBy = formData.get('triggeredBy') as string
  const triggerStep = parseInt(formData.get('triggerStep') as string)
  const triggers = formData.getAll('triggers') as string[]
  const actionsTaken = formData.get('actionsTaken') as string
  const supportMeasures = formData.getAll('supportMeasures') as string[]

  await prisma.earlyConcern.create({
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

  revalidatePath('/staff')
}

export async function resolveEarlyConcern(id: string, resolution: string) {
  await prisma.earlyConcern.update({
    where: { id },
    data: {
      status: 'resolved',
      resolution,
      resolvedAt: new Date(),
    },
  })
  revalidatePath('/staff')
}

export async function deleteStaff(id: string) {
  await prisma.staff.delete({ where: { id } })
  revalidatePath('/staff')
  redirect('/staff')
}
