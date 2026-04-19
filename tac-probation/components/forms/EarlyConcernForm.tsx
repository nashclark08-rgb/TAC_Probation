'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createEarlyConcern } from '@/lib/actions'
import { CONCERN_TRIGGERS, SUPPORT_MEASURES } from '@/lib/constants'

interface Props {
  probationId: string
  currentStep: number
}

export default function EarlyConcernForm({ probationId, currentStep }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [triggeredBy, setTriggeredBy] = useState('')
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([])
  const [actionsTaken, setActionsTaken] = useState('')

  const toggleTrigger = (id: string) =>
    setSelectedTriggers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )

  const toggleMeasure = (id: string) =>
    setSelectedMeasures((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!triggeredBy || selectedTriggers.length === 0) return

    const fd = new FormData()
    fd.append('probationId', probationId)
    fd.append('triggeredBy', triggeredBy)
    fd.append('triggerStep', String(currentStep))
    selectedTriggers.forEach((t) => fd.append('triggers', t))
    fd.append('actionsTaken', actionsTaken)
    selectedMeasures.forEach((m) => fd.append('supportMeasures', m))

    startTransition(async () => {
      await createEarlyConcern(fd)
      router.refresh()
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-maroon-600 text-white px-5 py-2.5 rounded-lg hover:bg-maroon-700 transition-colors text-sm font-medium"
      >
        Activate Early Concerns Pathway
      </button>
    )
  }

  return (
    <div className="border border-maroon-200 rounded-xl bg-maroon-50 p-5">
      <h3 className="font-semibold text-maroon-800 mb-4">Early Concerns Pathway — Record</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Concern Raised By <span className="text-maroon-500">*</span>
          </label>
          <input
            type="text"
            value={triggeredBy}
            onChange={(e) => setTriggeredBy(e.target.value)}
            required
            placeholder="Name and role"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Triggers (select all that apply) <span className="text-maroon-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CONCERN_TRIGGERS.map((t) => (
              <label
                key={t.id}
                className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer text-sm transition-all ${
                  selectedTriggers.includes(t.id)
                    ? 'border-maroon-400 bg-maroon-100 text-maroon-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 shrink-0"
                  checked={selectedTriggers.includes(t.id)}
                  onChange={() => toggleTrigger(t.id)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Support Measures to Implement
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUPPORT_MEASURES.map((m) => (
              <label
                key={m.id}
                className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer text-sm transition-all ${
                  selectedMeasures.includes(m.id)
                    ? 'border-blue-400 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 shrink-0"
                  checked={selectedMeasures.includes(m.id)}
                  onChange={() => toggleMeasure(m.id)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Immediate Actions Taken
          </label>
          <textarea
            value={actionsTaken}
            onChange={(e) => setActionsTaken(e.target.value)}
            rows={3}
            placeholder="Describe actions taken (Deputy Principal/HR notified, Director T&L involved, etc.)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending || !triggeredBy || selectedTriggers.length === 0}
            className="bg-maroon-600 text-white px-5 py-2.5 rounded-lg hover:bg-maroon-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isPending ? 'Recording...' : 'Record Concern'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="border border-slate-300 text-slate-600 px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
