import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { STEPS, OUTCOME_LABELS, OUTCOME_COLOURS } from '@/lib/constants'
import EarlyConcernForm from '@/components/forms/EarlyConcernForm'

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await prisma.staff.findUnique({
    where: { id },
    include: {
      probation: {
        include: {
          steps: { orderBy: { stepNumber: 'asc' } },
          concerns: { orderBy: { triggeredAt: 'desc' } },
        },
      },
    },
  })

  if (!member) notFound()

  const prob = member.probation
  const completedSteps = prob?.steps.filter((s) => s.status === 'completed').length ?? 0
  const activeConcerns = prob?.concerns.filter((c) => c.status === 'active') ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-lg">
            {member.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{member.name}</h1>
            <p className="text-slate-500 text-sm">
              {member.subSchool === 'junior' ? 'Junior School' : 'Senior School'}
              {member.department ? ` · ${member.department}` : ''} · {member.email}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              Started:{' '}
              {new Date(member.startDate).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeConcerns.length > 0 && (
            <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
              {activeConcerns.length} Active Concern{activeConcerns.length > 1 ? 's' : ''}
            </span>
          )}
          <StatusBadge status={prob?.status ?? 'unknown'} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Overall Progress</span>
          <span className="text-sm text-slate-500">{completedSteps} of 6 steps completed</span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1e3a5f] rounded-full transition-all"
            style={{ width: `${(completedSteps / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Active Concerns Alert */}
      {activeConcerns.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <h2 className="text-red-800 font-semibold mb-2">Early Concerns Pathway Active</h2>
          {activeConcerns.map((concern) => {
            const triggers = JSON.parse(concern.triggers) as string[]
            return (
              <div key={concern.id} className="text-sm text-red-700 mb-2">
                <span className="font-medium">Triggered:</span>{' '}
                {new Date(concern.triggeredAt).toLocaleDateString('en-AU')} at Step{' '}
                {concern.triggerStep} by {concern.triggeredBy}
                <div className="mt-1">
                  <span className="font-medium">Triggers:</span> {triggers.join(', ')}
                </div>
                {concern.supportMeasures && (
                  <div className="mt-1">
                    <span className="font-medium">Support measures:</span>{' '}
                    {(JSON.parse(concern.supportMeasures) as string[]).join(', ')}
                  </div>
                )}
                <Link
                  href={`/concerns/${concern.id}`}
                  className="text-red-600 underline text-xs mt-1 inline-block"
                >
                  View / Manage Concern
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Steps */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold text-slate-700">Probation Steps</h2>
        {STEPS.map((stepDef) => {
          const stepRecord = prob?.steps.find((s) => s.stepNumber === stepDef.number)
          const isActive = stepRecord?.status === 'in_progress'
          const isCompleted = stepRecord?.status === 'completed'
          const isPending = stepRecord?.status === 'pending'
          const canAction = isActive || isCompleted

          return (
            <div
              key={stepDef.number}
              className={`bg-white rounded-xl border p-5 transition-all ${
                isActive
                  ? 'border-[#1e3a5f] shadow-md'
                  : isCompleted
                  ? 'border-emerald-200'
                  : 'border-slate-200 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <StepIcon step={stepDef.number} status={stepRecord?.status ?? 'pending'} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">
                        Step {stepDef.number}: {stepDef.title}
                      </h3>
                      {isActive && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {stepDef.timing} · Led by: {stepDef.leader}
                    </p>
                    {stepDef.aitslFocus && (
                      <p className="text-xs text-indigo-600 mt-0.5">
                        AITSL Focus: {stepDef.aitslFocus}
                      </p>
                    )}
                    {isCompleted && stepRecord?.outcome && (
                      <div className="mt-2">
                        <OutcomePill outcome={stepRecord.outcome} />
                        {stepRecord.completedBy && (
                          <p className="text-xs text-slate-400 mt-1">
                            Completed by: {stepRecord.completedBy} ·{' '}
                            {stepRecord.completedAt
                              ? new Date(stepRecord.completedAt).toLocaleDateString('en-AU')
                              : ''}
                          </p>
                        )}
                        {stepRecord.notes && (
                          <p className="text-xs text-slate-600 mt-1 italic">&ldquo;{stepRecord.notes}&rdquo;</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {canAction && (
                  <Link
                    href={`/staff/${member.id}/steps/${stepDef.number}`}
                    className={`text-sm px-4 py-2 rounded-lg transition-colors shrink-0 ${
                      isActive
                        ? 'bg-[#1e3a5f] text-white hover:bg-[#2d527d]'
                        : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isActive ? 'Complete Step' : 'View / Edit'}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Early Concerns Pathway Section */}
      {prob && prob.status === 'active' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-1">Early Concerns Pathway</h2>
          <p className="text-sm text-slate-500 mb-4">
            Activate if concerns are identified regarding professional practice, conduct, or
            capacity to meet College expectations.
          </p>
          <EarlyConcernForm probationId={prob.id} currentStep={prob.currentStep} />
        </div>
      )}

      {/* Past Concerns */}
      {(prob?.concerns.filter((c) => c.status === 'resolved').length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Resolved Concerns</h2>
          <div className="space-y-3">
            {prob!.concerns
              .filter((c) => c.status === 'resolved')
              .map((c) => (
                <div key={c.id} className="text-sm text-slate-600 border-b border-slate-100 pb-2">
                  <span className="font-medium">Step {c.triggerStep}</span> ·{' '}
                  {new Date(c.triggeredAt).toLocaleDateString('en-AU')} · Resolved:{' '}
                  {c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString('en-AU') : 'N/A'}
                  {c.resolution && <p className="text-slate-500 mt-0.5 italic">{c.resolution}</p>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StepIcon({ step, status }: { step: number; status: string }) {
  const base = 'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0'
  if (status === 'completed') {
    return (
      <div className={`${base} bg-emerald-100 text-emerald-700`}>✓</div>
    )
  }
  if (status === 'in_progress') {
    return <div className={`${base} bg-[#1e3a5f] text-white`}>{step}</div>
  }
  return <div className={`${base} bg-slate-100 text-slate-400`}>{step}</div>
}

function OutcomePill({ outcome }: { outcome: string }) {
  const colourMap: Record<string, string> = {
    concern: 'bg-red-100 text-red-700',
    commendation: 'bg-emerald-100 text-emerald-700',
    additional_observation: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    extended: 'bg-amber-100 text-amber-700',
    not_confirmed: 'bg-red-100 text-red-700',
  }
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${colourMap[outcome] ?? 'bg-slate-100 text-slate-700'}`}
    >
      {OUTCOME_LABELS[outcome] ?? outcome}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800 border border-blue-200',
    completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    extended: 'bg-amber-100 text-amber-800 border border-amber-200',
    not_confirmed: 'bg-red-100 text-red-800 border border-red-200',
  }
  const labels: Record<string, string> = {
    active: 'Active Probation',
    completed: 'Employment Confirmed',
    extended: 'Probation Extended',
    not_confirmed: 'Not Confirmed',
  }
  return (
    <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {labels[status] ?? status}
    </span>
  )
}
