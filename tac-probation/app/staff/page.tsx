import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function StaffListPage() {
  const staff = await prisma.staff.findMany({
    include: {
      probation: {
        include: {
          steps: { orderBy: { stepNumber: 'asc' } },
          concerns: { where: { status: 'active' } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Probationary Staff</h1>
          <p className="text-slate-500 text-sm mt-1">{staff.length} staff member(s) registered</p>
        </div>
        <Link
          href="/staff/new"
          className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg hover:bg-[#2d527d] transition-colors text-sm"
        >
          + Add Staff Member
        </Link>
      </div>

      {staff.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-lg">No staff members have been added yet.</p>
          <Link href="/staff/new" className="text-[#1e3a5f] underline text-sm mt-2 inline-block">
            Add your first staff member
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {staff.map((member) => {
            const prob = member.probation
            const completedSteps = prob?.steps.filter((s) => s.status === 'completed').length ?? 0
            const hasActiveConcern = (prob?.concerns?.length ?? 0) > 0

            return (
              <Link
                key={member.id}
                href={`/staff/${member.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      {member.name}
                      {hasActiveConcern && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Concern Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {member.email} ·{' '}
                      {member.subSchool === 'junior' ? 'Junior School' : 'Senior School'}
                      {member.department ? ` · ${member.department}` : ''}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Started: {new Date(member.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {prob && (
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5,6].map((n) => {
                        const step = prob.steps.find((s) => s.stepNumber === n)
                        const st = step?.status ?? 'pending'
                        return (
                          <div
                            key={n}
                            title={`Step ${n}`}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              st === 'completed'
                                ? 'bg-emerald-400 border-emerald-500 text-white'
                                : st === 'in_progress'
                                ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white'
                                : 'bg-slate-100 border-slate-200 text-slate-300'
                            }`}
                          >
                            {st === 'completed' ? '✓' : n}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <StatusBadge status={prob?.status ?? 'unknown'} currentStep={prob?.currentStep} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}


function StatusBadge({ status, currentStep }: { status: string; currentStep?: number | null }) {
  const map: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    extended: 'bg-amber-100 text-amber-800',
    not_confirmed: 'bg-red-100 text-red-800',
  }
  return (
    <div className="text-center">
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>
        {status === 'active' ? `Step ${currentStep ?? '?'}` : status.replace('_', ' ')}
      </span>
    </div>
  )
}
