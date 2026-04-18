import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { STEPS, OUTCOME_LABELS } from '@/lib/constants'
import { acknowledgeStepAsTeacher } from '@/lib/actions'

export const dynamic = 'force-dynamic'

export default async function TeacherPortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const staff = await prisma.staff.findUnique({
    where: { teacherToken: token },
    include: {
      probation: {
        include: {
          steps: { orderBy: { stepNumber: 'asc' } },
          concerns: { where: { status: 'active' } },
        },
      },
      hod: true,
      stageLeader: true,
      dean: true,
      director: true,
      deputy: true,
    },
  })

  if (!staff || !staff.probation) notFound()

  const prob = staff.probation
  const completedSteps = prob.steps.filter((s) => s.status === 'completed')
  const currentStep = prob.steps.find((s) => s.status === 'in_progress')
  const currentStepDef = currentStep ? STEPS.find((s) => s.number === currentStep.stepNumber) : null

  const statusLabels: Record<string, string> = {
    active: 'Active',
    completed: 'Confirmed',
    extended: 'Extended',
    not_confirmed: 'Not Confirmed',
  }
  const statusColours: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    extended: 'bg-amber-100 text-amber-800',
    not_confirmed: 'bg-red-100 text-red-800',
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white rounded-xl p-6 mb-6">
          <h1 className="text-xl font-bold">Trinity Anglican College</h1>
          <p className="text-slate-300 text-sm mt-1">Probation Tracker — Teacher Portal</p>
          <div className="mt-4 pt-4 border-t border-white/20 flex items-start justify-between">
            <div>
              <p className="font-semibold text-lg">{staff.name}</p>
              <p className="text-slate-300 text-sm">
                {staff.subSchool === 'junior' ? 'Junior School' : 'Senior School'}
                {staff.department ? ` · ${staff.department}` : ''}
              </p>
              <p className="text-slate-300 text-sm">
                Started: {new Date(staff.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColours[prob.status] ?? 'bg-white/20 text-white'}`}>
              {statusLabels[prob.status] ?? prob.status}
            </span>
          </div>
        </div>

        {/* Active concerns notice */}
        {(prob.concerns?.length ?? 0) > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
            <p className="font-semibold mb-1">Early Concerns Pathway Active</p>
            <p>Your probation has entered the Early Concerns Pathway. Your Dean of Studies and relevant leaders will be in contact to discuss a support plan.</p>
          </div>
        )}

        {/* Progress overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
            <span>Your Progress</span>
            <span>{completedSteps.length} of 6 steps completed</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[#1e3a5f] rounded-full transition-all"
              style={{ width: `${(completedSteps.length / 6) * 100}%` }}
            />
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((stepDef) => {
              const stepRecord = prob.steps.find((s) => s.stepNumber === stepDef.number)
              const status = stepRecord?.status ?? 'pending'
              return (
                <div
                  key={stepDef.number}
                  title={stepDef.title}
                  className={`flex-1 h-1.5 rounded-full ${
                    status === 'completed' ? 'bg-emerald-400' : status === 'in_progress' ? 'bg-[#1e3a5f]' : 'bg-slate-200'
                  }`}
                />
              )
            })}
          </div>
          {currentStepDef && (
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-800">
              <span className="font-medium">Current step:</span> Step {currentStepDef.number} – {currentStepDef.title}
              <span className="text-blue-500 text-xs ml-2">· {currentStepDef.timing}</span>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide px-1">
            Probation Steps
          </h2>
          {STEPS.map((stepDef) => {
            const stepRecord = prob.steps.find((s) => s.stepNumber === stepDef.number)
            const isCompleted = stepRecord?.status === 'completed'
            const isInProgress = stepRecord?.status === 'in_progress'
            const ackAction = acknowledgeStepAsTeacher.bind(null, token, stepRecord?.id ?? '')

            return (
              <div
                key={stepDef.number}
                className={`bg-white rounded-xl border p-5 ${
                  isInProgress ? 'border-[#1e3a5f] ring-1 ring-[#1e3a5f]/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-400 text-white'
                        : isInProgress
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? '✓' : stepDef.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 text-sm">{stepDef.title}</p>
                      {isInProgress && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Current</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{stepDef.timing} · {stepDef.leader}</p>

                    {isCompleted && stepRecord && (
                      <div className="mt-3 space-y-2">
                        {stepRecord.outcome && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">Outcome:</span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {OUTCOME_LABELS[stepRecord.outcome] ?? stepRecord.outcome}
                            </span>
                          </div>
                        )}
                        {stepRecord.completedBy && (
                          <p className="text-xs text-slate-500">
                            Completed by: {stepRecord.completedBy} ·{' '}
                            {stepRecord.completedAt
                              ? new Date(stepRecord.completedAt).toLocaleDateString('en-AU')
                              : ''}
                          </p>
                        )}
                        {stepRecord.notes && (
                          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                            <p className="font-medium text-slate-500 mb-1">Feedback / Notes</p>
                            <p className="whitespace-pre-wrap">{stepRecord.notes}</p>
                          </div>
                        )}
                        {stepRecord.supportActions && (
                          <div className="bg-blue-50 rounded-lg p-3 text-xs text-slate-600">
                            <p className="font-medium text-blue-600 mb-1">Agreed Actions & Supports</p>
                            <p className="whitespace-pre-wrap">{stepRecord.supportActions}</p>
                          </div>
                        )}

                        {/* Acknowledge section */}
                        {!stepRecord.teacherAcknowledgedAt ? (
                          <form action={ackAction}>
                            <button
                              type="submit"
                              className="mt-2 text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                            >
                              ✓ I acknowledge this feedback
                            </button>
                            <p className="text-xs text-slate-400 mt-1">
                              By clicking this, you confirm you have read and understood the feedback for this step.
                            </p>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2 mt-2 text-xs text-emerald-600">
                            <span>✓ Acknowledged</span>
                            <span className="text-slate-400">
                              {new Date(stepRecord.teacherAcknowledgedAt).toLocaleDateString('en-AU')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Trinity Anglican College · Probation Tracker<br />
          This portal is personal to you — please do not share this link.
        </p>
      </div>
    </div>
  )
}
