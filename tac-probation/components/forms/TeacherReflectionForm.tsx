'use client'

import { useState, useTransition } from 'react'

const REFLECTION_PROMPTS: Record<number, string[]> = {
  1: [
    'What did you find most useful from this meeting, and how are you applying the expectations shared?',
    'What questions or uncertainties do you still have about your role, classes, or the College\'s expectations?',
    'What immediate priorities have you set for yourself based on this step?',
  ],
  2: [
    'What patterns or themes did you notice in the feedback received from colleagues?',
    'Which areas of strength are you building on, and which areas are you actively developing?',
    'What specific actions are you taking in response to this early feedback?',
  ],
  3: [
    'How did the lesson you were observed reflect your current professional knowledge and practice?',
    'What aspects of content knowledge, student engagement, or classroom routines are you working to strengthen?',
    'What did you learn about your teaching from the observer\'s feedback, and what will you focus on before the next observation?',
  ],
  4: [
    'Reflect on your growth since the Step 3 observation. What evidence do you see of improvement?',
    'How have you applied feedback from previous steps to your lesson planning, classroom management, and assessment practice?',
    'What remaining development areas do you want to address before your formal progress review?',
  ],
  5: [
    'How have you grown professionally since commencing at Trinity? What evidence best demonstrates this growth?',
    'In what ways does your practice now reflect Trinity\'s Teaching and Learning philosophy and instructional approach?',
    'What professional development priorities are you carrying forward regardless of the final outcome?',
  ],
  6: [
    'Looking back across all six steps, what has been the most significant shift in your professional practice?',
    'What aspects of the support you received were most valuable, and how will you draw on them in your ongoing practice?',
    'What are your professional goals as you transition into your ongoing role at Trinity?',
  ],
}

interface Props {
  token: string
  stepId: string
  stepNumber: number
  existingReflection: string
  saveAction: (token: string, stepId: string, reflection: string) => Promise<void>
}

export default function TeacherReflectionForm({ token, stepId, stepNumber, existingReflection, saveAction }: Props) {
  const [reflection, setReflection] = useState(existingReflection)
  const [saved, setSaved] = useState(!!existingReflection)
  const [isPending, startTransition] = useTransition()

  const prompts = REFLECTION_PROMPTS[stepNumber] ?? []

  const handleSave = () => {
    if (!reflection.trim()) return
    startTransition(async () => {
      await saveAction(token, stepId, reflection)
      setSaved(true)
    })
  }

  return (
    <div className="border border-indigo-100 rounded-lg overflow-hidden mt-1">
      <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-100">
        <p className="text-xs font-semibold text-indigo-700">Your Written Reflection</p>
        <p className="text-xs text-indigo-500 mt-0.5">
          Use the prompts below to guide your reflection. Your response is saved to your record.
        </p>
      </div>
      <div className="p-3 space-y-3">
        {prompts.length > 0 && (
          <div className="bg-white border border-indigo-100 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-indigo-600 mb-1.5">Consider reflecting on:</p>
            {prompts.map((p, i) => (
              <p key={i} className="text-xs text-slate-600">· {p}</p>
            ))}
          </div>
        )}
        <textarea
          value={reflection}
          onChange={(e) => { setReflection(e.target.value); setSaved(false) }}
          rows={5}
          placeholder="Write your reflection here…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !reflection.trim()}
            className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save Reflection'}
          </button>
          {saved && (
            <span className="text-xs text-emerald-600">✓ Reflection saved</span>
          )}
        </div>
      </div>
    </div>
  )
}
