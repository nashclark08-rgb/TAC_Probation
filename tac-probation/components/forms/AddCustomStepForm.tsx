'use client'

import { useState } from 'react'
import { addCustomStep } from '@/lib/actions'

interface Props {
  probationId: string
  existingSteps: Array<{ stepNumber: number; customLabel: string | null; isCustom: boolean }>
}

const STEP_TITLES: Record<number, string> = {
  1: 'Welcome & Expectations',
  2: 'Early Progress Review',
  3: 'Observation – Professional Knowledge',
  4: 'Observation – Professional Practice',
  5: 'Progress Review – Formal Meeting',
  6: 'Final Recommendation & Decision',
}

export default function AddCustomStepForm({ probationId, existingSteps }: Props) {
  const [open, setOpen] = useState(false)
  const [afterStep, setAfterStep] = useState('3')
  const [customTitle, setCustomTitle] = useState('')
  const [addedBy, setAddedBy] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestedLabel = (() => {
    const count = existingSteps.filter((s) => s.isCustom && s.stepNumber === parseInt(afterStep)).length
    return String.fromCharCode(97 + count)
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTitle.trim() || !addedBy.trim()) return
    setIsPending(true)
    setError(null)
    const fd = new FormData()
    fd.append('afterStepNumber', afterStep)
    fd.append('customLabel', suggestedLabel)
    fd.append('customTitle', customTitle)
    fd.append('addedBy', addedBy)
    try {
      await addCustomStep(probationId, fd)
      setOpen(false)
      setCustomTitle('')
      setAddedBy('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add step. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm border-2 border-dashed border-[#1e3a5f]/30 text-[#1e3a5f] px-4 py-2 rounded-lg hover:bg-[#1e3a5f]/5 hover:border-[#1e3a5f]/50 transition-colors font-medium"
      >
        + Add Additional Step
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#1e3a5f] mb-0.5">Add Additional Step</h3>
        <p className="text-xs text-slate-500">
          Adds a new step between existing steps. Useful when additional observation or review is required after a concern.
          The step will be created as pending and must be manually activated.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Insert After Step</label>
        <select
          value={afterStep}
          onChange={(e) => setAfterStep(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              Step {n}: {STEP_TITLES[n]}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-1">
          New step will be labelled: <strong>Step {afterStep}{suggestedLabel}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Step Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          required
          placeholder={`e.g. Additional Observation – ${STEP_TITLES[parseInt(afterStep)]}`}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Added By <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={addedBy}
          onChange={(e) => setAddedBy(e.target.value)}
          required
          placeholder="Name and title of person authorising the additional step"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || !customTitle.trim() || !addedBy.trim()}
          className="text-sm bg-[#1e3a5f] text-white px-4 py-2 rounded-lg hover:bg-[#2d527d] transition-colors font-medium disabled:opacity-50"
        >
          {isPending ? 'Adding…' : 'Add Step'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="text-sm border border-slate-300 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
