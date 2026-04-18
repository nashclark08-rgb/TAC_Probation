import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, weeklyDigestEmail } from '@/lib/email'
import { STEPS } from '@/lib/constants'

// Called weekly (Monday 8am AEST) by Vercel Cron
// Sends each Academic Admin a digest of in-progress steps needing attention
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const terms = await prisma.termCalendar.findMany({ orderBy: [{ year: 'asc' }, { term: 'asc' }] })
  const now = new Date()
  const sevenDays = 7 * 24 * 60 * 60 * 1000

  const academicAdmins = await prisma.supportingStaff.findMany({
    where: { role: 'academic_admin' },
    include: {
      academicAdminFor: {
        where: { deletedAt: null },
        include: {
          probation: {
            where: { status: 'active' },
            include: { steps: { where: { status: 'in_progress' } } },
          },
        },
      },
    },
  })

  let digestsSent = 0

  for (const admin of academicAdmins) {
    const items: Array<{
      staffName: string
      stepNumber: number
      stepTitle: string
      status: 'overdue' | 'due_soon' | 'in_progress'
    }> = []

    for (const staff of admin.academicAdminFor) {
      if (!staff.probation) continue
      for (const step of staff.probation.steps) {
        const stepDef = STEPS.find((s) => s.number === step.stepNumber)
        if (!stepDef) continue

        const endDate = getStepEndDate(step.stepNumber, staff.startDate, terms)
        let status: 'overdue' | 'due_soon' | 'in_progress' = 'in_progress'

        if (endDate) {
          const msUntilDue = endDate.getTime() - now.getTime()
          if (msUntilDue < 0) status = 'overdue'
          else if (msUntilDue < sevenDays) status = 'due_soon'
        }

        items.push({ staffName: staff.name, stepNumber: step.stepNumber, stepTitle: stepDef.title, status })
      }
    }

    // Sort: overdue first, then due_soon, then in_progress
    items.sort((a, b) => {
      const order = { overdue: 0, due_soon: 1, in_progress: 2 }
      return order[a.status] - order[b.status]
    })

    await sendEmail({
      to: admin.email,
      subject: `Weekly Probation Summary – ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}`,
      html: weeklyDigestEmail(admin.name, items),
      type: 'weekly_digest',
    })
    digestsSent++
  }

  return NextResponse.json({ ok: true, digestsSent })
}

function getStepEndDate(
  stepNumber: number,
  staffStartDate: Date,
  terms: Array<{ year: number; term: number; startDate: Date; endDate: Date }>
): Date | null {
  const startYear = new Date(staffStartDate).getFullYear()
  const stepWindows: Record<number, { term: number; endWeek: number }> = {
    1: { term: 1, endWeek: 2 },
    2: { term: 1, endWeek: 4 },
    3: { term: 1, endWeek: 10 },
    4: { term: 2, endWeek: 5 },
    5: { term: 2, endWeek: 8 },
    6: { term: 2, endWeek: 10 },
  }
  const window = stepWindows[stepNumber]
  if (!window) return null
  const termRecord = terms.find((t) => t.year === startYear && t.term === window.term)
  if (!termRecord) return null
  const endDate = new Date(termRecord.startDate)
  endDate.setDate(endDate.getDate() + window.endWeek * 7)
  return endDate
}
