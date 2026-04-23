'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { completeStep, createEarlyConcern } from '@/lib/actions'
import { OUTCOME_LABELS, CONCERN_TRIGGERS, SUPPORT_MEASURES } from '@/lib/constants'

interface StepDef {
  number: number
  title: string
  aitslFocus?: string | null
  focusAreas: string[]
}

interface Props {
  stepId: string
  probationId: string
  stepNumber: number
  staffId: string
  possibleOutcomes: string[]
  existingData: {
    outcome: string
    completedBy: string
    notes: string
    supportActions: string
    formData: string
  }
  isCompleted: boolean
  stepDef: StepDef
}

// Step-specific prompts
const NOTES_PROMPTS: Record<number, string> = {
  1: 'Summarise what was covered — expectations communicated, resources provided, questions raised, tone of the meeting, and the teacher\'s initial impressions and readiness...',
  2: 'Summarise key themes from the survey feedback — areas of strength noted by colleagues, any emerging patterns or concerns, and the overall picture of early practice...',
  3: 'Describe what was observed — content knowledge, explanation and sequencing of learning, student engagement, classroom routines, and alignment with Trinity\'s instructional model...',
  4: 'Describe what was observed — lesson planning and delivery, classroom management, learning environment, assessment practices, and student progress and engagement...',
  5: 'Summarise the formal review discussion — growth demonstrated since Step 1, evidence of improvement, alignment with Trinity\'s T&L philosophy, and the recommendation discussed...',
  6: 'Record the final probation decision, rationale, the teacher\'s response, and their agreed entry point into the Trinity Ascend: Teacher Excellence Framework...',
}

const SUPPORT_PROMPTS: Record<number, string> = {
  1: 'List resources provided, follow-up commitments made, and any specific supports arranged for the teacher\'s first weeks (e.g. mentor meetings, curriculum access, observation visits)...',
  2: 'Document any agreed follow-up conversations, coaching suggestions, areas flagged for close monitoring before Step 3, or resources recommended...',
  3: 'List specific coaching feedback provided, strategies recommended for improvement, and agreed focus areas to address before the Step 4 observation...',
  4: 'Document feedback given to the teacher, professional growth actions agreed upon, and any specific recommendations to carry into the Step 5 formal review...',
  5: 'Document the agreed recommendation, professional growth priorities identified, and any support strategies to continue or adjust before the final decision...',
  6: 'List professional growth priorities, any co-curricular contributions identified, and transition arrangements into ongoing employment or next steps...',
}

const PRE_OBS_FIELDS = [
  { key: 'lessonFocus', label: 'Lesson Focus', placeholder: 'What is the focus of this lesson?' },
  { key: 'classContext', label: 'Context of the Class', placeholder: 'Describe the class — year level, ability range, class dynamics...' },
  { key: 'observationFocus', label: 'Observation Focus (AITSL Standards)', placeholder: 'Which AITSL standards or practice areas will this observation focus on?' },
  { key: 'lessonStructure', label: 'Lesson Structure', placeholder: 'Outline the planned lesson structure and sequence...' },
  { key: 'anticipatedChallenges', label: 'Anticipated Challenges', placeholder: 'Any anticipated challenges or areas the teacher wants specific feedback on?' },
]

const POST_OBS_FIELDS = [
  { key: 'teacherReflection', label: 'Teacher Reflection', placeholder: 'How does the teacher feel the lesson went overall?' },
  { key: 'studentLearning', label: 'Evidence of Student Learning', placeholder: 'What evidence of student learning was observed during the lesson?' },
  { key: 'observationFeedback', label: 'Observation Focus Feedback', placeholder: 'Feedback on the agreed AITSL observation focus areas...' },
  { key: 'keyStrengths', label: 'Key Strengths', placeholder: 'Key strengths demonstrated in this lesson...' },
  { key: 'nextSteps', label: 'Agreed Next Steps', placeholder: 'Agreed next steps and areas for development before the next observation...' },
]

