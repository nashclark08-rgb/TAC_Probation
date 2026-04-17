import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { STEPS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [allStaff, activeConcerns] = await Promise.all([
    prisma.staff.findMany({
      include: {
        probation: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
            concerns: { where: { status: 'active' } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.earlyConcern.findMany({ where: { status: 'active' } }),
  ])

  const activeCount = allStaff.filter((s) => s.probation?.status === 'active').length
  const completedCount = allStaff.filter((s) => s.probation?.status === 'completed').length
  const extendedCount = allStaff.filter((s) => s.probation?.status === 'extended').length
  const concernCount = activeConcerns.length

  const stepDistribution = STEPS.map((step) => ({
    ...step,
    count: allStaff.filter(
      (s) => s.probation?.status === 'active' && s.probation?.currentStep === step.number
    ).length,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Probation Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Overview of all teaching staff currently undergoing probation
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Active Probations" value={activeCount} colour="blue" />
        <SummaryCard label="Completed" value={completedCount} colour="green" />
        <SummaryCard label="Extended" value={extendedCount} colour="amber" />
        <SummaryCard
          label="Active Concerns"
          value={concernCount}
          colour={concernCount > 0 ? 'red' : 'slate'}
          href="/concerns"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Probation Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stepDistribution.map((step) => (
            <div
              key={step.number}
              className="rounded-lg border border-slate-200 p-3 text-center bg-slate-50"
            >
              <div className="text-2xl font-bold text-slate-700">{step.count}</div>
              <div className="text-xs text-slate-500 mt-1">Step {step.number}</div>
              <div className="text-xs font-medium text-slate-600 mt-1 leading-tight">
                {step.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-700">All Probationary Staff</h2>
          <Link
            href="/staff/new"
            className="text-sm bg-[#1e3a5f] text-white px-4 py-2 rounded-lg hover:bg-[#2d527d] transition-colors"
          >
            + Add Staff Member
          </Link>
        </div>

        {allStaff.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <p className="text-lg mb-2">No staff members added yet</p>
            <Link href="/staff/new" className="text-[#1e3a5f] underline text-sm">
              Add your first staff member
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allStaff.map((member) => {
              const prob = member.probation
              const hasActiveConcern = (prob?.concerns?.length ?? 0) > 0
              return (
                <Link
                  key={member.id}
                  href={`/staff/${member.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-sm">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 flex items-center gap-2">
                        {member.name}
                        {hasActiveConcern && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Concern Active
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        {member.subSchool === 'junior' ? 'Junior School' : 'Senior School'}
                        {member.department ? ` · ${member.department}` : ''} · {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {prob?.status === 'active' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        Step {prob.currentStep}
                      </span>
                    )}
                    <StatusPill status={prob?.status ?? 'unknown'} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-8 bg-[#1e3a5f] text-white rounded-xl p-6">
        <h2 className="font-semibold text-[#c9a84c] mb-3">
          Teaching Staff Probation &amp; PDI Framework — At a Glance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {STEPS.map((step) => (
            <div key={step.number} className="text-xs">
              <span className="text-[#c9a84c] font-bold">Step {step.number}:</span>{' '}
              <span className="text-slate-200">{step.title}</span>
              <div className="text-slate-400">{step.timing} · {step.leader}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  colour,
  href,
}: {
  label: string
  value: number
  colour: string
  href?: string
}) {
  const colourMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-600',
  }
  const cls = `rounded-xl border p-4 text-center ${colourMap[colour] ?? colourMap.slate}`
  const content = (
    <div className={cls}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1 font-medium">{label}</div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    extended: 'bg-amber-100 text-amber-800',
    not_confirmed: 'bg-red-100 text-red-800',
  }
  const labels: Record<string, string> = {
    active: 'Active',
    completed: 'Completed',
    extended: 'Extended',
    not_confirmed: 'Not Confirmed',
  }
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${map[status] ?? 'bg-slate-100 text-slate-700'}`}
    >
      {labels[status] ?? status}
    </span>
  )
}
