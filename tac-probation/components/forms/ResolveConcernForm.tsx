'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { resolveEarlyConcern } from '@/lib/actions'

export default function ResolveConcernForm({
  concernId,
  staffId,
}: {
  concernId: string
  staffId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [resolution, setResolution] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolution.trim()) return
    startTransition(async () => {
      await resolveEarlyConcern(concernId, resolution)
      router.push(`/staff/${staffId}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Resolution Notes <span className="text-red-500">*</span>
        </label>
        <textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          required
          rows={4}
          placeholder="Describe how the concern was resolved and the outcome for the teacher..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>
      <button
        type="submit"
        disabled={isPending || !resolution.trim()}
        className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {isPending ? 'Resolving...' : 'Mark as Resolved'}
      </button>
    </form>
  )
}
