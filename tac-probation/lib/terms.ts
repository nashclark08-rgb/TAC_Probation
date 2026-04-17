import { prisma } from './prisma'

export interface StepTiming {
  termNumber: number
  weekStart: number
  weekEnd: number
}

export const STEP_TIMINGS: StepTiming[] = [
  { termNumber: 1, weekStart: 1, weekEnd: 2 },
  { termNumber: 1, weekStart: 3, weekEnd: 4 },
  { termNumber: 1, weekStart: 5, weekEnd: 10 },
  { termNumber: 2, weekStart: 1, weekEnd: 5 },
  { termNumber: 2, weekStart: 6, weekEnd: 8 },
  { termNumber: 2, weekStart: 9, weekEnd: 10 },
]

export async function getStepDateRange(
  staffStartDate: Date,
  stepNumber: number
): Promise<{ startDate: Date | null; endDate: Date | null; isOverdue: boolean; isUpcoming: boolean; onTrack: boolean }> {
  const year = staffStartDate.getFullYear()
  const timing = STEP_TIMINGS[stepNumber - 1]
  if (!timing) return { startDate: null, endDate: null, isOverdue: false, isUpcoming: false, onTrack: false }

  const term = await prisma.termCalendar.findUnique({ where: { year_term: { year, term: timing.termNumber } } })
  if (!term) return { startDate: null, endDate: null, isOverdue: false, isUpcoming: false, onTrack: false }

  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const termStart = new Date(term.startDate)
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
