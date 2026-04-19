import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CONCERN_TRIGGERS, SUPPORT_MEASURES } from '@/lib/constants'
import ResolveConcernForm from '@/components/forms/ResolveConcernForm'
import BackLink from '@/components/BackLink'

export const dynamic = 'force-dynamic'

export default async function ConcernDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const concern = await prisma.earlyConcern.findUnique({
    where: { id },
    include: {
      probation: {
        include: { staff: true },
      },
    },
  })

  if (!concern) notFound()

  const staff = concern.probation.staff
  const triggers = JSON.parse(concern.triggers) as string[]
  const supportMeasures = concern.supportMeasures
    ? (JSON.parse(concern.supportMeasures) as string[])
    : []

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackLink href="/concerns" label="Back to Concerns" />

      {/* Header */}
      <div
        className={`rounded-xl p-6 mb-6 ${
          concern.status === 'active'
            ? 'bg-maroon-600 text-white'
            : 'bg-slate-600 text-white'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium mb-1 opacity-80">Early Concerns Pathway</p>
            <h1 className="text-2xl font-bold">{staff.name}</h1>
            <p className="text-sm opacity-80 mt-1">
              Step {concern.triggerStep} · Triggered by {concern.triggeredBy} ·{' '}
              {new Date(concern.triggeredAt).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
              concern.status === 'active'
                ? 'bg-white text-maroon-700'
                : 'bg-white/20 text-white'
            }`}
          >
            {concern.status === 'active' ? 'Active' : 'Resolved'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-3">Triggers Identified</h2>
          <ul className="space-y-2">
            {triggers.map((t, i) => {
              const label = CONCERN_TRIGGERS.find((ct) => ct.id === t)?.label ?? t
              return (
                <li key={i} className="text-sm text-slate-700 flex gap-2">
                  <span className="text-maroon-500 font-bold shrink-0">·</span>
                  {label}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-3">Support Measures</h2>
          {supportMeasures.length === 0 ? (
            <p className="text-sm text-slate-400">No support measures recorded.</p>
          ) : (
            <ul className="space-y-2">
              {supportMeasures.map((m, i) => {
                const label = SUPPORT_MEASURES.find((sm) => sm.id === m)?.label ?? m
                return (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-blue-500 font-bold shrink-0">·</span>
                    {label}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {concern.actionsTaken && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="font-semibold text-slate-700 mb-2">Immediate Actions Taken</h2>
          <p className="text-sm text-slate-600">{concern.actionsTaken}</p>
        </div>
      )}

      {/* Involvement */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-amber-800 mb-2">Required Stakeholder Involvement</h2>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>· Director of Teaching &amp; Learning — immediate intervention</li>
          <li>· Dean of Studies (Sub-School) — immediate intervention</li>
          <li>· Deputy Principal (Sub-School) — notified</li>
          <li>· Human Resources — notified</li>
        </ul>
      </div>

      {/* Resolve form */}
      {concern.status === 'active' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Resolve Concern</h2>
          <ResolveConcernForm concernId={id} staffId={staff.id} />
        </div>
      )}

      {concern.status === 'resolved' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <h2 className="font-semibold text-emerald-800 mb-1">Concern Resolved</h2>
          <p className="text-sm text-emerald-700">
            Resolved on:{' '}
            {concern.resolvedAt
              ? new Date(concern.resolvedAt).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'N/A'}
          </p>
          {concern.resolution && (
            <p className="text-sm text-emerald-700 mt-2">{concern.resolution}</p>
          )}
        </div>
      )}
    </div>
  )
}
