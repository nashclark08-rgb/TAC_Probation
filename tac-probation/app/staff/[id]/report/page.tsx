import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { STEPS, OUTCOME_LABELS } from '@/lib/constants'
import { shareReportWithContacts } from '@/lib/admin-actions'
import PrintButton from '@/components/PrintButton'

export const dynamic = 'force-dynamic'

export default async function StaffReportPage({ params }: { params: Promise<{ id: string }> }) {
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
            orderBy: { stepNumber: 'asc' },
            include: { attachments: true },
          },
          concerns: { orderBy: { triggeredAt: 'asc' } },
        },
      },
    },
  })

  if (!member) notFound()

  const prob = member.probation
  const completedSteps = prob?.steps.filter((s) => s.status === 'completed').length ?? 0
  const step6 = prob?.steps.find((s) => s.stepNumber === 6)
  const finalOutcome = step6?.outcome

  const statusLabels: Record<string, string> = {
    active: 'Active',
    completed: 'Employment Confirmed',
    extended: 'Probation Extended',
    not_confirmed: 'Not Confirmed',
  }

  const shareAction = shareReportWithContacts.bind(null, id)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="text-sm text-slate-500">
          <Link href="/staff" className="hover:text-[#1e3a5f]">Staff</Link> /{' '}
          <Link href={`/staff/${id}`} className="hover:text-[#1e3a5f]">{member.name}</Link> / Report
        </div>
        <div className="flex gap-2">
          <form action={shareAction}>
            <button
              type="submit"
              className="text-sm border border-slate-300 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Share with HR &amp; Principal
            </button>
          </form>
          <PrintButton />
        </div>
      </div>

      {/* Report document */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{member.name}</h1>
              <p className="text-slate-300 mt-1">
                {member.subSchool === 'junior' ? 'Junior School' : 'Senior School'}
                {member.department ? ` · ${member.department}` : ''}
              </p>
              {member.teachingRole && (
                <p className="text-slate-300 text-sm mt-0.5">{member.teachingRole}</p>
              )}
              <p className="text-slate-400 text-sm mt-1">
                Start date: {new Date(member.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-slate-300 text-sm">Probation Report</div>
              <div className="text-slate-300 text-sm">Trinity Anglican College</div>
              <div className="text-slate-400 text-xs mt-1">
                Generated: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20 flex items-center gap-6">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Status</div>
              <div className="font-semibold mt-0.5">{statusLabels[prob?.status ?? ''] ?? prob?.status ?? 'Unknown'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Steps Completed</div>
              <div className="font-semibold mt-0.5">{completedSteps} of 6</div>
            </div>
            {finalOutcome && (
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Final Outcome</div>
                <div className="font-semibold mt-0.5">{OUTCOME_LABELS[finalOutcome] ?? finalOutcome}</div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Supporting Staff */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Supporting Staff</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(
                [
                  { label: 'Head of Department', person: member.hod },
                  { label: 'Stage Leader', person: member.stageLeader },
                  { label: 'Dean of Studies', person: member.dean },
                  { label: 'Director of Teaching & Learning', person: member.director },
                  { label: 'Deputy Principal', person: member.deputy },
                  { label: 'Sub School Academic Admin', person: member.academicAdmin },
                  { label: 'College Principal', person: member.principal },
                ] as { label: string; person: { name: string } | null }[]
              ).filter((x) => x.person !== null).map(({ label, person }) => (
                <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-400">{label}</div>
                  <div className="font-medium text-slate-700">{person!.name}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Steps */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Probation Steps</h2>
            <div className="space-y-4">
              {STEPS.map((stepDef) => {
                const stepRecord = prob?.steps.find((s) => s.stepNumber === stepDef.number)
                const isCompleted = stepRecord?.status === 'completed'
                const isInProgress = stepRecord?.status === 'in_progress'

                return (
                  <div
                    key={stepDef.number}
                    className={`rounded-xl border p-5 ${
                      isCompleted ? 'border-emerald-200 bg-emerald-50/30' :
                      isInProgress ? 'border-[#1e3a5f]/30 bg-blue-50/30' :
                      'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCompleted ? 'bg-emerald-400 text-white' :
                            isInProgress ? 'bg-[#1e3a5f] text-white' :
                            'bg-slate-200 text-slate-500'
                          }`}>
                            {isCompleted ? '✓' : stepDef.number}
                          </span>
                          <h3 className="font-semibold text-slate-800 text-sm">
                            Step {stepDef.number}: {stepDef.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 ml-9">{stepDef.timing} · Led by: {stepDef.leader}</p>
                      </div>
                      {isCompleted && stepRecord?.outcome && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-2 ${
                          stepRecord.outcome === 'commendation' || stepRecord.outcome === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : stepRecord.outcome === 'concern' || stepRecord.outcome === 'not_confirmed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {OUTCOME_LABELS[stepRecord.outcome] ?? stepRecord.outcome}
                        </span>
                      )}
                    </div>

                    {isCompleted && stepRecord && (
                      <div className="ml-9 space-y-2 mt-3 text-sm">
                        {stepRecord.completedBy && (
                          <div>
                            <span className="text-xs font-semibold text-slate-500">Completed by:</span>{' '}
                            <span className="text-slate-700">{stepRecord.completedBy}</span>
                            {stepRecord.completedAt && (
                              <span className="text-slate-400 ml-2">
                                {new Date(stepRecord.completedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        )}
                        {stepRecord.notes && (
                          <div>
                            <div className="text-xs font-semibold text-slate-500 mb-1">Meeting Notes / Observations:</div>
                            <div className="bg-white border border-slate-200 rounded-lg p-3 text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                              {stepRecord.notes}
                            </div>
                          </div>
                        )}
                        {stepRecord.supportActions && (
                          <div>
                            <div className="text-xs font-semibold text-slate-500 mb-1">Support Actions:</div>
                            <div className="bg-white border border-slate-200 rounded-lg p-3 text-slate-600 text-sm whitespace-pre-wrap">
                              {stepRecord.supportActions}
                            </div>
                          </div>
                        )}
                        {stepRecord.attachments.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold text-slate-500">Attachments:</span>{' '}
                            <span className="text-slate-600 text-xs">{stepRecord.attachments.map((a) => a.originalName).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!isCompleted && !isInProgress && (
                      <p className="ml-9 text-xs text-slate-400 mt-1">Not yet completed</p>
                    )}
                    {isInProgress && (
                      <p className="ml-9 text-xs text-blue-600 mt-1 font-medium">In progress</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Concerns */}
          {(prob?.concerns.length ?? 0) > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Early Concerns Pathway</h2>
              <div className="space-y-3">
                {prob!.concerns.map((c) => (
                  <div key={c.id} className={`rounded-xl border p-4 text-sm ${c.status === 'resolved' ? 'border-slate-200 bg-slate-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-700">Triggered at Step {c.triggerStep}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'resolved' ? 'bg-slate-200 text-slate-600' : 'bg-red-100 text-red-700'}`}>
                        {c.status === 'resolved' ? 'Resolved' : 'Active'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs">
                      {new Date(c.triggeredAt).toLocaleDateString('en-AU')} · Triggered by: {c.triggeredBy}
                    </p>
                    {c.actionsTaken && (
                      <p className="mt-2 text-slate-600"><span className="font-medium">Actions:</span> {c.actionsTaken}</p>
                    )}
                    {c.resolution && (
                      <p className="mt-1 text-slate-600"><span className="font-medium">Resolution:</span> {c.resolution}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Final Decision */}
          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Final Decision</h2>
            {finalOutcome ? (
              <div className={`rounded-xl border p-5 ${
                finalOutcome === 'confirmed' ? 'border-emerald-200 bg-emerald-50' :
                finalOutcome === 'not_confirmed' ? 'border-red-200 bg-red-50' :
                'border-amber-200 bg-amber-50'
              }`}>
                <div className="font-semibold text-slate-800 text-lg">{OUTCOME_LABELS[finalOutcome] ?? finalOutcome}</div>
                {step6?.completedBy && (
                  <p className="text-sm text-slate-500 mt-1">
                    Decided by: {step6.completedBy}
                    {step6.completedAt && ` · ${new Date(step6.completedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </p>
                )}
                {step6?.notes && (
                  <div className="mt-3 bg-white/60 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 whitespace-pre-wrap">
                    {step6.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-5 text-slate-400 text-sm">
                Probation process not yet complete — final decision pending.
              </div>
            )}
          </section>

          {/* Signature block */}
          <section className="border-t border-slate-200 pt-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="border-b border-slate-300 mb-2 pb-8" />
                <div className="text-xs text-slate-500">Deputy Principal / Director T&L signature</div>
                <div className="text-xs text-slate-400 mt-0.5">Date: _______________</div>
              </div>
              <div>
                <div className="border-b border-slate-300 mb-2 pb-8" />
                <div className="text-xs text-slate-500">Staff member signature</div>
                <div className="text-xs text-slate-400 mt-0.5">Date: _______________</div>
              </div>
            </div>
          </section>
        </div>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 text-center">
          Trinity Anglican College · Probation Tracker · Confidential
        </div>
      </div>
    </div>
  )
}
