import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, stepOverdueEmail, stepUpcomingEmail } from '@/lib/email'
import { STEPS } from '@/lib/constants'

// Called daily by Vercel Cron (configured in vercel.json)
// Checks in-progress steps against term calendar dates and sends reminders
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const activeProbations = await prisma.probation.findMany({
    where: { status: 'active' },
    include: {
      staff: {
        include: { hod: true, stageLeader: true, dean: true, director: true, deputy: true },
      },
      steps: { where: { status: 'in_progress' } },
    },
  })

  const terms = await prisma.termCalendar.findMany({ orderBy: [{ year: 'asc' }, { term: 'asc' }] })

  let emailsSent = 0
  const now = new Date()
  const sevenDays = 7 * 24 * 60 * 60 * 1000

  for (const prob of activeProbations) {
    for (const step of prob.steps) {
      const stepDef = STEPS.find((s) => s.number === step.stepNumber)
      if (!stepDef) continue

      // Determine the end date for this step from term calendar
      const stepEndDate = getStepEndDate(step.stepNumber, prob.staff.startDate, terms)
      if (!stepEndDate) continue

      const msUntilDue = stepEndDate.getTime() - now.getTime()

      const leaders = getLeadersForStep(step.stepNumber, prob.staff)
      for (const leader of leaders) {
        const portalUrl = `${baseUrl}/portal/${leader.portalToken}`

        if (msUntilDue < 0) {
          // Overdue
          await sendEmail({
            to: leader.email,
            subject: `Overdue: Probation Step ${step.stepNumber} – ${prob.staff.name}`,
            html: stepOverdueEmail(leader.name, prob.staff.name, step.stepNumber, stepDef.title, portalUrl),
            type: 'step_overdue',
            relatedId: prob.id,
          })
          emailsSent++
        } else if (msUntilDue < sevenDays) {
          // Due within 7 days
          await sendEmail({
            to: leader.email,
            subject: `Reminder: Probation Step ${step.stepNumber} due soon – ${prob.staff.name}`,
            html: stepUpcomingEmail(leader.name, prob.staff.name, step.stepNumber, stepDef.title, stepDef.timing, portalUrl),
            type: 'step_upcoming',
            relatedId: prob.id,
          })
          emailsSent++
        }
      }
    }
  }

  return NextResponse.json({ ok: true, emailsSent })
}

type SupporterWithToken = { name: string; email: string; portalToken: string } | null

function getLeadersForStep(
  stepNumber: number,
  staff: {
    hod: SupporterWithToken
    stageLeader: SupporterWithToken
    dean: SupporterWithToken
    director: SupporterWithToken
    deputy: SupporterWithToken
  }
): Array<{ name: string; email: string; portalToken: string }> {
  const leaders: Array<{ name: string; email: string; portalToken: string }> = []
  if (stepNumber === 1 || stepNumber === 3) {
    if (staff.hod) leaders.push(staff.hod)
    if (staff.stageLeader) leaders.push(staff.stageLeader)
  } else if (stepNumber === 2 || stepNumber === 4) {
    if (staff.dean) leaders.push(staff.dean)
  } else if (stepNumber === 5) {
    if (staff.director) leaders.push(staff.director)
  } else if (stepNumber === 6) {
    if (staff.deputy) leaders.push(staff.deputy)
  }
  return leaders
}

// Map step number to term/week window and calculate end date from term calendar
function getStepEndDate(
  stepNumber: number,
  staffStartDate: Date,
  terms: Array<{ year: number; term: number; startDate: Date; endDate: Date }>
): Date | null {
  const startYear = new Date(staffStartDate).getFullYear()

  // Step → { term, endWeek } (approximate end of the timing window)
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

  // Calculate end date: term start + (endWeek * 7) days
  const endDate = new Date(termRecord.startDate)
  endDate.setDate(endDate.getDate() + window.endWeek * 7)
  return endDate
}
