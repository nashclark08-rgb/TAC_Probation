import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { upsertTerm } from '@/lib/admin-actions'

export const dynamic = 'force-dynamic'

export default async function TermsPage() {
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]
  const terms = await prisma.termCalendar.findMany({ orderBy: [{ year: 'asc' }, { term: 'asc' }] })

  function getTermDates(year: number, term: number) {
    return terms.find((t) => t.year === year && t.term === term)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-sm text-slate-500 mb-2">
        <Link href="/admin" className="hover:text-[#1e3a5f]">Admin</Link> / Term Calendar
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">School Term Calendar</h1>
        <p className="text-slate-500 text-sm mt-1">
          Set the start and end dates for each term. These dates are used to calculate step due dates and flag overdue steps.
        </p>
      </div>

      <div className="space-y-6">
        {years.map((year) => (
          <div key={year} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-[#1e3a5f] text-white px-6 py-3">
              <h2 className="font-semibold">{year} School Year</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4].map((term) => {
                const existing = getTermDates(year, term)
                return (
                  <form key={term} action={upsertTerm} className="px-6 py-4">
                    <input type="hidden" name="year" value={year} />
                    <input type="hidden" name="term" value={term} />
                    <div className="flex items-end gap-4 flex-wrap">
                      <div className="font-medium text-slate-700 w-16 shrink-0 pt-6">Term {term}</div>
                      <div className="flex-1 min-w-32">
                        <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                        <input
                          type="date"
                          name="startDate"
                          required
                          defaultValue={existing ? toDateInput(existing.startDate) : ''}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                        />
                      </div>
                      <div className="flex-1 min-w-32">
                        <label className="block text-xs text-slate-500 mb-1">End Date</label>
                        <input
                          type="date"
                          name="endDate"
                          required
                          defaultValue={existing ? toDateInput(existing.endDate) : ''}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg hover:bg-[#2d527d] transition-colors text-sm shrink-0"
                      >
                        {existing ? 'Update' : 'Save'}
                      </button>
                      {existing && (
                        <span className="text-xs text-emerald-600 font-medium pt-5">✓ Saved</span>
                      )}
                    </div>
                  </form>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
        <strong>How dates are used:</strong> Each probation step has a target window (e.g. Step 1 is Term 1, Weeks 1–2).
        The system uses these term dates to calculate the exact calendar dates for each step and show whether steps are
        on track, upcoming, or overdue.
      </div>
    </div>
  )
}

function toDateInput(date: Date): string {
  return new Date(date).toISOString().split('T')[0]
}
