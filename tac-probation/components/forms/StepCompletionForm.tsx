'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { completeStep } from '@/lib/actions'
import { OUTCOME_LABELS } from '@/lib/constants'

interface StepDef {
  number: number
  title: string
  aitslFocus?: string | null
  focusAreas: string[]
}

interface Props {
  stepId: string
  probationId: string
  stepNumber: number
  staffId: string
  possibleOutcomes: string[]
  existingData: {
    outcome: string
    completedBy: string
    notes: string
    supportActions: string
    formData: string
  }
  isCompleted: boolean
  stepDef: StepDef
}

export default function StepCompletionForm({
  stepId,
  probationId,
  stepNumber,
  staffId,
  possibleOutcomes,
  existingData,
  isCompleted,
  stepDef,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [outcome, setOutcome] = useState(existingData.outcome)
  const [completedBy, setCompletedBy] = useState(existingData.completedBy)
  const [notes, setNotes] = useState(existingData.notes)
  const [supportActions, setSupportActions] = useState(existingData.supportActions)

  // Observation-specific fields (steps 3 & 4)
  const [ratings, setRatings] = useState<Record<string, string>>(() => {
    if (existingData.formData) {
      try {
        return JSON.parse(existingData.formData)
      } catch {
        return {}
      }
    }
    return {}
  })

  const isObservation = stepNumber === 3 || stepNumber === 4

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!outcome || !completedBy) return

    startTransition(async () => {
      await completeStep(stepId, probationId, stepNumber, {
        outcome,
        completedBy,
        notes,
        supportActions,
        formData: isObservation ? JSON.stringify(ratings) : undefined,
      })
      router.push(`/staff/${staffId}`)
      router.refresh()
    })
  }

  const outcomeColours: Record<string, string> = {
    concern: 'border-red-400 bg-red-50 text-red-700',
    commendation: 'border-emerald-400 bg-emerald-50 text-emerald-700',
    additional_observation: 'border-amber-400 bg-amber-50 text-amber-700',
    confirmed: 'border-emerald-400 bg-emerald-50 text-emerald-700',
    extended: 'border-amber-400 bg-amber-50 text-amber-700',
    not_confirmed: 'border-red-400 bg-red-50 text-red-700',
  }

  const ratingOptions = ['Outstanding', 'Proficient', 'Developing', 'Unsatisfactory']

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Observation Ratings (Steps 3 & 4) */}
      {isObservation && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Observation Ratings</h3>
          {stepDef.focusAreas.map((area, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 mb-2 font-medium">{area}</p>
              <div className="flex gap-2 flex-wrap">
                {ratingOptions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={isCompleted}
                    onClick={() => setRatings((prev) => ({ ...prev, [idx]: r }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      ratings[idx] === r
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400'
                    } ${isCompleted ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {ratings[idx] && (
                <p className="text-xs text-slate-500 mt-1">Selected: {ratings[idx]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notes / Discussion Points */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {stepNumber === 2 ? 'Feedback Summary' : stepNumber >= 3 && stepNumber <= 4 ? 'Observation Notes & Feedback' : 'Key Discussion Points / Notes'}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isCompleted}
          rows={4}
          placeholder="Record key discussion points, strengths, and development areas..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>

      {/* Support Actions */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Identified Supports / Actions
        </label>
        <textarea
          value={supportActions}
          onChange={(e) => setSupportActions(e.target.value)}
          disabled={isCompleted}
          rows={3}
          placeholder="Document any supports identified or actions agreed upon..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>

      {/* Completed By */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Completed By <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={completedBy}
          onChange={(e) => setCompletedBy(e.target.value)}
          disabled={isCompleted}
          required
          placeholder="Name and role of person completing this step"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>

      {/* Outcome */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Outcome <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {possibleOutcomes.map((o) => (
            <button
              key={o}
              type="button"
              disabled={isCompleted}
              onClick={() => setOutcome(o)}
              className={`text-sm px-4 py-3 rounded-lg border-2 text-left transition-all font-medium ${
                outcome === o
                  ? outcomeColours[o] ?? 'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f]'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              } ${isCompleted ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
            >
              {OUTCOME_LABELS[o] ?? o}
            </button>
          ))}
        </div>
      </div>

      {outcome === 'concern' && !isCompleted && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <strong>Note:</strong> Selecting &ldquo;Concern&rdquo; will flag this for the Early Concerns
          Pathway. Please ensure you also complete the Early Concerns Pathway form on the staff
          detail page.
        </div>
      )}

      {!isCompleted && (
        <button
          type="submit"
          disabled={isPending || !outcome || !completedBy}
          className="w-full bg-[#1e3a5f] text-white py-3 px-4 rounded-lg hover:bg-[#2d527d] transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving...' : 'Complete Step'}
        </button>
      )}

      {isCompleted && (
        <div className="text-center text-sm text-slate-500 py-2">
          This step has been completed and is locked for editing.
        </div>
      )}
    </form>
  )
}
