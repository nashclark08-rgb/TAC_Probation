import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { STEPS } from '@/lib/constants'
import StepCompletionForm from '@/components/forms/StepCompletionForm'

export const dynamic = 'force-dynamic'

export default async function StepPage({
  params,
}: {
  params: Promise<{ id: string; step: string }>
}) {
  const { id, step: stepParam } = await params
  const stepNumber = parseInt(stepParam)

  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 6) notFound()

  const member = await prisma.staff.findUnique({
    where: { id },
    include: {
      probation: {
        include: {
          steps: { orderBy: { stepNumber: 'asc' } },
        },
      },
    },
  })

  if (!member || !member.probation) notFound()

  const stepRecord = member.probation.steps.find((s) => s.stepNumber === stepNumber)
  if (!stepRecord) notFound()

  const stepDef = STEPS.find((s) => s.number === stepNumber)!

  const previousSteps = member.probation.steps
    .filter((s) => s.stepNumber < stepNumber && s.status === 'completed')
    .sort((a, b) => a.stepNumber - b.stepNumber)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 mb-4">
        <Link href="/staff" className="hover:text-[#1e3a5f]">
          Staff
        </Link>{' '}
        /
        <Link href={`/staff/${id}`} className="hover:text-[#1e3a5f] mx-1">
          {member.name}
        </Link>{' '}
        / Step {stepNumber}
      </div>

      {/* Step Header */}
      <div className="bg-[#1e3a5f] text-white rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[#9e1b32] text-sm font-medium mb-1">Step {stepDef.number}</div>
            <h1 className="text-2xl font-bold">{stepDef.title}</h1>
            <p className="text-slate-300 text-sm mt-1">
              {stepDef.timing} · Led by: {stepDef.leader}
            </p>
            {stepDef.aitslFocus && (
              <div className="mt-2 inline-block bg-white/10 text-white text-xs px-3 py-1 rounded-full">
                AITSL Focus: {stepDef.aitslFocus}
              </div>
            )}
          </div>
          <StatusChip status={stepRecord.status} />
        </div>
      </div>

      {/* Purpose & Focus Areas */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-2">Purpose</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{stepDef.description}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-2">Focus Areas</h2>
          <ul className="space-y-1.5">
            {stepDef.focusAreas.map((area, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-[#9e1b32] font-bold mt-0.5">·</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AITSL Standards */}
      {stepDef.aitslStandards && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-indigo-800 mb-2 text-sm">AITSL Standards</h2>
          <ul className="space-y-1">
            {stepDef.aitslStandards.map((s, i) => (
              <li key={i} className="text-sm text-indigo-700">
                · {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Previous Steps Summary */}
      {previousSteps.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">Previous Steps Summary</h2>
          <div className="space-y-2">
            {previousSteps.map((ps) => {
              const psDef = STEPS.find((s) => s.number === ps.stepNumber)!
              return (
                <div key={ps.id} className="text-sm flex items-start gap-3">
                  <span className="text-emerald-600 font-bold shrink-0">✓ Step {ps.stepNumber}</span>
                  <span className="text-slate-600">{psDef.title}</span>
                  {ps.outcome && (
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      {ps.outcome}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completion Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-700 mb-4">
          {stepRecord.status === 'completed' ? 'Step Record' : 'Complete This Step'}
        </h2>
        <StepCompletionForm
          stepId={stepRecord.id}
          probationId={member.probation.id}
          stepNumber={stepNumber}
          staffId={id}
          possibleOutcomes={stepDef.outcomes}
          existingData={{
            outcome: stepRecord.outcome ?? '',
            completedBy: stepRecord.completedBy ?? '',
            notes: stepRecord.notes ?? '',
            supportActions: stepRecord.supportActions ?? '',
            formData: stepRecord.formData ?? '',
          }}
          isCompleted={stepRecord.status === 'completed'}
          stepDef={stepDef}
        />
      </div>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-slate-500 text-white',
    in_progress: 'bg-amber-400 text-slate-900',
    completed: 'bg-emerald-500 text-white',
  }
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
  }
  return (
    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${map[status] ?? 'bg-slate-400 text-white'}`}>
      {labels[status] ?? status}
    </span>
  )
}
