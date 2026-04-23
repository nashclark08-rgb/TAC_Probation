import Link from 'next/link'

export default function OverviewPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Probation Process Overview</h1>
        <p className="text-slate-500 mt-2 text-sm">
          A guide to the Trinity Anglican College Teaching Staff Probation and Support Process, including the 6-step flowchart and built-in automations.
        </p>
      </div>

      {/* Introduction */}
      <div className="bg-[#1e3a5f] text-white rounded-xl p-6 mb-8">
        <h2 className="font-semibold text-lg mb-2">About This Process</h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          The Trinity Anglican College Probation and Support Process is a structured, six-step program designed to support new teaching staff in their first two terms at the College. It provides clear expectations, regular feedback, formal observations aligned to the AITSL Professional Standards, and a structured pathway to employment confirmation. The Probation Tracker automates communications, tracks progress, and provides each stakeholder with a secure personal portal.
        </p>
      </div>

      {/* 6-step flowchart */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">The 6-Step Flowchart</h2>
        <div className="space-y-4">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${step.colour}`}>
                  {step.number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-800">Step {step.number}: {step.title}</h3>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{step.timing}</span>
                    {step.aitsl && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                        AITSL: {step.aitsl}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Led by: <span className="font-medium text-slate-700">{step.leader}</span></p>
                  <p className="text-sm text-slate-600 mb-3">{step.description}</p>

                  {step.automations.length > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1.5">⚡ Automations</p>
                      <ul className="space-y-1">
                        {step.automations.map((a, i) => (
                          <li key={i} className="text-xs text-blue-700">· {a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="text-xs text-slate-500 font-medium">Possible outcomes:</span>
                    {step.outcomes.map((o) => (
                      <span key={o} className={`text-xs px-2 py-0.5 rounded-full font-medium ${outcomeColour(o)}`}>{o}</span>
                    ))}
                  </div>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex justify-start ml-5 mt-3">
                  <div className="w-0.5 h-4 bg-slate-200 ml-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Early Concerns Pathway */}
      <div className="bg-maroon-50 border border-maroon-200 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-maroon-800 mb-2">Early Concerns Pathway</h2>
        <p className="text-sm text-maroon-700 mb-4">
          The Early Concerns Pathway can be activated at any point during the probation process — either as an outcome of a scheduled step or independently by a supervisor. It is used when concerns arise regarding professional practice, conduct, wellbeing, or capacity to meet College expectations.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold text-maroon-700 uppercase mb-2">Activation Triggers</p>
            <ul className="text-xs text-maroon-700 space-y-1">
              <li>· Repeated behaviour management concerns</li>
              <li>· Student or parent complaints</li>
              <li>· Significant pedagogical gaps</li>
              <li>· Missed deadlines or non-compliance</li>
              <li>· Lack of responsiveness to coaching</li>
              <li>· Wellbeing concerns affecting effectiveness</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-maroon-700 uppercase mb-2">Stakeholders Notified Automatically</p>
            <ul className="text-xs text-maroon-700 space-y-1">
              <li>· Director of Teaching &amp; Learning</li>
              <li>· Dean of Studies (Sub-School)</li>
              <li>· Deputy Principal (Sub-School)</li>
            </ul>
          </div>
        </div>
        <Link href="/concerns" className="text-sm text-maroon-700 underline font-medium">View Early Concerns →</Link>
      </div>

      {/* Automations summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">All Automations at a Glance</h2>
        <div className="space-y-3">
          {AUTOMATIONS.map((a, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-blue-500 mt-0.5 shrink-0 text-base">⚡</span>
              <div>
                <span className="font-medium text-slate-800">{a.trigger}: </span>
                <span className="text-slate-600">{a.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portals */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-2">Supporting Staff Portal</h3>
          <p className="text-sm text-slate-500 mb-3">Each supporting staff member receives a unique, secure portal link. They can view assigned staff progress, upload observation notes, and mark steps as reviewed.</p>
          <p className="text-xs text-slate-400">Access: <code className="bg-slate-50 px-1 rounded">/portal/[token]</code></p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-2">Teacher Portal</h3>
          <p className="text-sm text-slate-500 mb-3">Each probationary teacher receives a personal portal link automatically when their record is created. They can view feedback, acknowledge steps, and write reflections.</p>
          <p className="text-xs text-slate-400">Access: <code className="bg-slate-50 px-1 rounded">/teacher/[token]</code></p>
        </div>
      </div>
    </div>
  )
}

const STEPS = [
  {
    number: 1,
    title: 'Welcome & Expectations',
    timing: 'Term 1, Weeks 1–2',
    leader: 'Head of Department / Stage Leader',
    aitsl: null,
    colour: 'bg-blue-500',
    description: 'Structured introduction establishing clear expectations, building relationships, and ensuring the teacher has the information, resources, and supports required for a successful start.',
    outcomes: ['Commendation'],
    automations: [
      'Welcome email sent to the new teacher with probation process overview and portal link',
      'Assignment emails sent to all assigned supporting staff with their portal link',
      'Academic Administration CC\'d when meeting is due',
    ],
  },
  {
    number: 2,
    title: 'Early Progress Review',
    timing: 'Term 1, Weeks 3–4',
    leader: 'Dean of Studies (Sub-School)',
    aitsl: null,
    colour: 'bg-indigo-500',
    description: 'Early, structured check-in gathering feedback from curriculum and middle leaders on the teacher\'s initial practice.',
    outcomes: ['Commendation', 'Concern'],
    automations: [
      'Survey emails sent to selected curriculum and middle leaders with a unique feedback link',
      'Responses collected and displayed in the admin portal',
    ],
  },
  {
    number: 3,
    title: 'Observation – Professional Knowledge',
    timing: 'Term 1, Weeks 5–10',
    leader: 'Head of Department / Stage Leader',
    aitsl: 'Professional Knowledge',
    colour: 'bg-violet-500',
    description: 'Formal classroom observation focusing on AITSL Professional Knowledge standards — content knowledge, student understanding, and evidence-based teaching practices.',
    outcomes: ['Commendation', 'Concern'],
    automations: [
      'Notification email sent to HoD/Stage Leader when step becomes active',
      'Academic Administration CC\'d to arrange the observation visit',
      'Observation notes and ratings stored against the step record',
    ],
  },
  {
    number: 4,
    title: 'Observation – Professional Practice',
    timing: 'Term 2, Weeks 1–5',
    leader: 'Dean of Studies (Sub-School)',
    aitsl: 'Professional Practice',
    colour: 'bg-purple-500',
    description: 'Formal observation evaluating lesson delivery, classroom environment, assessment practices, and student engagement against AITSL Professional Practice standards.',
    outcomes: ['Commendation', 'Concern'],
    automations: [
      'Notification email sent to Dean of Studies when step becomes active',
      'Academic Administration CC\'d to arrange the observation visit',
    ],
  },
  {
    number: 5,
    title: 'Progress Review – Formal Meeting',
    timing: 'Term 2, Weeks 6–8',
    leader: 'Director of Teaching & Learning',
    aitsl: null,
    colour: 'bg-pink-500',
    description: 'Formal review evaluating evidence of growth, consistency, and alignment with Trinity\'s Teaching and Learning philosophy. Formulates a clear recommendation for the final decision.',
    outcomes: ['Commendation', 'Concern', 'Additional Observation'],
    automations: [
      'Notification email sent to Director of T&L when step becomes active',
      'Academic Administration CC\'d to coordinate the formal meeting',
    ],
  },
  {
    number: 6,
    title: 'Final Recommendation & Decision',
    timing: 'Term 2, Weeks 9–10',
    leader: 'Deputy Principal (Sub-School)',
    aitsl: null,
    colour: 'bg-emerald-500',
    description: 'Formal communication of the final probation decision. Confirms the teacher\'s ongoing pathway at the College and transitions them into the Trinity Ascend framework.',
    outcomes: ['Employment Confirmed', 'Probation Extended', 'Not Confirmed'],
    automations: [
      'Final report shared with HR contacts and the College Principal automatically when published',
      'Probation status updated in the system to reflect the final outcome',
    ],
  },
]

const AUTOMATIONS = [
  { trigger: 'Staff record created', action: 'Welcome email + Teacher Portal access email sent to the new teacher; assignment notification emails sent to all assigned supporting staff.' },
  { trigger: 'Step completed', action: 'Email notification sent to the leader responsible for the next step; Academic Administration CC\'d for meeting/observation steps.' },
  { trigger: 'Step 2 survey sent', action: 'Individual survey invite emails with unique links sent to each selected curriculum/middle leader.' },
  { trigger: 'Early Concerns activated', action: 'URGENT notification emails sent immediately to the Director of T&L, Dean of Studies, and Deputy Principal.' },
  { trigger: 'Final report shared', action: 'Report access emails sent to all HR contacts and the College Principal.' },
  { trigger: 'Daily cron (weekdays)', action: 'Overdue and upcoming step reminders sent to the relevant step leader.' },
  { trigger: 'Weekly cron (Monday)', action: 'Weekly digest email sent to each Academic Administrator listing all active probation steps requiring attention.' },
]

function outcomeColour(o: string): string {
  if (o === 'Employment Confirmed' || o === 'Commendation') return 'bg-emerald-100 text-emerald-700'
  if (o === 'Concern' || o === 'Not Confirmed') return 'bg-maroon-100 text-maroon-700'
  return 'bg-amber-100 text-amber-700'
}
