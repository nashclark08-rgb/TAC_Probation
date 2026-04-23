'use client'

import { useState, useTransition } from 'react'
import { resetStep } from '@/lib/actions'

interface Props {
  stepId: string
  stepLabel: string
}

export default function ResetStepButton({ stepId, stepLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [resetBy, setResetBy] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || !resetBy.trim()) return
    const fd = new FormData()
    fd.append('reason', reason)
    fd.append('resetBy', resetBy)
    startTransition(() => resetStep(stepId, fd))
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs border border-slate-300 text-slate-500 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
        title="Reset this step to allow it to be completed again"
      >
        Reset Step
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-700">Reset {stepLabel}?</p>
      <p className="text-xs text-slate-500">
        This will unlock the step and set it back to in-progress. The outcome and completion details will be cleared.
        Notes will be preserved as a reference.
      </p>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Reset <span className="text-red-500">*</span></label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          required
          placeholder="Why is this step being reset?"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Authorised By <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={resetBy}
          onChange={(e) => setResetBy(e.target.value)}
          required
          placeholder="Name and title"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || !reason.trim() || !resetBy.trim()}
          className="text-xs bg-slate-700 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Resetting…' : 'Confirm Reset'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="text-xs border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  )
}
