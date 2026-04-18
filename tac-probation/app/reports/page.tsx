import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { STEPS, OUTCOME_LABELS } from '@/lib/constants'
import BackLink from '@/components/BackLink'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const [allStaff, allConcerns, auditLogs] = await Promise.all([
    prisma.staff.findMany({
      where: { deletedAt: null },
      include: {
        probation: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
            concerns: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.earlyConcern.findMany({ orderBy: { triggeredAt: 'desc' } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
  ])

  const totalStaff = allStaff.length
  const byStatus = {
    active: allStaff.filter((s) => s.probation?.status === 'active').length,
    completed: allStaff.filter((s) => s.probation?.status === 'completed').length,
    extended: allStaff.filter((s) => s.probation?.status === 'extended').length,
    not_confirmed: allStaff.filter((s) => s.probation?.status === 'not_confirmed').length,
  }
  const bySchool = {
    junior: allStaff.filter((s) => s.subSchool === 'junior').length,
    senior: allStaff.filter((s) => s.subSchool === 'senior').length,
  }

  // Per-step stats
  const stepStats = STEPS.map((stepDef) => {
    const completedSteps = allStaff
      .flatMap((s) => s.probation?.steps ?? [])
      .filter((s) => s.stepNumber === stepDef.number && s.status === 'completed')

    const avgDays =
      completedSteps.length > 0
        ? Math.round(
            completedSteps
              .filter((s) => s.completedAt && s.createdAt)
              .reduce((sum, s) => {
                const created = new Date(s.createdAt).getTime()
                const completed = new Date(s.completedAt!).getTime()
                return sum + (completed - created) / (1000 * 60 * 60 * 24)
              }, 0) / completedSteps.length
          )
        : null

    const outcomeCounts: Record<string, number> = {}
    for (const step of completedSteps) {
      if (step.outcome) outcomeCounts[step.outcome] = (outcomeCounts[step.outcome] ?? 0) + 1
    }

    return {
      stepDef,
      completedCount: completedSteps.length,
      avgDays,
      outcomeCounts,
    }
  })

  const concernRate =
    totalStaff > 0 ? Math.round((allStaff.filter((s) => (s.probation?.concerns?.length ?? 0) > 0).length / totalStaff) * 100) : 0

  const completionRate =
    totalStaff > 0 ? Math.round((byStatus.completed / totalStaff) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackLink href="/" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Aggregate Reports</h1>
      <p className="text-slate-500 text-sm mb-8">Summary statistics across all probation cohorts</p>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Staff" value={totalStaff} sub="registered" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} sub="employment confirmed" colour="green" />
        <StatCard label="Concern Rate" value={`${concernRate}%`} sub="triggered Early Concerns" colour={concernRate > 20 ? 'red' : 'amber'} />
        <StatCard label="Active Now" value={byStatus.active} sub="in progress" colour="blue" />
      </div>

      {/* Status + School breakdown */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">By Probation Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Active', count: byStatus.active, colour: 'bg-blue-400' },
              { label: 'Completed', count: byStatus.completed, colour: 'bg-emerald-400' },
              { label: 'Extended', count: byStatus.extended, colour: 'bg-amber-400' },
              { label: 'Not Confirmed', count: byStatus.not_confirmed, colour: 'bg-red-400' },
            ].map(({ label, count, colour }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-medium text-slate-700">{count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colour}`}
                    style={{ width: totalStaff > 0 ? `${(count / totalStaff) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">By Sub-School</h2>
          <div className="space-y-3">
            {[
              { label: 'Junior School', count: bySchool.junior, colour: 'bg-indigo-400' },
              { label: 'Senior School', count: bySchool.senior, colour: 'bg-violet-400' },
            ].map(({ label, count, colour }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-medium text-slate-700">{count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colour}`}
                    style={{ width: totalStaff > 0 ? `${(count / totalStaff) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-step breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
        <h2 className="font-semibold text-slate-700 mb-4">Step Completion & Outcomes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="pb-2 text-slate-500 font-medium">Step</th>
                <th className="pb-2 text-slate-500 font-medium">Completed</th>
                <th className="pb-2 text-slate-500 font-medium">Avg Days</th>
                <th className="pb-2 text-slate-500 font-medium hidden md:table-cell">Top Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stepStats.map(({ stepDef, completedCount, avgDays, outcomeCounts }) => {
                const topOutcome = Object.entries(outcomeCounts).sort((a, b) => b[1] - a[1])[0]
                return (
                  <tr key={stepDef.number}>
                    <td className="py-3 font-medium text-slate-700">
                      <span className="inline-block w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs font-bold flex items-center justify-center mr-2">
                        {stepDef.number}
                      </span>
                      <span className="hidden sm:inline">{stepDef.title}</span>
                    </td>
                    <td className="py-3 text-slate-600">{completedCount}</td>
                    <td className="py-3 text-slate-600">{avgDays != null ? `${avgDays}d` : '—'}</td>
                    <td className="py-3 hidden md:table-cell">
                      {topOutcome ? (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {OUTCOME_LABELS[topOutcome[0]] ?? topOutcome[0]} ({topOutcome[1]})
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Early Concerns history */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
        <h2 className="font-semibold text-slate-700 mb-4">
          Early Concerns History
          <span className="ml-2 text-sm font-normal text-slate-400">({allConcerns.length} total)</span>
        </h2>
        {allConcerns.length === 0 ? (
          <p className="text-sm text-slate-400">No early concerns have been raised.</p>
        ) : (
          <div className="space-y-2">
            {allConcerns.slice(0, 10).map((concern) => (
              <div key={concern.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${concern.status === 'active' ? 'bg-red-400' : 'bg-slate-300'}`} />
                  <div>
                    <span className="text-slate-600">Step {concern.triggerStep}</span>
                    <span className="text-slate-400 text-xs ml-2">
                      {new Date(concern.triggeredAt).toLocaleDateString('en-AU')}
                    </span>
                  </div>
                </div>
                <Link href={`/concerns/${concern.id}`} className="text-xs text-[#1e3a5f] hover:underline">
                  {concern.status === 'active' ? 'Active →' : 'Resolved'}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Recent Activity Log</h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-slate-400">No activity recorded yet.</p>
        ) : (
          <div className="space-y-0 divide-y divide-slate-100 text-sm">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                <div>
                  <span className="font-medium text-slate-700">{formatAction(log.action)}</span>
                  {log.details && (
                    <span className="text-slate-400 ml-2 text-xs">{log.details}</span>
                  )}
                  <div className="text-xs text-slate-400 mt-0.5">by {log.performedBy}</div>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(log.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  colour = 'slate',
}: {
  label: string
  value: number | string
  sub: string
  colour?: string
}) {
  const colourMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  }
  return (
    <div className={`rounded-xl border p-4 text-center ${colourMap[colour]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      <div className="text-xs opacity-70 mt-0.5">{sub}</div>
    </div>
  )
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    staff_created: 'Staff member created',
    staff_archived: 'Staff member archived',
    staff_restored: 'Staff member restored',
    step_completed: 'Step completed',
    step_teacher_acknowledged: 'Teacher acknowledged step',
    step_supporter_acknowledged: 'Supporter reviewed step',
    concern_created: 'Early concern raised',
    concern_resolved: 'Early concern resolved',
  }
  return map[action] ?? action.replace(/_/g, ' ')
}
