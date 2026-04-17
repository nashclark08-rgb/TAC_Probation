'use client'

import { useState, useTransition } from 'react'
import { createAndSendSurvey } from '@/lib/admin-actions'

interface Supporter {
  id: string
  name: string
  email: string
  role: string
  department: string | null
}

interface Response {
  id: string
  respondentName: string
  respondentEmail: string
  overallRating: string
  strengths: string | null
  concerns: string | null
  additionalNotes: string | null
  submittedAt: Date
}

interface ExistingSurvey {
  id: string
  sentAt: Date | null
  closedAt: Date | null
  recipientEmails: string
  responses: Response[]
}

interface Props {
  stepId: string
  staffName: string
  deanId: string
  existingSurvey: ExistingSurvey | null
  allSupporters: Supporter[]
}

const ROLE_LABELS: Record<string, string> = {
  dean_of_studies: 'Dean of Studies',
  hod: 'Head of Department',
  stage_leader: 'Stage Leader',
  curriculum_leader: 'Curriculum Leader',
  middle_leader: 'Middle Leader',
}

const RATING_COLOURS: Record<string, string> = {
  'Highly Effective': 'bg-emerald-100 text-emerald-800',
  'Effective': 'bg-blue-100 text-blue-800',
  'Developing': 'bg-amber-100 text-amber-800',
  'Concern': 'bg-red-100 text-red-800',
}

export default function SurveyManager({
  stepId,
  staffName,
  deanId,
  existingSurvey,
  allSupporters,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (!existingSurvey) return []
    const emails = existingSurvey.recipientEmails.split(',').map((e) => e.trim())
    return allSupporters.filter((s) => emails.includes(s.email)).map((s) => s.id)
  })
  const [extraEmails, setExtraEmails] = useState('')
  const [sent, setSent] = useState(false)

  const toggleSupporter = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleSend = () => {
    const selectedEmails = allSupporters.filter((s) => selectedIds.includes(s.id)).map((s) => s.email)
    const extra = extraEmails.split(',').map((e) => e.trim()).filter(Boolean)
    const allEmails = [...new Set([...selectedEmails, ...extra])]

    const fd = new FormData()
    fd.append('stepId', stepId)
    fd.append('sentById', deanId)
    fd.append('recipientEmails', allEmails.join(','))
    fd.append('staffName', staffName)

    startTransition(async () => {
      await createAndSendSurvey(fd)
      setSent(true)
    })
  }

  const ratingCounts: Record<string, number> = {}
  if (existingSurvey) {
    for (const r of existingSurvey.responses) {
      ratingCounts[r.overallRating] = (ratingCounts[r.overallRating] ?? 0) + 1
    }
  }

  return (
    <div className="space-y-6">
      {/* Recipient selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-700 mb-1">Survey Recipients</h2>
        <p className="text-sm text-slate-500 mb-4">
          Select curriculum and middle leaders to receive the Early Progress Review survey for {staffName}.
          An email with a personalised survey link will be sent to each recipient.
        </p>

        <div className="grid md:grid-cols-2 gap-2 mb-4">
          {allSupporters.map((s) => (
            <label
              key={s.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer text-sm transition-all ${
                selectedIds.includes(s.id)
                  ? 'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f]'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 shrink-0"
                checked={selectedIds.includes(s.id)}
                onChange={() => toggleSupporter(s.id)}
              />
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs opacity-70">{ROLE_LABELS[s.role] ?? s.role}{s.department ? ` · ${s.department}` : ''}</div>
                <div className="text-xs opacity-60">{s.email}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Additional Email Addresses (comma-separated)
          </label>
          <input
            type="text"
            value={extraEmails}
            onChange={(e) => setExtraEmails(e.target.value)}
            placeholder="additional@tac.qld.edu.au, another@tac.qld.edu.au"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isPending || selectedIds.length === 0}
          className="bg-[#1e3a5f] text-white px-5 py-2.5 rounded-lg hover:bg-[#2d527d] transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isPending ? 'Sending...' : existingSurvey?.sentAt ? 'Resend / Update Recipients' : 'Send Survey'}
        </button>

        {(sent || existingSurvey?.sentAt) && (
          <p className="text-sm text-emerald-600 mt-2">
            Survey sent on {new Date(existingSurvey?.sentAt ?? new Date()).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Responses */}
      {existingSurvey && existingSurvey.responses.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">
              Responses ({existingSurvey.responses.length})
            </h2>
            <div className="flex gap-2">
              {Object.entries(ratingCounts).map(([rating, count]) => (
                <span key={rating} className={`text-xs px-2 py-1 rounded-full font-medium ${RATING_COLOURS[rating] ?? 'bg-slate-100 text-slate-700'}`}>
                  {count}× {rating}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {existingSurvey.responses.map((r) => (
              <div key={r.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{r.respondentName}</div>
                    <div className="text-xs text-slate-400">{r.respondentEmail} · {new Date(r.submittedAt).toLocaleDateString('en-AU')}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${RATING_COLOURS[r.overallRating] ?? 'bg-slate-100 text-slate-700'}`}>
                    {r.overallRating}
                  </span>
                </div>
                {r.strengths && (
                  <div className="text-sm mb-1">
                    <span className="text-slate-500 text-xs font-medium">Strengths: </span>
                    <span className="text-slate-700">{r.strengths}</span>
                  </div>
                )}
                {r.concerns && (
                  <div className="text-sm mb-1">
                    <span className="text-slate-500 text-xs font-medium">Areas for development: </span>
                    <span className="text-slate-700">{r.concerns}</span>
                  </div>
                )}
                {r.additionalNotes && (
                  <div className="text-sm">
                    <span className="text-slate-500 text-xs font-medium">Additional notes: </span>
                    <span className="text-slate-700">{r.additionalNotes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {existingSurvey && existingSurvey.responses.length === 0 && existingSurvey.sentAt && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-400 text-sm">
          Survey sent. No responses received yet.
        </div>
      )}
    </div>
  )
}
