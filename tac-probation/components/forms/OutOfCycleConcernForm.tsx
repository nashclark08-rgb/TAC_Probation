'use client'

import { useState, useTransition } from 'react'
import { initiateOutOfCycleConcern } from '@/lib/admin-actions'
import { CONCERN_TRIGGERS, SUPPORT_MEASURES } from '@/lib/constants'

interface StaffOption {
  id: string
  name: string
  probationId: string
  currentStep: number
}

export default function OutOfCycleConcernForm({ staffList }: { staffList: StaffOption[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [triggeredBy, setTriggeredBy] = useState('')
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
  const [actionsTaken, setActionsTaken] = useState('')
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([])

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId)

  const toggle = (id: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff || !triggeredBy || selectedTriggers.length === 0) return
    const fd = new FormData()
    fd.append('probationId', selectedStaff.probationId)
    fd.append('triggeredBy', triggeredBy)
    fd.append('triggerStep', String(selectedStaff.currentStep))
    selectedTriggers.forEach((t) => fd.append('triggers', t))
    fd.append('actionsTaken', actionsTaken)
    selectedMeasures.forEach((m) => fd.append('supportMeasures', m))
    startTransition(() => initiateOutOfCycleConcern(fd))
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2.5 rounded-lg hover:bg-maroon-700 transition-colors text-sm font-medium"
      >
        <span className="text-base leading-none">⚠</span>
        Initiate Early Concerns Pathway
      </button>
    )
  }

  return (
    <div className="mt-6 border border-maroon-200 rounded-xl bg-maroon-50 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold text-maroon-800">Initiate Early Concerns Pathway</h2>
          <p className="text-xs text-maroon-600 mt-0.5">
            Use this form to activate the pathway outside of a scheduled probation step. Relevant stakeholders will be notified automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-maroon-400 hover:text-maroon-600 text-lg leading-none ml-4"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Staff selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Staff Member <span className="text-maroon-500">*</span>
          </label>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400 bg-white"
          >
            <option value="">Select staff member…</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (currently at Step {s.currentStep})
              </option>
            ))}
          </select>
        </div>

        {/* Raised by */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Concern Raised By <span className="text-maroon-500">*</span>
          </label>
          <input
            type="text"
            value={triggeredBy}
            onChange={(e) => setTriggeredBy(e.target.value)}
            required
            placeholder="Name and role of supervisor raising this concern"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400"
          />
        </div>

        {/* Triggers */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Concerns Identified <span className="text-maroon-500">*</span>
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
                  onChange={() => toggle(t.id, selectedTriggers, setSelectedTriggers)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        {/* Actions taken */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Actions Taken / Context
          </label>
          <textarea
            value={actionsTaken}
            onChange={(e) => setActionsTaken(e.target.value)}
            rows={3}
            placeholder="Describe what has been discussed, attempted, or communicated with the teacher prior to this escalation…"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400"
          />
        </div>

        {/* Support measures */}
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
                  onChange={() => toggle(m.id, selectedMeasures, setSelectedMeasures)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-maroon-500">
          The Director of Teaching &amp; Learning, Dean of Studies, and Deputy Principal will be notified automatically upon submission.
        </p>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending || !selectedStaffId || !triggeredBy || selectedTriggers.length === 0}
            className="bg-maroon-600 text-white px-5 py-2.5 rounded-lg hover:bg-maroon-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isPending ? 'Submitting…' : 'Activate Early Concerns Pathway'}
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
