'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  surveyId: string
  email: string
}

const RATINGS = ['Highly Effective', 'Effective', 'Developing', 'Concern']

export default function SurveyResponseForm({ surveyId, email }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [rating, setRating] = useState('')
  const [strengths, setStrengths] = useState('')
  const [concerns, setConcerns] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !rating) return

    startTransition(async () => {
      const res = await fetch('/api/survey-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId, respondentName: name, respondentEmail: email, overallRating: rating, strengths, concerns, additionalNotes: notes }),
      })
      if (res.ok) {
        setSubmitted(true)
        router.refresh()
      }
    })
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">✓</div>
        <h2 className="font-semibold text-slate-800 mb-2">Thank you</h2>
        <p className="text-slate-500 text-sm">Your feedback has been submitted successfully.</p>
      </div>
    )
  }

  const ratingColours: Record<string, string> = {
    'Highly Effective': 'border-emerald-400 bg-emerald-50 text-emerald-800',
    'Effective': 'border-blue-400 bg-blue-50 text-blue-800',
    'Developing': 'border-amber-400 bg-amber-50 text-amber-800',
    'Concern': 'border-red-400 bg-red-50 text-red-800',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Your Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Full name"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Overall Rating of Initial Practice <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRating(r)}
              className={`text-sm px-4 py-3 rounded-lg border-2 text-left transition-all font-medium ${
                rating === r
                  ? ratingColours[r]
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Observed Strengths
        </label>
        <textarea
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          rows={3}
          placeholder="Describe any strengths you have observed in this teacher's initial practice..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Areas for Development or Concern
        </label>
        <textarea
          value={concerns}
          onChange={(e) => setConcerns(e.target.value)}
          rows={3}
          placeholder="Describe any areas for development or concerns you have observed..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any other observations or comments..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !name || !rating}
        className="w-full bg-[#1e3a5f] text-white py-3 rounded-lg hover:bg-[#2d527d] transition-colors font-medium text-sm disabled:opacity-50"
      >
        {isPending ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  )
}