// Browser speech recognition types
interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}
interface ISpeechRecognitionResult {
  isFinal: boolean
  [index: number]: { transcript: string }
}
interface ISpeechRecognitionEvent {
  resultIndex: number
  results: ISpeechRecognitionResult[] & { length: number }
}
interface ISpeechRecognitionErrorEvent {
  error: string
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

export default function StepCompletionForm({
  stepId,
  probationId,
  stepNumber,
  staffId,
  possibleOutcomes,
  existingData,
  isCompleted,
  stepDef,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [outcome, setOutcome] = useState(existingData.outcome)
  const [completedBy, setCompletedBy] = useState(existingData.completedBy)
  const [notes, setNotes] = useState(existingData.notes)
  const [supportActions, setSupportActions] = useState(existingData.supportActions)

  // Observation ratings (steps 3 & 4) — formData may be legacy flat or new nested format
  const parsedForm = (() => {
    if (!existingData.formData) return null
    try { return JSON.parse(existingData.formData) } catch { return null }
  })()
  const isNestedForm = parsedForm && typeof parsedForm.ratings === 'object'

  const [ratings, setRatings] = useState<Record<string, string>>(
    isNestedForm ? parsedForm.ratings : (parsedForm ?? {})
  )
  const [preObs, setPreObs] = useState<Record<string, string>>(
    isNestedForm ? (parsedForm.pre ?? {}) : {}
  )
  const [postObs, setPostObs] = useState<Record<string, string>>(
    isNestedForm ? (parsedForm.post ?? {}) : {}
  )
  const [isObsAssisting, setIsObsAssisting] = useState(false)

  // Early Concerns inline fields
  const [concernTriggers, setConcernTriggers] = useState<string[]>([])
  const [concernActions, setConcernActions] = useState('')
  const [concernMeasures, setConcernMeasures] = useState<string[]>([])

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSummarising, setIsSummarising] = useState(false)
  const [recordingError, setRecordingError] = useState('')
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const fullTranscriptRef = useRef('')

  const isObservation = stepNumber === 3 || stepNumber === 4
  const showConcernPanel = outcome === 'concern' && !isCompleted

  useEffect(() => {
    return () => { recognitionRef.current?.stop() }
  }, [])

  const startRecording = () => {
    const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRec) {
      setRecordingError('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    setRecordingError('')
    fullTranscriptRef.current = ''
    setTranscript('')

    const recognition = new SpeechRec()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-AU'

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }
      if (final) fullTranscriptRef.current += final
      setTranscript(fullTranscriptRef.current + interim)
    }

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech') {
        setRecordingError(`Recording error: ${event.error}`)
        setIsRecording(false)
      }
    }

    recognition.onend = () => {
      if (isRecording) recognition.start()
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  const stopAndSummarise = async () => {
    recognitionRef.current?.stop()
    setIsRecording(false)

    const finalText = fullTranscriptRef.current.trim()
    if (!finalText) {
      setRecordingError('No speech was detected. Please try again.')
      return
    }

    setIsSummarising(true)
    try {
      const res = await fetch('/api/summarise-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: finalText, stepNumber, stepTitle: stepDef.title }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.notes) setNotes(data.notes)
        if (data.supportActions) setSupportActions(data.supportActions)
        setTranscript('')
      } else {
        setRecordingError('AI summarisation failed. The transcript has been kept — please summarise manually.')
        setNotes(finalText)
      }
    } catch {
      setRecordingError('Could not reach AI service. The transcript has been kept.')
      setNotes(finalText)
    }
    setIsSummarising(false)
  }

  const cancelRecording = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
    setTranscript('')
    fullTranscriptRef.current = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!outcome || !completedBy) return

    startTransition(async () => {
      await completeStep(stepId, probationId, stepNumber, {
        outcome,
        completedBy,
        notes,
        supportActions,
        formData: isObservation
          ? JSON.stringify({ ratings, pre: preObs, post: postObs })
          : undefined,
      })

      // If concern outcome, also create the Early Concern record
      if (outcome === 'concern' && concernTriggers.length > 0) {
        const fd = new FormData()
        fd.append('probationId', probationId)
        fd.append('triggeredBy', completedBy)
        fd.append('triggerStep', String(stepNumber))
        concernTriggers.forEach((t) => fd.append('triggers', t))
        fd.append('actionsTaken', concernActions)
        concernMeasures.forEach((m) => fd.append('supportMeasures', m))
        await createEarlyConcern(fd)
      }

      router.push(`/staff/${staffId}`)
      router.refresh()
    })
  }

  const outcomeColours: Record<string, string> = {
    concern: 'border-maroon-400 bg-maroon-50 text-maroon-700',
    commendation: 'border-emerald-400 bg-emerald-50 text-emerald-700',
    additional_observation: 'border-amber-400 bg-amber-50 text-amber-700',
    confirmed: 'border-emerald-400 bg-emerald-50 text-emerald-700',
    extended: 'border-amber-400 bg-amber-50 text-amber-700',
    not_confirmed: 'border-maroon-400 bg-maroon-50 text-maroon-700',
  }

  const ratingOptions = ['Outstanding', 'Proficient', 'Developing', 'Unsatisfactory']

  const obsAiAssist = async (phase: 'pre' | 'post') => {
    setIsObsAssisting(true)
    try {
      const res = await fetch('/api/summarise-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: notes || supportActions || `Step ${stepNumber}: ${stepDef.title}`,
          stepNumber,
          stepTitle: stepDef.title,
          mode: phase === 'pre' ? 'pre_observation' : 'post_observation',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (phase === 'pre' && data.pre) setPreObs(data.pre)
        if (phase === 'post' && data.post) setPostObs(data.post)
      }
    } catch { /* silent */ }
    setIsObsAssisting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Pre-Observation Discussion (Steps 3 & 4) */}
      {isObservation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-blue-800">Pre-Observation Discussion</h3>
              <p className="text-xs text-blue-600 mt-0.5">Complete before the observation visit</p>
            </div>
            {!isCompleted && (
              <button type="button" onClick={() => obsAiAssist('pre')} disabled={isObsAssisting}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                {isObsAssisting ? 'Generating…' : '✦ AI Assist'}
              </button>
            )}
          </div>
          {PRE_OBS_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-blue-800 mb-1">{f.label}</label>
              <textarea
                value={preObs[f.key] ?? ''}
                onChange={(e) => setPreObs((p) => ({ ...p, [f.key]: e.target.value }))}
                disabled={isCompleted}
                rows={2}
                placeholder={f.placeholder}
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-blue-50/50 bg-white"
              />
            </div>
          ))}
        </div>
      )}

      {/* Observation Ratings (Steps 3 & 4) */}
      {isObservation && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Observation Ratings</h3>
          {stepDef.focusAreas.map((area, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 mb-2 font-medium">{area}</p>
              <div className="flex gap-2 flex-wrap">
                {ratingOptions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={isCompleted}
                    onClick={() => setRatings((prev) => ({ ...prev, [idx]: r }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      ratings[idx] === r
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400'
                    } ${isCompleted ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {ratings[idx] && (
                <p className="text-xs text-slate-500 mt-1">Selected: {ratings[idx]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post-Observation Discussion (Steps 3 & 4) */}
      {isObservation && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-emerald-800">Post-Observation Discussion</h3>
              <p className="text-xs text-emerald-600 mt-0.5">Complete after the observation visit</p>
            </div>
            {!isCompleted && (
              <button type="button" onClick={() => obsAiAssist('post')} disabled={isObsAssisting}
                className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {isObsAssisting ? 'Generating…' : '✦ AI Assist'}
              </button>
            )}
          </div>
          {POST_OBS_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-emerald-800 mb-1">{f.label}</label>
              <textarea
                value={postObs[f.key] ?? ''}
                onChange={(e) => setPostObs((p) => ({ ...p, [f.key]: e.target.value }))}
                disabled={isCompleted}
                rows={2}
                placeholder={f.placeholder}
                className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-emerald-50/50 bg-white"
              />
            </div>
          ))}
        </div>
      )}

      {/* Meeting Recorder */}
      {!isCompleted && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="mb-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Meeting Recorder</p>
                <p className="text-xs text-slate-400 mt-0.5">Record the meeting — AI will summarise key points into the fields below. Chrome/Edge only.</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {!isRecording && !isSummarising && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center gap-1.5 text-xs bg-[#1e3a5f] text-white px-3 py-2 rounded-lg hover:bg-[#2d527d] transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    Record
                  </button>
                )}
                {isRecording && (
                  <>
                    <button
                      type="button"
                      onClick={stopAndSummarise}
                      className="text-xs bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Stop &amp; Summarise
                    </button>
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="text-xs border border-slate-300 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {isSummarising && (
                  <span className="text-xs text-slate-500 px-3 py-2">Summarising with AI…</span>
                )}
              </div>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
              <strong>Privacy note:</strong> The meeting is not recorded or stored. Speech is transcribed locally in your browser and only the text transcript is briefly sent to AI to generate a summary — no audio ever leaves your device.
            </p>
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
              <span className="text-xs text-red-600 font-medium">Recording in progress</span>
            </div>
          )}

          {transcript && (
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-500 max-h-28 overflow-y-auto">
              {transcript}
            </div>
          )}

          {recordingError && (
            <p className="text-xs text-red-600 mt-2">{recordingError}</p>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {stepNumber === 2 ? 'Feedback Summary'
            : stepNumber === 3 || stepNumber === 4 ? 'Observation Notes & Feedback'
            : stepNumber === 5 ? 'Review Discussion Notes'
            : stepNumber === 6 ? 'Final Decision Notes'
            : 'Meeting Notes'}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isCompleted}
          rows={5}
          placeholder={NOTES_PROMPTS[stepNumber] ?? 'Record key discussion points, strengths, and development areas...'}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>

      {/* Support Actions */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Identified Supports / Actions
        </label>
        <textarea
          value={supportActions}
          onChange={(e) => setSupportActions(e.target.value)}
          disabled={isCompleted}
          rows={3}
          placeholder={SUPPORT_PROMPTS[stepNumber] ?? 'Document any supports identified or actions agreed upon...'}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>

      {/* Completed By */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Completed By <span className="text-slate-400">*</span>
        </label>
        <input
          type="text"
          value={completedBy}
          onChange={(e) => setCompletedBy(e.target.value)}
          disabled={isCompleted}
          required
          placeholder="Name and role of person completing this step"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>

      {/* Outcome */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Outcome <span className="text-slate-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {possibleOutcomes.map((o) => (
            <button
              key={o}
              type="button"
              disabled={isCompleted}
              onClick={() => setOutcome(o)}
              className={`text-sm px-4 py-3 rounded-lg border-2 text-left transition-all font-medium ${
                outcome === o
                  ? outcomeColours[o] ?? 'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f]'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              } ${isCompleted ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
            >
              {OUTCOME_LABELS[o] ?? o}
            </button>
          ))}
        </div>
      </div>

      {/* Early Concerns Inline Panel */}
      {showConcernPanel && (
        <div className="bg-maroon-50 border border-maroon-200 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-maroon-800 text-sm mb-1">Early Concerns Plan</h3>
            <p className="text-xs text-maroon-600">
              Complete the details below — the concern will be registered and relevant staff notified automatically when you submit.
            </p>
          </div>

          {/* Triggers */}
          <div>
            <label className="block text-sm font-medium text-maroon-800 mb-2">Concerns Identified <span className="text-maroon-500">*</span></label>
            <div className="space-y-2">
              {CONCERN_TRIGGERS.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm text-maroon-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={concernTriggers.includes(t.id)}
                    onChange={(e) => {
                      setConcernTriggers((prev) =>
                        e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id)
                      )
                    }}
                    className="rounded border-maroon-300 accent-maroon-600"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {/* Actions Taken */}
          <div>
            <label className="block text-sm font-medium text-maroon-800 mb-1">Actions Taken / Context</label>
            <textarea
              value={concernActions}
              onChange={(e) => setConcernActions(e.target.value)}
              rows={3}
              placeholder="Describe what has already been discussed, attempted, or communicated with the teacher regarding these concerns..."
              className="w-full border border-maroon-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400 bg-white"
            />
          </div>

          {/* Support Measures */}
          <div>
            <label className="block text-sm font-medium text-maroon-800 mb-2">Support Measures to Implement</label>
            <div className="space-y-2">
              {SUPPORT_MEASURES.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm text-maroon-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={concernMeasures.includes(m.id)}
                    onChange={(e) => {
                      setConcernMeasures((prev) =>
                        e.target.checked ? [...prev, m.id] : prev.filter((x) => x !== m.id)
                      )
                    }}
                    className="rounded border-maroon-300 accent-maroon-600"
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-maroon-500">
            The Director of Teaching &amp; Learning, Dean of Studies, Deputy Principal, and HR will be notified automatically.
          </p>
        </div>
      )}

      {!isCompleted && (
        <button
          type="submit"
          disabled={isPending || !outcome || !completedBy || (outcome === 'concern' && concernTriggers.length === 0)}
          className="w-full bg-[#1e3a5f] text-white py-3 px-4 rounded-lg hover:bg-[#2d527d] transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving...' : outcome === 'concern' ? 'Complete Step & Register Concern' : 'Complete Step'}
        </button>
      )}

      {outcome === 'concern' && !isCompleted && concernTriggers.length === 0 && (
        <p className="text-xs text-red-500 text-center -mt-3">Please select at least one concern above before submitting.</p>
      )}

      {isCompleted && (
        <div className="text-center text-sm text-slate-500 py-2">
          This step has been completed and is locked for editing.
        </div>
      )}
    </form>
  )
}
