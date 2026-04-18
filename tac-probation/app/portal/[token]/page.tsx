import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { STEPS, OUTCOME_LABELS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  hod: 'Head of Department',
  stage_leader: 'Stage Leader',
  dean_of_studies: 'Dean of Studies',
  director_tl: 'Director of Teaching & Learning',
  deputy_principal: 'Deputy Principal',
  hr: 'HR',
  curriculum_leader: 'Curriculum Leader',
  middle_leader: 'Middle Leader',
  academic_admin: 'Sub School Academic Admin',
  principal: 'College Principal',
}

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const supporter = await prisma.supportingStaff.findUnique({
    where: { portalToken: token },
    include: {
      hodFor: {
        include: { probation: { include: { steps: { orderBy: { stepNumber: 'asc' } } } } },
      },
      stageFor: {
        include: { probation: { include: { steps: { orderBy: { stepNumber: 'asc' } } } } },
      },
      deanFor: {
        include: { probation: { include: { steps: { orderBy: { stepNumber: 'asc' } } } } },
      },
      directorFor: {
        include: { probation: { include: { steps: { orderBy: { stepNumber: 'asc' } } } } },
      },
      deputyFor: {
        include: { probation: { include: { steps: { orderBy: { stepNumber: 'asc' } } } } },
      },
      academicAdminFor: {
        include: { probation: { include: { steps: { orderBy: { stepNumber: 'asc' } } } } },
      },
      principalFor: {
        include: { probation: { include: { steps: { orderBy: { stepNumber: 'asc' } } } } },
      },
    },
  })

  if (!supporter) notFound()

  // Deduplicate assigned staff across all role relations
  const seen = new Set<string>()
  const assignedStaff: Array<{
    staff: (typeof supporter.hodFor)[0]
    roles: string[]
  }> = []

  const roleGroups: Array<{ members: typeof supporter.hodFor; roleLabel: string }> = [
    { members: supporter.hodFor, roleLabel: 'Head of Department' },
    { members: supporter.stageFor, roleLabel: 'Stage Leader' },
    { members: supporter.deanFor, roleLabel: 'Dean of Studies' },
    { members: supporter.directorFor, roleLabel: 'Director of Teaching & Learning' },
    { members: supporter.deputyFor, roleLabel: 'Deputy Principal' },
    { members: supporter.academicAdminFor, roleLabel: 'Sub School Academic Admin' },
    { members: supporter.principalFor, roleLabel: 'College Principal' },
  ]

  for (const { members, roleLabel } of roleGroups) {
    for (const member of members) {
      if (seen.has(member.id)) {
        const existing = assignedStaff.find((a) => a.staff.id === member.id)
        existing?.roles.push(roleLabel)
      } else {
        seen.add(member.id)
        assignedStaff.push({ staff: member, roles: [roleLabel] })
      }
    }
  }

  const roleLabel = ROLE_LABELS[supporter.role] ?? supporter.role

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white rounded-xl p-6 mb-6">
          <h1 className="text-xl font-bold text-white">Trinity Anglican College</h1>
          <p className="text-slate-300 text-sm mt-1">Probation Tracker — Supporting Staff Portal</p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="font-semibold text-lg">{supporter.name}</p>
            <p className="text-slate-300 text-sm">{roleLabel}</p>
          </div>
        </div>

        {assignedStaff.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No probationary staff are currently assigned to you.</p>
            <p className="text-slate-400 text-sm mt-2">You will receive an email notification when a new teacher is assigned.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide px-1">
              Assigned Probationary Staff ({assignedStaff.length})
            </h2>
            {assignedStaff.map(({ staff: member, roles }) => {
              const prob = member.probation
              const completedCount = prob?.steps.filter((s) => s.status === 'completed').length ?? 0
              const currentStep = prob?.steps.find((s) => s.status === 'in_progress')
              const currentStepDef = currentStep ? STEPS.find((s) => s.number === currentStep.stepNumber) : null

              return (
                <div key={member.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  {/* Staff header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {member.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-500">
                          {member.subSchool === 'junior' ? 'Junior School' : 'Senior School'}
                          {member.department ? ` · ${member.department}` : ''}
                        </p>
                        <p className="text-xs text-slate-400">
                          Started: {new Date(member.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {roles.map((r) => (
                            <span key={r} className="text-xs bg-[#1e3a5f]/10 text-[#1e3a5f] px-2 py-0.5 rounded-full">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ProbationStatusBadge status={prob?.status ?? 'unknown'} />
                  </div>

                  {/* Step progress */}
                  {prob && (
                    <>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Progress</span>
                          <span>{completedCount} of 6 steps completed</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1e3a5f] rounded-full"
                            style={{ width: `${(completedCount / 6) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Step indicators */}
                      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                        {STEPS.map((stepDef) => {
                          const stepRecord = prob.steps.find((s) => s.stepNumber === stepDef.number)
                          const status = stepRecord?.status ?? 'pending'
                          return (
                            <div key={stepDef.number} className="flex flex-col items-center shrink-0">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                  status === 'completed'
                                    ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                                    : status === 'in_progress'
                                    ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white'
                                    : 'bg-white border-slate-200 text-slate-300'
                                }`}
                              >
                                {status === 'completed' ? '✓' : stepDef.number}
                              </div>
                              {stepRecord?.outcome && status === 'completed' && (
                                <OutcomeDot outcome={stepRecord.outcome} />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {currentStepDef && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-800">
                          <span className="font-medium">Current:</span> Step {currentStepDef.number} – {currentStepDef.title}
                          <span className="text-blue-500 text-xs ml-2">· {currentStepDef.timing}</span>
                        </div>
                      )}

                      {/* Completed step outcomes */}
                      {completedCount > 0 && (
                        <div className="mt-3 space-y-1">
                          {prob.steps.filter((s) => s.status === 'completed').map((s) => {
                            const def = STEPS.find((d) => d.number === s.stepNumber)
                            return (
                              <div key={s.id} className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="text-emerald-600">✓ Step {s.stepNumber}:</span>
                                <span>{def?.title}</span>
                                {s.outcome && (
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${outcomeColour(s.outcome)}`}>
                                    {OUTCOME_LABELS[s.outcome] ?? s.outcome}
                                  </span>
                                )}
                                {s.completedAt && (
                                  <span className="text-slate-400">
                                    {new Date(s.completedAt).toLocaleDateString('en-AU')}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          Trinity Anglican College · Probation Tracker<br />
          This portal is for authorised supporting staff only.
        </p>
      </div>
    </div>
  )
}

function OutcomeDot({ outcome }: { outcome: string }) {
  const colours: Record<string, string> = {
    concern: 'bg-red-400',
    commendation: 'bg-emerald-400',
    additional_observation: 'bg-amber-400',
    confirmed: 'bg-emerald-400',
    extended: 'bg-amber-400',
    not_confirmed: 'bg-red-400',
  }
  return <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${colours[outcome] ?? 'bg-slate-300'}`} />
}

function outcomeColour(outcome: string): string {
  const map: Record<string, string> = {
    concern: 'bg-red-100 text-red-700',
    commendation: 'bg-emerald-100 text-emerald-700',
    additional_observation: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    extended: 'bg-amber-100 text-amber-700',
    not_confirmed: 'bg-red-100 text-red-700',
  }
  return map[outcome] ?? 'bg-slate-100 text-slate-600'
}

function ProbationStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    extended: 'bg-amber-100 text-amber-800',
    not_confirmed: 'bg-red-100 text-red-800',
  }
  const labels: Record<string, string> = {
    active: 'Active',
    completed: 'Confirmed',
    extended: 'Extended',
    not_confirmed: 'Not Confirmed',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {labels[status] ?? status}
    </span>
  )
}
