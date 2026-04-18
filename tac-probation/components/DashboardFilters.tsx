'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function DashboardFilters({
  years,
}: {
  years: number[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const school = searchParams.get('school') ?? 'all'
  const status = searchParams.get('status') ?? 'all'
  const year = searchParams.get('year') ?? 'all'

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`/?${params.toString()}`)
    },
    [router, searchParams]
  )

  const hasFilters = school !== 'all' || status !== 'all' || year !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs font-medium text-slate-500 shrink-0">Filter:</span>

      <select
        value={school}
        onChange={(e) => update('school', e.target.value)}
        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
      >
        <option value="all">All Schools</option>
        <option value="junior">Junior School</option>
        <option value="senior">Senior School</option>
      </select>

      <select
        value={status}
        onChange={(e) => update('status', e.target.value)}
        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="extended">Extended</option>
        <option value="not_confirmed">Not Confirmed</option>
      </select>

      {years.length > 1 && (
        <select
          value={year}
          onChange={(e) => update('year', e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
        >
          <option value="all">All Years</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      )}

      {hasFilters && (
        <button
          onClick={() => router.push('/')}
          className="text-xs text-slate-400 hover:text-slate-600 underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}
