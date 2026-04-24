import { prisma } from './prisma'

export interface StepTiming {
  termOffset: number // 0 = first term of probation, 1 = second term
  weekStart: number
  weekEnd: number
}

export const STEP_TIMINGS: StepTiming[] = [
  { termOffset: 0, weekStart: 1, weekEnd: 2 },
  { termOffset: 0, weekStart: 3, weekEnd: 4 },
  { termOffset: 0, weekStart: 5, weekEnd: 10 },
  { termOffset: 1, weekStart: 1, weekEnd: 5 },
  { termOffset: 1, weekStart: 6, weekEnd: 8 },
  { termOffset: 1, weekStart: 9, weekEnd: 10 },
]

async function getStartTerm(staffStartDate: Date): Promise<{ year: number; term: number } | null> {
  const startYear = staffStartDate.getFullYear()
  const terms = await prisma.termCalendar.findMany({
    where: { year: { in: [startYear - 1, startYear, startYear + 1] } },
    orderBy: [{ year: 'asc' }, { term: 'asc' }],
  })

  // Find the term containing the start date
  for (const t of terms) {
    if (staffStartDate >= t.startDate && staffStartDate <= t.endDate) {
      return { year: t.year, term: t.term }
    }
  }

  // If start date falls in holidays, use the next term after the start date
  for (const t of terms) {
    if (staffStartDate < t.startDate) {
      return { year: t.year, term: t.term }
    }
  }

  return null
}

async function getTermByOffset(startYear: number, startTerm: number, offset: number) {
  let term = startTerm + offset
  let year = startYear
  while (term > 4) {
    term -= 4
    year += 1
  }
  return { year, term }
}

export async function getStepDateRange(
  staffStartDate: Date,
  stepNumber: number
): Promise<{ startDate: Date | null; endDate: Date | null; isOverdue: boolean; isUpcoming: boolean; onTrack: boolean }> {
  const timing = STEP_TIMINGS[stepNumber - 1]
  if (!timing) return { startDate: null, endDate: null, isOverdue: false, isUpcoming: false, onTrack: false }

  const startTerm = await getStartTerm(staffStartDate)
  if (!startTerm) return { startDate: null, endDate: null, isOverdue: false, isUpcoming: false, onTrack: false }

  const { year, term } = await getTermByOffset(startTerm.year, startTerm.term, timing.termOffset)

  const termRecord = await prisma.termCalendar.findUnique({ where: { year_term: { year, term } } })
  if (!termRecord) return { startDate: null, endDate: null, isOverdue: false, isUpcoming: false, onTrack: false }

  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const termStart = new Date(termRecord.startDate)
  const stepStart = new Date(termStart.getTime() + (timing.weekStart - 1) * msPerWeek)
  const stepEnd = new Date(termStart.getTime() + timing.weekEnd * msPerWeek - 1)

  const now = new Date()
  const isOverdue = now > stepEnd
  const isUpcoming = now < stepStart
  const onTrack = !isOverdue && !isUpcoming

  return { startDate: stepStart, endDate: stepEnd, isOverdue, isUpcoming, onTrack }
}

export function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start || !end) return 'Term dates not configured'
  const fmt = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}

// Distribute remaining steps evenly across the extension period.
// Returns one window per step number in remainingStepNumbers.
export function computeExtendedStepWindows(
  extendedAt: Date,
  extensionEndDate: Date,
  remainingStepNumbers: number[]
): Array<{ stepNumber: number; startDate: Date; endDate: Date }> {
  if (remainingStepNumbers.length === 0) return []
  const totalMs = extensionEndDate.getTime() - extendedAt.getTime()
  if (totalMs <= 0) return []
  const windowMs = totalMs / remainingStepNumbers.length
  return remainingStepNumbers.map((stepNumber, idx) => ({
    stepNumber,
    startDate: new Date(extendedAt.getTime() + idx * windowMs),
    endDate: new Date(extendedAt.getTime() + (idx + 1) * windowMs - 1),
  }))
}
