export const STEPS = [
  {
    number: 1,
    title: 'Welcome & Expectations',
    timing: 'Term 1, Weeks 1–2',
    leader: 'Head of Department / Stage Leader',
    leaderRole: 'hod_stage_leader',
    aitslFocus: null,
    description:
      'Structured introduction establishing clear expectations, building relationships, and ensuring the teacher has the information, resources, and supports required for a successful start.',
    focusAreas: [
      'Welcome to department/stage and year level teams',
      'Departmental/stage expectations, communication norms, and priorities',
      'Policies, curriculum documentation, and assessment expectations',
      'Teaching load, timetable, class profiles, and initial supports',
    ],
    outcomes: ['commendation'],
    color: 'blue',
  },
  {
    number: 2,
    title: 'Early Progress Review',
    timing: 'Term 1, Weeks 3–4',
    leader: 'Dean of Studies (Sub-School)',
    leaderRole: 'dean_of_studies',
    aitslFocus: null,
    description:
      'Early, structured check-in gathering feedback on the teacher\'s initial practice and identifying any emerging concerns or confirmation of effective practice.',
    focusAreas: [
      'Survey sent to relevant curriculum leaders and/or middle leaders',
      'Collation, review, and recording of feedback',
    ],
    outcomes: ['concern', 'commendation'],
    color: 'indigo',
  },
  {
    number: 3,
    title: 'Observation – Professional Knowledge',
    timing: 'Term 1, Weeks 5–10',
    leader: 'Head of Department / Stage Leader',
    leaderRole: 'hod_stage_leader',
    aitslFocus: 'Professional Knowledge',
    aitslStandards: ['Know students and how they learn', 'Know the content and how to teach it'],
    description:
      'Early snapshot of teaching practice, classroom culture, and alignment with Trinity pedagogy.',
    focusAreas: [
      'Demonstrated content knowledge and ability to explain, model, and sequence learning effectively',
      'Understanding of students and their learning through purposeful strategies that support engagement and inclusion',
      'Establishment and consistent use of classroom routines that promote positive learning behaviour and culture',
      'Evidence of Trinity\'s instructional model and the use of evidence-based teaching practices',
    ],
    outcomes: ['concern', 'commendation'],
    color: 'violet',
  },
  {
    number: 4,
    title: 'Observation – Professional Practice',
    timing: 'Term 2, Weeks 1–5',
    leader: 'Dean of Studies (Sub-School)',
    leaderRole: 'dean_of_studies',
    aitslFocus: 'Professional Practice',
    aitslStandards: [
      'Plan for and implement effective teaching and learning',
      'Create and maintain supportive and safe learning environments',
      'Assess, provide feedback and report on student learning',
    ],
    description:
      'Formal observation evaluating the effectiveness of teaching and learning, classroom environment, and assessment practices against AITSL Professional Practice standards.',
    focusAreas: [
      'Lesson planning, structure, and delivery aligned to learning intentions and student engagement',
      'Classroom management practices that support a safe and productive learning environment',
      'Curriculum alignment and coherence between programs, teaching, and assessment',
      'Use of assessment, feedback, and reflection to inform teaching and support student progress',
    ],
    outcomes: ['concern', 'commendation'],
    color: 'purple',
  },
  {
    number: 5,
    title: 'Progress Review – Formal Meeting',
    timing: 'Term 2, Weeks 6–8',
    leader: 'Director of Teaching & Learning',
    leaderRole: 'director_tl',
    aitslFocus: null,
    description:
      'Formal review evaluating evidence of growth, consistency, and alignment with Trinity\'s Teaching and Learning philosophy, and formulating a clear recommendation to inform the final probation decision.',
    focusAreas: [
      'Evaluation of growth over time, with reference to previous feedback, observations, and support strategies',
      'Review of alignment with Trinity\'s Teaching and Learning philosophy and instructional practices',
      'Analysis of evidence demonstrating improving consistency, confidence, and effectiveness',
      'Consideration of student engagement, classroom culture, and impact on learning outcomes',
    ],
    outcomes: ['concern', 'commendation', 'additional_observation'],
    color: 'pink',
  },
  {
    number: 6,
    title: 'Final Recommendation & Decision',
    timing: 'Term 2, Weeks 9–10',
    leader: 'Deputy Principal (Sub-School)',
    leaderRole: 'deputy_principal',
    aitslFocus: null,
    description:
      'Formal communication of the final probation decision, confirming the teacher\'s ongoing pathway at the College and supporting a forward-focused transition into continued professional growth.',
    focusAreas: [
      'Communication of the final probation recommendation and decision',
      'Confirmation of entry point into Trinity Ascend: Teacher Excellence Framework',
      'Identification of professional growth priorities and potential future co-curricular contributions',
      'Reflection on the Teaching Staff Probation and Support Process',
    ],
    outcomes: ['confirmed', 'extended', 'not_confirmed'],
    color: 'emerald',
  },
]

export const CONCERN_TRIGGERS = [
  { id: 'behaviour_management', label: 'Repeated behaviour management concerns' },
  { id: 'student_parent_complaints', label: 'Student or parent complaints' },
  { id: 'pedagogical_gaps', label: 'Significant pedagogical gaps' },
  { id: 'missed_deadlines', label: 'Missed deadlines or administrative non-compliance' },
  { id: 'lack_of_responsiveness', label: 'Lack of responsiveness to coaching' },
  { id: 'low_engagement', label: 'Low engagement with Trinity expectations' },
  { id: 'wellbeing', label: 'Wellbeing concerns affecting effectiveness' },
]

export const SUPPORT_MEASURES = [
  { id: 'walkthroughs', label: 'Increased classroom walkthroughs' },
  { id: 'coaching_cycles', label: 'Directed and documented coaching cycles' },
  { id: 'weekly_checkins', label: 'Weekly check-ins' },
  { id: 'support_plan', label: 'Accelerated support plan with clear milestones' },
  { id: 'professional_development', label: 'Professional Development' },
  { id: 'learning_walks', label: 'Learning walks' },
]

export const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  extended: 'Extended',
  not_confirmed: 'Not Confirmed',
}

export const OUTCOME_LABELS: Record<string, string> = {
  concern: 'Concern – Early Concerns Pathway Initiated',
  commendation: 'Commendation – Progression Endorsed',
  additional_observation: 'Additional Observation Cycle',
  confirmed: 'Employment Confirmed',
  extended: 'Probation Extended',
  not_confirmed: 'Employment Not Confirmed',
}

export const OUTCOME_COLOURS: Record<string, string> = {
  concern: 'red',
  commendation: 'green',
  additional_observation: 'amber',
  confirmed: 'green',
  extended: 'amber',
  not_confirmed: 'red',
}

export const STEP_COLOUR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  violet: 'bg-violet-100 text-violet-800 border-violet-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  pink: 'bg-pink-100 text-pink-800 border-pink-200',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}
