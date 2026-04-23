import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BackLink from '@/components/BackLink'
import { STEPS, OUTCOME_LABELS } from '@/lib/constants'
import { getStepDateRange, formatDateRange } from '@/lib/terms'
import EarlyConcernForm from '@/components/forms/EarlyConcernForm'
import FileUpload from '@/components/forms/FileUpload'
import ExtendProbationForm from '@/components/forms/ExtendProbationForm'
import AddCustomStepForm from '@/components/forms/AddCustomStepForm'
import ResetStepButton from '@/components/forms/ResetStepButton'
import { generateTeacherToken, activateCustomStep } from '@/lib/actions'

export const dynamic = 'force-dynamic'

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await prisma.staff.findUnique({
    where: { id },
    include: {
      hod: true,
      stageLeader: true,
      dean: true,
      director: true,
      deputy: true,
      academicAdmin: true,
      principal: true,
      probation: {
        include: {
          steps: {
            orderBy: { sortOrder: 'asc' },
            include: { attachments: true, survey: { include: { responses: true } } },
          },
          concerns: { orderBy: { triggeredAt: 'desc' } },
        },
      },
    },
  })

  if (!member) notFound()

  const prob = member.probation
  const completedSteps = prob?.steps.filter((s) => s.status === 'completed' && !s.isCustom).length ?? 0
  const activeConcerns = prob?.concerns.filter((c) => c.status === 'active') ?? []

  const stepDateRanges = await Promise.all(
    STEPS.map((s) => getStepDateRange(member.startDate, s.number))
  )

  // Audit log: query by staffId + legacy entityType lookup
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { staffId: id },
        { entityType: 'Staff', entityId: id },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  // Deduplicate by id (a log can match both conditions)
  const uniqueLogs = Array.from(new Map(auditLogs.map((l) => [l.id, l])).values())

  const supporters = [
    member.hod && { label: 'Head of Department', person: member.hod },
    member.stageLeader && { label: 'Stage Leader', person: member.stageLeader },
    member.dean && { label: 'Dean of Studies', person: member.dean },
    member.director && { label: 'Director of Teaching & Learning', person: member.director },
    member.deputy && { label: 'Deputy Principal', person: member.deputy },
    member.academicAdmin && { label: 'Academic Administration (Sub School)', person: member.academicAdmin },
    member.principal && { label: 'College Principal', person: member.principal },
  ].filter(Boolean) as { label: string; person: { name: string; email: string } }[]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackLink href="/staff" label="Back to Staff" />
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-lg">
            {member.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{member.name}</h1>
            <p className="text-slate-500 text-sm">
              {member.subSchool === 'junior' ? 'Junior School' : 'Senior School'}
              {member.department ? ` · ${member.department}` : ''} · {member.email}
            </p>
            {member.teachingRole && (
              <p className="text-xs text-slate-400 mt-0.5">{member.teachingRole}</p>
            )}
            <p className="text-xs text-slate-400 mt-0.5">
              Started: {new Date(member.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={prob?.status ?? 'unknown'} />
          <Link href={`/staff/${id}/report`}
            className="text-xs border border-slate-300 text-slate-600 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors">
            View Report
          </Link>
          <Link href={`/staff/${id}/edit`}
            className="text-xs border border-[#1e3a5f]/30 text-[#1e3a5f] px-3 py-1 rounded-lg hover:bg-[#1e3a5f]/5 transition-colors">
            Edit Record
          </Link>
          {member.teacherToken ? (
            <a href={`/teacher/${member.teacherToken}`} target="_blank" rel="noopener noreferrer"
              className="text-xs border border-[#1e3a5f]/40 text-[#1e3a5f] px-3 py-1 rounded-lg hover:bg-[#1e3a5f]/5 transition-colors">
              Teacher Portal ↗
            </a>
          ) : (
            <TeacherTokenForm staffId={id} />
          )}
        </div>
      </div>

      {/* Supporters panel */}
      {supporters.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Assigned Supporting Staff</h2>
          <div className="flex flex-wrap gap-3">
            {supporters.map(({ label, person }) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm">
                <div className="text-xs text-slate-400 font-medium">{label}</div>
                <div className="font-medium text-slate-700">{person.name}</div>
                <div className="text-xs text-slate-400">{person.email}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extension notice */}
      {prob?.status === 'extended' && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 mb-6">
          <h2 className="text-amber-800 font-semibold mb-1">Probation Extended</h2>
          <p className="text-sm text-amber-700">
            Extended from Step {prob.extensionFromStep ?? prob.currentStep}
            {prob.extendedBy ? ` by ${prob.extendedBy}` : ''}
            {prob.extendedAt ? ` on ${new Date(prob.extendedAt).toLocaleDateString('en-AU')}` : ''}.
          </p>
          {prob.extensionReason && (
            <p className="text-sm text-amber-700 mt-1">{prob.extensionReason}</p>
          )}
        </div>
      )}

      {/* Progress flowchart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-600">Probation Timeline</span>
          <span className="text-sm text-slate-500">{completedSteps} of 6 steps completed</span>
        </div>
        <div className="flex items-start gap-0 min-w-max">
          {STEPS.map((stepDef, idx) => {
            const stepRecord = prob?.steps.find((s) => s.stepNumber === stepDef.number && !s.isCustom)
            const status = stepRecord?.status ?? 'pending'
            const customAfter = prob?.steps.filter((s) => s.isCustom && s.stepNumber === stepDef.number) ?? []
            const isLast = idx === STEPS.length - 1
            return (
              <div key={stepDef.number} className="flex items-center">
                <div className="flex flex-col items-center w-20">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    status === 'completed' ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                    : status === 'in_progress' ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white'
                    : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {status === 'completed' ? '✓' : stepDef.number}
                  </div>
                  <p className="text-xs text-center mt-1 leading-tight text-slate-500 px-1">{stepDef.title}</p>
                  {status === 'completed' && stepRecord?.outcome && (
                    <span className={`text-xs px-1.5 py-0.5 rounded mt-1 font-medium ${
                      stepRecord.outcome === 'commendation' || stepRecord.outcome === 'confirmed' ? 'bg-emerald-100 text-emerald-700'
                      : stepRecord.outcome === 'concern' || stepRecord.outcome === 'not_confirmed' ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}>
                      {stepRecord.outcome === 'commendation' ? '★' : stepRecord.outcome === 'concern' ? '!' : stepRecord.outcome === 'confirmed' ? '✓' : stepRecord.outcome === 'additional_observation' ? '+obs' : stepRecord.outcome === 'extended' ? 'ext' : '✗'}
                    </span>
                  )}
                  {customAfter.map((cs) => (
                    <span key={cs.id} className={`text-xs px-1.5 py-0.5 rounded mt-0.5 font-medium ${
                      cs.status === 'completed' ? 'bg-emerald-100 text-emerald-700'
                      : cs.status === 'in_progress' ? 'bg-[#1e3a5f]/20 text-[#1e3a5f]'
                      : 'bg-slate-100 text-slate-500'
                    }`}>
                      {stepDef.number}{cs.customLabel}
                    </span>
                  ))}
                </div>
                {!isLast && (
                  <div className={`h-0.5 w-6 shrink-0 mx-0.5 -mt-8 ${status === 'completed' ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-[#1e3a5f] rounded-full transition-all" style={{ width: `${(completedSteps / 6) * 100}%` }} />
        </div>
      </div>

      {/* Active Concerns Alert */}
      {activeConcerns.length > 0 && (
        <div className="bg-maroon-50 border border-maroon-200 rounded-xl p-5 mb-6">
          <h2 className="text-maroon-800 font-semibold mb-2">Early Concerns Pathway Active</h2>
          {activeConcerns.map((concern) => {
            const triggers = JSON.parse(concern.triggers) as string[]
            return (
              <div key={concern.id} className="text-sm text-maroon-700 mb-2">
                <span className="font-medium">Triggered:</span>{' '}
                {new Date(concern.triggeredAt).toLocaleDateString('en-AU')} at Step {concern.triggerStep} by {concern.triggeredBy}
                <div className="mt-1 text-xs">{triggers.join(' · ')}</div>
                <Link href={`/concerns/${concern.id}`} className="text-maroon-600 underline text-xs mt-1 inline-block">View / Manage</Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Steps */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold text-slate-700">Probation Steps</h2>

        {STEPS.map((stepDef, idx) => {
          const stepRecord = prob?.steps.find((s) => s.stepNumber === stepDef.number && !s.isCustom)
          const customSteps = prob?.steps.filter((s) => s.isCustom && s.stepNumber === stepDef.number) ?? []
          const isActive = stepRecord?.status === 'in_progress'
          const isCompleted = stepRecord?.status === 'completed'
          const dateRange = stepDateRanges[idx]
          const hasSurvey = stepDef.number === 2
          const stepLabel = `Step ${stepDef.number}`

          return (
            <div key={stepDef.number}>
              {/* Standard step card */}
              <div className={`bg-white rounded-xl border p-5 transition-all ${
                isActive ? 'border-[#1e3a5f] shadow-md' : isCompleted ? 'border-emerald-200' : 'border-slate-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <StepIcon step={stepDef.number} status={stepRecord?.status ?? 'pending'} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{stepLabel}: {stepDef.title}</h3>
                        {isActive && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Current</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{stepDef.timing} · Led by: {stepDef.leader}</p>

                      {dateRange.startDate && (
                        <p className={`text-xs mt-1 font-medium ${
                          !isCompleted && dateRange.isOverdue ? 'text-red-600'
                          : !isCompleted && dateRange.onTrack ? 'text-emerald-600'
                          : 'text-slate-400'
                        }`}>
                          {formatDateRange(dateRange.startDate, dateRange.endDate)}
                          {!isCompleted && dateRange.isOverdue && ' — Overdue'}
                          {!isCompleted && dateRange.isUpcoming && ' — Upcoming'}
                          {!isCompleted && dateRange.onTrack && ' — On Track'}
                          {isCompleted && ' — Completed'}
                        </p>
                      )}

                      {stepDef.aitslFocus && (
                        <p className="text-xs text-indigo-600 mt-0.5">AITSL Focus: {stepDef.aitslFocus}</p>
                      )}

                      {isCompleted && stepRecord?.outcome && (
                        <div className="mt-2">
                          <OutcomePill outcome={stepRecord.outcome} />
                          {stepRecord.completedBy && (
                            <p className="text-xs text-slate-400 mt-1">
                              Completed by: {stepRecord.completedBy} ·{' '}
                              {stepRecord.completedAt ? new Date(stepRecord.completedAt).toLocaleDateString('en-AU') : ''}
                            </p>
                          )}
                          {stepRecord.notes && <p className="text-xs text-slate-600 mt-1 italic">&ldquo;{stepRecord.notes}&rdquo;</p>}
                        </div>
                      )}

                      {hasSurvey && stepRecord && (
                        <div className="mt-2 flex items-center gap-2">
                          {stepRecord.survey?.sentAt ? (
                            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                              Survey sent · {stepRecord.survey.responses.length} response(s)
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Survey not sent yet</span>
                          )}
                          <Link href={`/staff/${member.id}/survey`} className="text-xs text-[#1e3a5f] underline">
                            {stepRecord.survey?.sentAt ? 'View survey' : 'Send survey'}
                          </Link>
                        </div>
                      )}

                      {stepRecord && (isActive || isCompleted) && (
                        <div className="mt-3">
                          <FileUpload
                            stepId={stepRecord.id}
                            uploadedBy="Staff Administrator"
                            initialAttachments={stepRecord.attachments.map((a) => ({
                              ...a,
                              uploadedAt: a.uploadedAt.toISOString(),
                            }))}
                          />
                        </div>
                      )}

                      {/* Reset button for completed steps */}
                      {isCompleted && stepRecord && (
                        <div className="mt-3">
                          <ResetStepButton stepId={stepRecord.id} stepLabel={stepLabel} />
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/staff/${member.id}/steps/${stepDef.number}`}
                    className={`text-sm px-4 py-2 rounded-lg transition-colors shrink-0 ml-3 ${
                      isActive ? 'bg-[#1e3a5f] text-white hover:bg-[#2d527d]'
                      : isCompleted ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                      : 'border border-amber-300 text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    {isActive ? 'Complete Step' : isCompleted ? 'View / Edit' : 'Admin Override'}
                  </Link>
                </div>
              </div>

              {/* Custom steps after this base step */}
              {customSteps.map((cs) => {
                const customLabel = `Step ${cs.stepNumber}${cs.customLabel ?? ''}`
                return (
                  <div key={cs.id} className={`ml-6 mt-2 bg-white rounded-xl border p-4 transition-all ${
                    cs.status === 'in_progress' ? 'border-[#1e3a5f] shadow-sm'
                    : cs.status === 'completed' ? 'border-emerald-200'
                    : 'border-slate-200 border-dashed'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <StepIcon step={cs.stepNumber} status={cs.status} label={`${cs.stepNumber}${cs.customLabel ?? ''}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-700 text-sm">{customLabel}: {cs.customTitle}</h3>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Added Step</span>
                            {cs.status === 'in_progress' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Current</span>}
                          </div>
                          {cs.status === 'completed' && cs.outcome && (
                            <div className="mt-1">
                              <OutcomePill outcome={cs.outcome} />
                              {cs.completedBy && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {cs.completedBy} · {cs.completedAt ? new Date(cs.completedAt).toLocaleDateString('en-AU') : ''}
                                </p>
                              )}
                            </div>
                          )}
                          {cs.status === 'completed' && (
                            <div className="mt-2">
                              <ResetStepButton stepId={cs.id} stepLabel={customLabel} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        {cs.status === 'pending' && (
                          <form action={activateCustomStep.bind(null, cs.id)}>
                            <button type="submit"
                              className="text-xs border border-[#1e3a5f]/40 text-[#1e3a5f] px-3 py-1.5 rounded-lg hover:bg-[#1e3a5f]/5 transition-colors">
                              Activate
                            </button>
                          </form>
                        )}
                        {(cs.status === 'in_progress' || cs.status === 'completed') && (
                          <Link href={`/staff/${member.id}/steps/${cs.stepNumber}`}
                            className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                              cs.status === 'in_progress' ? 'bg-[#1e3a5f] text-white hover:bg-[#2d527d]'
                              : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                            }`}>
                            {cs.status === 'in_progress' ? 'Complete Step' : 'View / Edit'}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Add custom step */}
        {prob && (prob.status === 'active' || prob.status === 'extended') && (
          <div className="mt-2">
            <AddCustomStepForm
              probationId={prob.id}
              existingSteps={prob.steps.map((s) => ({
                stepNumber: s.stepNumber,
                customLabel: s.customLabel,
                isCustom: s.isCustom,
              }))}
            />
          </div>
        )}
      </div>

      {/* Extend Probation */}
      {prob && (prob.status === 'active' || prob.status === 'extended') && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-1">Extend Probation Period</h2>
          <p className="text-sm text-slate-500 mb-4">
            Use this to formally extend the probation period. The Director of Teaching & Learning, Deputy Principal, and Dean of Studies
            will be notified with a template email to send to {member.name}.
          </p>
          <ExtendProbationForm probationId={prob.id} currentStep={prob.currentStep} />
        </div>
      )}

      {/* Early Concerns Pathway */}
      {prob && prob.status === 'active' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-1">Early Concerns Pathway</h2>
          <p className="text-sm text-slate-500 mb-4">
            Activate if concerns are identified regarding professional practice, conduct, or capacity to meet College expectations.
          </p>
          <EarlyConcernForm probationId={prob.id} currentStep={prob.currentStep} />
        </div>
      )}

      {/* Resolved Concerns */}
      {(prob?.concerns.filter((c) => c.status === 'resolved').length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Resolved Concerns</h2>
          <div className="space-y-3">
            {prob!.concerns.filter((c) => c.status === 'resolved').map((c) => (
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

      {/* Activity Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Activity Log</h2>
        {uniqueLogs.length === 0 ? (
          <p className="text-sm text-slate-400">No activity recorded yet.</p>
        ) : (
          <div className="space-y-0 divide-y divide-slate-100">
            {uniqueLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700">{formatAuditAction(log.action)}</p>
                  {log.details && <p className="text-xs text-slate-500 mt-0.5 truncate">{log.details}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {log.performedBy} · {new Date(log.createdAt).toLocaleString('en-AU', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className="text-xs text-slate-300 shrink-0 font-mono">{log.entityType}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatAuditAction(action: string): string {
  const labels: Record<string, string> = {
    staff_created: 'Staff record created',
    staff_updated: 'Staff record updated',
    staff_archived: 'Staff record archived',
    staff_restored: 'Staff record restored',
    step_completed: 'Probation step completed',
    step_reset: 'Probation step reset',
    custom_step_added: 'Additional step added',
    custom_step_activated: 'Additional step activated',
    concern_created: 'Early concern raised',
    concern_created_out_of_cycle: 'Out-of-cycle concern initiated',
    concern_resolved: 'Concern resolved',
    probation_extended: 'Probation period extended',
    step_teacher_acknowledged: 'Teacher acknowledged step',
    teacher_reflection_saved: 'Teacher reflection saved',
    step_supporter_acknowledged: 'Supporter reviewed step',
    teacher_token_generated: 'Teacher portal link generated',
  }
  return labels[action] ?? action.replace(/_/g, ' ')
}

function StepIcon({ step, status, label }: { step: number; status: string; label?: string }) {
  const base = 'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0'
  const display = label ?? step
  if (status === 'completed') return <div className={`${base} bg-emerald-100 text-emerald-700`}>✓</div>
  if (status === 'in_progress') return <div className={`${base} bg-[#1e3a5f] text-white text-xs`}>{display}</div>
  return <div className={`${base} bg-slate-100 text-slate-400 text-xs`}>{display}</div>
}

function OutcomePill({ outcome }: { outcome: string }) {
  const colourMap: Record<string, string> = {
    concern: 'bg-maroon-100 text-maroon-700',
    commendation: 'bg-emerald-100 text-emerald-700',
    additional_observation: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    extended: 'bg-amber-100 text-amber-700',
    not_confirmed: 'bg-maroon-100 text-maroon-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colourMap[outcome] ?? 'bg-slate-100 text-slate-700'}`}>
      {OUTCOME_LABELS[outcome] ?? outcome}
    </span>
  )
}

function TeacherTokenForm({ staffId }: { staffId: string }) {
  return (
    <form action={generateTeacherToken.bind(null, staffId)}>
      <button type="submit"
        className="text-xs border border-slate-300 text-slate-500 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors"
        title="Generate a private portal link for this teacher">
        Generate Teacher Portal
      </button>
    </form>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800 border border-blue-200',
    completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    extended: 'bg-amber-100 text-amber-800 border border-amber-200',
    not_confirmed: 'bg-maroon-100 text-maroon-800 border border-maroon-200',
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
