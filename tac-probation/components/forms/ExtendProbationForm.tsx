'use client'

import { useState, useTransition } from 'react'
import { extendProbation } from '@/lib/actions'

interface Props {
  probationId: string
  currentStep: number
}

export default function ExtendProbationForm({ probationId, currentStep }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [extendedBy, setExtendedBy] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || !extendedBy.trim()) return
    const fd = new FormData()
    fd.append('reason', reason)
    fd.append('extendedBy', extendedBy)
    fd.append('fromStep', String(currentStep))
    startTransition(() => extendProbation(probationId, fd))
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm border-2 border-amber-400 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors font-medium"
      >
        Extend Probation Period
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-amber-800 mb-0.5">Extend Probation Period</h3>
        <p className="text-xs text-amber-600">
          This will set the probation status to Extended from Step {currentStep} and notify the Director of Teaching & Learning,
          Deputy Principal, and Dean of Studies. They will receive a template email to send to the staff member.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-800 mb-1">
          Reason for Extension <span className="text-amber-600">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
          placeholder="Describe the reasons for the probation extension and the areas requiring further development..."
          className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-800 mb-1">
          Extended By <span className="text-amber-600">*</span>
        </label>
        <input
          type="text"
          value={extendedBy}
          onChange={(e) => setExtendedBy(e.target.value)}
          required
          placeholder="Name and title of person authorising the extension"
          className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || !reason.trim() || !extendedBy.trim()}
          className="text-sm bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50"
        >
          {isPending ? 'Extending…' : 'Confirm Extension'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm border border-slate-300 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
