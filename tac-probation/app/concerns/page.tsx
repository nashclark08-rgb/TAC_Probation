import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CONCERN_TRIGGERS, SUPPORT_MEASURES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function ConcernsPage() {
  const concerns = await prisma.earlyConcern.findMany({
    include: {
      probation: {
        include: { staff: true },
      },
    },
    orderBy: { triggeredAt: 'desc' },
  })

  const active = concerns.filter((c) => c.status === 'active')
  const resolved = concerns.filter((c) => c.status === 'resolved')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Early Concerns Pathway</h1>
        <p className="text-slate-500 text-sm mt-1">
          Structured response to concerns regarding professional practice, conduct, or capacity
        </p>
      </div>

      {/* Active Concerns */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-slate-700">Active Concerns</h2>
          {active.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {active.length}
            </span>
          )}
        </div>

        {active.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center text-emerald-700">
            No active concerns at this time.
          </div>
        ) : (
          <div className="space-y-4">
            {active.map((c) => (
              <ConcernCard key={c.id} concern={c} />
            ))}
          </div>
        )}
      </div>

      {/* Resolved Concerns */}
      {resolved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Resolved Concerns</h2>
          <div className="space-y-3">
            {resolved.map((c) => (
              <ConcernCard key={c.id} concern={c} resolved />
            ))}
          </div>
        </div>
      )}

      {concerns.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          No concerns have been recorded yet.
        </div>
      )}

      {/* Information Box */}
      <div className="mt-8 bg-[#1e3a5f] text-white rounded-xl p-6">
        <h2 className="font-semibold text-[#9e1b32] mb-3">About the Early Concerns Pathway</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div>
            <h3 className="text-white font-medium mb-2">Triggers for Activation</h3>
            <ul className="space-y-1">
              {CONCERN_TRIGGERS.map((t) => (
                <li key={t.id}>· {t.label}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">Possible Support Measures</h3>
            <ul className="space-y-1">
              {SUPPORT_MEASURES.map((m) => (
                <li key={m.id}>· {m.label}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConcernCard({
  concern,
  resolved = false,
}: {
  concern: {
    id: string
    triggeredAt: Date
    triggeredBy: string
    triggerStep: number
    triggers: string
    status: string
    actionsTaken: string | null
    supportMeasures: string | null
    resolution: string | null
    resolvedAt: Date | null
    probation: {
      staff: { id: string; name: string; email: string }
    }
  }
  resolved?: boolean
}) {
  const staff = concern.probation.staff
  const triggers = JSON.parse(concern.triggers) as string[]
  const supportMeasures = concern.supportMeasures
    ? (JSON.parse(concern.supportMeasures) as string[])
    : []
  const triggerLabels = triggers.map(
    (id) => CONCERN_TRIGGERS.find((t) => t.id === id)?.label ?? id
  )
  const measureLabels = supportMeasures.map(
    (id) => SUPPORT_MEASURES.find((m) => m.id === id)?.label ?? id
  )

  return (
    <div
      className={`bg-white rounded-xl border p-5 ${
        resolved ? 'border-slate-200 opacity-80' : 'border-red-200 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/staff/${staff.id}`}
              className="font-semibold text-slate-800 hover:text-[#1e3a5f] underline"
            >
              {staff.name}
            </Link>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                resolved
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {resolved ? 'Resolved' : 'Active'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Triggered at Step {concern.triggerStep} by {concern.triggeredBy} on{' '}
            {new Date(concern.triggeredAt).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        {resolved && concern.resolvedAt && (
          <div className="text-xs text-slate-400 text-right">
            Resolved:{' '}
            {new Date(concern.resolvedAt).toLocaleDateString('en-AU')}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Triggers</p>
          <ul className="space-y-0.5">
            {triggerLabels.map((t, i) => (
              <li key={i} className="text-slate-700">
                · {t}
              </li>
            ))}
          </ul>
        </div>
        {measureLabels.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
              Support Measures
            </p>
            <ul className="space-y-0.5">
              {measureLabels.map((m, i) => (
                <li key={i} className="text-slate-700">
                  · {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {concern.actionsTaken && (
        <div className="mt-3 text-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Actions Taken</p>
          <p className="text-slate-700">{concern.actionsTaken}</p>
        </div>
      )}

      {concern.resolution && (
        <div className="mt-3 text-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Resolution</p>
          <p className="text-slate-700">{concern.resolution}</p>
        </div>
      )}

      {!resolved && (
        <div className="mt-4">
          <Link
            href={`/concerns/${concern.id}`}
            className="text-sm bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Manage Concern
          </Link>
        </div>
      )}
    </div>
  )
}
