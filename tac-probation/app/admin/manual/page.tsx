import Link from 'next/link'
import BackLink from '@/components/BackLink'

export const dynamic = 'force-dynamic'

export default function ManualPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackLink href="/admin" label="Back to Admin" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">User Manual</h1>
        <p className="text-slate-500 text-sm mt-1">
          A complete guide to the Trinity Anglican College Probation Tracker — navigation, automations, and email templates.
        </p>
      </div>

      {/* Table of contents */}
      <nav className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-[#1e3a5f] mb-3">Contents</h2>
        <ol className="space-y-1 text-sm text-[#1e3a5f]">
          {[
            ['1', 'Getting Started — Setup Checklist'],
            ['2', 'Navigating the System'],
            ['3', 'The 6-Step Probation Process'],
            ['4', 'Adding a New Probationary Teacher'],
            ['5', 'Completing a Step'],
            ['6', 'Automation Timeline — What Fires and When'],
            ['7', 'Automated Email Contents'],
            ['8', 'Special Pathways — Extension & Concerns'],
            ['9', 'Supporting Staff Portal'],
            ['10', 'Teacher Portal'],
          ].map(([num, title]) => (
            <li key={num}>
              <a href={`#section-${num}`} className="hover:underline">
                {num}. {title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">

        {/* Section 1 */}
        <section id="section-1">
          <SectionHeader number="1" title="Getting Started — Setup Checklist" />
          <div className="prose-sm text-slate-600 space-y-3">
            <p>Before using the tracker, complete the following in the <Link href="/admin" className="text-[#1e3a5f] underline">Admin Dashboard</Link>:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <strong>Add Supporting Staff</strong> — Go to <Link href="/admin/supporters" className="text-[#1e3a5f] underline">Admin → Supporting Staff</Link> and add the people
                who lead each probation step. At minimum you need a HoD, Dean of Studies, Director of T&amp;L, and Deputy Principal.
                Toggle <em>Admin Page Access</em> on for senior leaders who need to manage the tracker.
              </li>
              <li>
                <strong>Configure the Term Calendar</strong> — Go to <Link href="/admin/terms" className="text-[#1e3a5f] underline">Admin → Term Calendar</Link> and enter
                start and end dates for Terms 1–4 for the current and upcoming years. This allows the system to calculate target
                date windows for each step.
              </li>
              <li>
                <strong>Add Probationary Teachers</strong> — Go to <Link href="/staff/new" className="text-[#1e3a5f] underline">Staff → Add Teacher</Link> and create a record
                for each new teacher. Assign their supporting staff at this point.
              </li>
            </ol>
          </div>
        </section>

        {/* Section 2 */}
        <section id="section-2">
          <SectionHeader number="2" title="Navigating the System" />
          <div className="space-y-3">
            <NavRow href="/" label="Dashboard (Home)" description="Overview of all active probations with status at a glance." />
            <NavRow href="/staff" label="Staff List" description="Full list of all probationary teachers. Click any name to open their profile." />
            <NavRow href="/staff/new" label="Add New Teacher" description="Create a new probationary teacher record and assign supporting staff." />
            <NavRow href="/admin" label="Admin Dashboard" description="System configuration: supporting staff, term calendar, archived records." />
            <NavRow href="/admin/supporters" label="Supporting Staff" description="Add, edit, or remove supporting staff. Toggle admin access here." />
            <NavRow href="/admin/terms" label="Term Calendar" description="Configure school term dates used for step date calculations." />
            <NavRow href="/admin/manual" label="User Manual (this page)" description="This reference guide." />
            <NavRow href="/overview" label="Process Overview" description="Public-facing summary of the 6-step process and automations." />
          </div>
        </section>

        {/* Section 3 */}
        <section id="section-3">
          <SectionHeader number="3" title="The 6-Step Probation Process" />
          <div className="space-y-3">
            {STEPS_GUIDE.map((s) => (
              <div key={s.number} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {s.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{s.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{s.timing} · Led by: {s.leader}</p>
                    <p className="text-sm text-slate-600 mt-1">{s.description}</p>
                    {s.automation && (
                      <p className="text-xs text-indigo-600 mt-1 bg-indigo-50 rounded px-2 py-1">
                        Auto: {s.automation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4 */}
        <section id="section-4">
          <SectionHeader number="4" title="Adding a New Probationary Teacher" />
          <div className="space-y-2 text-sm text-slate-600">
            <StepItem n="1" text='Go to Staff → "Add Teacher" or click the green "Add Teacher" button on the Admin Dashboard.' />
            <StepItem n="2" text="Enter the teacher's full name, email, sub-school, department, teaching role, and start date." />
            <StepItem n="3" text="Assign their supporting staff: HoD, Stage Leader, Dean of Studies, Director T&L, Deputy Principal, Academic Admin, Principal." />
            <StepItem n="4" text='Click "Create Staff Record".' />
            <p className="text-slate-500 italic ml-7 text-xs">
              The system will automatically: create a 6-step probation record (Step 1 set to in-progress), send the teacher
              a welcome email with the process overview, send the teacher their portal access link, and notify each assigned
              supporter by email.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section id="section-5">
          <SectionHeader number="5" title="Completing a Step" />
          <div className="space-y-2 text-sm text-slate-600">
            <StepItem n="1" text={"Open the teacher's profile from the Staff List and click \"Complete Step\" on the current active step."} />
            <StepItem n="2" text="Complete the step form: choose an outcome, add notes and support actions." />
            <StepItem n="3" text='Click "Complete Step" to save.' />
            <p className="text-slate-500 italic ml-7 text-xs">
              The system will automatically: mark the step completed, activate the next step, and email the next step&apos;s
              leader. For Steps 3, 4, and 5, the Academic Admin (Sub School) is also CC&apos;d to assist with meeting coordination.
            </p>
            <StepItem n="4" text='To undo a completed step, open the step card and click "Reset Step". This returns it to in-progress.' />
          </div>
        </section>

        {/* Section 6 */}
        <section id="section-6">
          <SectionHeader number="6" title="Automation Timeline — What Fires and When" />
          <div className="space-y-3">
            {AUTOMATIONS.map((a, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">{a.trigger}</p>
                  <p className="text-sm text-slate-500">{a.action}</p>
                  <p className="text-xs text-indigo-600 mt-0.5">Recipients: {a.recipients}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 7 */}
        <section id="section-7">
          <SectionHeader number="7" title="Automated Email Contents" />
          <div className="space-y-4">
            {EMAILS.map((e, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-slate-800 text-sm">{e.name}</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">{e.type}</span>
                </div>
                <p className="text-xs text-slate-500 mb-2"><strong>Recipients:</strong> {e.recipients}</p>
                <p className="text-xs text-slate-500 mb-2"><strong>Subject:</strong> {e.subject}</p>
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 leading-relaxed">
                  {e.content}
                </div>
                {e.template && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded px-2 py-1">
                    Includes a template email for the leader to send directly to the teacher.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 8 */}
        <section id="section-8">
          <SectionHeader number="8" title="Special Pathways — Extension & Concerns" />
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-700 mb-2">Extending the Probation Period</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <StepItem n="1" text={"On the teacher's profile, scroll to \"Extend Probation Period\" and click \"Extend Probation Period\"."} />
                <StepItem n="2" text="Enter the reason for extension, your name and title, and optionally an expected completion date." />
                <StepItem n="3" text='Click "Confirm Extension".' />
                <p className="text-slate-500 italic ml-7 text-xs">
                  When an expected completion date is set, the system recalculates target date windows for all remaining
                  steps and displays them in amber on the timeline. The Director T&amp;L, Deputy Principal, and Dean of Studies
                  receive a notification email that includes a template letter to send to the teacher.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-700 mb-2">Early Concerns Pathway</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <StepItem n="1" text={"On the teacher's profile, scroll to \"Early Concerns Pathway\" and click \"Activate Early Concerns Pathway\"."} />
                <StepItem n="2" text="Select the concern triggers, add actions taken, and enter your name." />
                <StepItem n="3" text='Click "Activate Concerns Pathway".' />
                <p className="text-slate-500 italic ml-7 text-xs">
                  An urgent email is sent to the Director T&amp;L, Deputy Principal, and Dean of Studies. The concern record
                  can be managed from the Concerns page and resolved once the situation is addressed.
                </p>
                <StepItem n="4" text="Adding Additional Steps — Use the '+ Add Additional Step' button on the profile to insert a custom step (e.g. Step 3a) between existing steps." />
              </div>
            </div>
          </div>
        </section>

        {/* Section 9 */}
        <section id="section-9">
          <SectionHeader number="9" title="Supporting Staff Portal" />
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              Each supporting staff member receives a unique, personal portal link when they are added to the system.
              They can view the probationary teachers assigned to them, see step progress, upload observation notes,
              and mark completed steps as reviewed.
            </p>
            <p>
              Access is controlled by the <strong>Step Access Grants</strong> field on each teacher&apos;s profile
              (under Edit Record). By default, supporters can see all steps. You can restrict access to specific
              steps per role (e.g. the HoD sees only Steps 3 and 4).
            </p>
            <p>
              If a supporter is given <strong>Admin Page Access</strong> (set in their profile), an &quot;Admin Dashboard&quot;
              link will appear in the header of their portal, giving them direct access to the admin section.
            </p>
            <p className="text-xs text-slate-400">
              Portal URLs are in the format: <code className="bg-slate-100 px-1 rounded">/portal/[unique-token]</code>.
              Each token is unique per supporter — do not share tokens.
            </p>
          </div>
        </section>

        {/* Section 10 */}
        <section id="section-10">
          <SectionHeader number="10" title="Teacher Portal" />
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              Each teacher has a personal portal link at <code className="bg-slate-100 px-1 rounded">/teacher/[token]</code>.
              This is generated automatically when the teacher record is created, and sent to them by email.
            </p>
            <p>
              From the portal, teachers can: view their progress through the 6 steps, read step notes and outcomes
              entered by their leaders, write personal reflections, and formally acknowledge each completed step.
            </p>
            <p>
              If a teacher&apos;s portal link needs to be regenerated (e.g. shared accidentally), go to their profile
              and click <strong>Generate Teacher Portal</strong>.
            </p>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-400 text-center">
        Trinity Anglican College · Probation Tracker · User Manual<br />
        For technical issues, contact your system administrator.
      </div>
    </div>
  )
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-7 h-7 rounded-full bg-[#1e3a5f] text-white text-xs font-bold flex items-center justify-center shrink-0">
        {number}
      </span>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
    </div>
  )
}

function NavRow({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link href={href} className="flex items-start gap-3 bg-white rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50 transition-colors">
      <div className="flex-1 min-w-0">
        <span className="font-medium text-slate-800 text-sm">{label}</span>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <span className="text-slate-300 text-sm shrink-0">→</span>
    </Link>
  )
}

function StepItem({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      <p>{text}</p>
    </div>
  )
}

const STEPS_GUIDE = [
  {
    number: 1,
    title: 'Welcome & Expectations',
    timing: 'Term 1, Weeks 1–2',
    leader: 'Dean of Studies',
    description: 'Formal welcome meeting. The Dean of Studies outlines the probation process, college expectations, AITSL standards, and introduces the teacher to their supporting staff. Sets the foundation for the probation journey.',
    automation: 'Step 1 is activated automatically when the teacher record is created.',
  },
  {
    number: 2,
    title: 'Early Progress Review',
    timing: 'Term 1, Weeks 3–4',
    leader: 'Head of Department',
    description: 'The HoD reviews the teacher\'s initial progress. A 360° survey can be sent to colleagues at this step for confidential peer feedback. The Dean of Studies reviews and discusses the feedback with the teacher.',
    automation: 'Survey must be manually sent from the teacher\'s profile (Staff → survey page). On completion, the Director T&L is notified.',
  },
  {
    number: 3,
    title: 'Observation – Professional Knowledge',
    timing: 'Term 1, Weeks 5–10',
    leader: 'Director of Teaching & Learning',
    description: 'A formal lesson observation focused on professional knowledge, curriculum understanding, and AITSL standards alignment. The Academic Admin coordinates the meeting booking.',
    automation: 'On Step 2 completion, Director T&L is notified and Academic Admin is CC\'d for scheduling.',
  },
  {
    number: 4,
    title: 'Observation – Professional Practice',
    timing: 'Term 2, Weeks 1–5',
    leader: 'Head of Department / Stage Leader',
    description: 'A second formal observation, focusing on professional practice, classroom management, and student engagement. Academic Admin coordinates the scheduling.',
    automation: 'On Step 3 completion, the relevant leader and Academic Admin are notified.',
  },
  {
    number: 5,
    title: 'Progress Review – Formal Meeting',
    timing: 'Term 2, Weeks 6–8',
    leader: 'Deputy Principal / Dean of Studies',
    description: 'A formal progress review meeting, reviewing all observations, survey feedback, and overall professional growth. This is a key decision point ahead of the final recommendation.',
    automation: 'On Step 4 completion, the Deputy Principal and Dean of Studies are notified; Academic Admin is CC\'d for scheduling.',
  },
  {
    number: 6,
    title: 'Final Recommendation & Decision',
    timing: 'Term 2, Weeks 9–10',
    leader: 'College Principal',
    description: 'The Principal makes the final recommendation: Employment Confirmed, Probation Extended, or Not Confirmed. The decision is recorded in the system and the final report is generated.',
    automation: 'On Step 6 completion, the final report is shared with the Principal and HR. A confirmation or extension email template is provided for the leader to send to the teacher.',
  },
]

const AUTOMATIONS = [
  {
    trigger: 'Teacher record created',
    action: 'Welcome email sent to teacher with the 6-step process overview and start date. Teacher portal access email sent separately. All assigned supporters notified by email.',
    recipients: 'Teacher (welcome + portal link), all assigned supporting staff (assignment notification)',
  },
  {
    trigger: 'New supporting staff member added to the system',
    action: 'Welcome email sent to the new supporter with their personal portal link.',
    recipients: 'New supporting staff member',
  },
  {
    trigger: 'Any step completed',
    action: 'Next step activated automatically. The leader responsible for the next step is notified by email.',
    recipients: 'Next step leader (HoD, Dean, Director T&L, Deputy, or Principal depending on step)',
  },
  {
    trigger: 'Step 3, 4, or 5 activated',
    action: 'In addition to the step leader notification, the Academic Admin (Sub School) is CC\'d with a coordination email to help schedule the observation or meeting.',
    recipients: 'Step leader + Academic Admin (Sub School)',
  },
  {
    trigger: 'Step 2 — survey sent',
    action: 'Each email address in the recipients list receives a personalised survey invitation with a unique response link.',
    recipients: 'Selected colleague email addresses',
  },
  {
    trigger: 'Probation extended',
    action: 'Director T&L, Deputy Principal, and Dean of Studies receive a formal notification email. The email includes a template letter to send directly to the teacher communicating the extension.',
    recipients: 'Director T&L, Deputy Principal, Dean of Studies',
  },
  {
    trigger: 'Early concerns pathway activated',
    action: 'Urgent email sent to Director T&L, Deputy Principal, and Dean of Studies with concern details and a link to the concern record.',
    recipients: 'Director T&L, Deputy Principal, Dean of Studies',
  },
  {
    trigger: 'Step 6 completed (final decision)',
    action: 'Final report automatically shared with the College Principal and all HR contacts. For confirmed employment, a formal confirmation letter template is included. For extension, a template extension letter is provided.',
    recipients: 'College Principal, all HR staff',
  },
]

const EMAILS = [
  {
    name: 'Teacher Welcome Email',
    type: 'Auto',
    recipients: 'New probationary teacher',
    subject: 'Welcome to Trinity Anglican College – Probation Process',
    content: 'Welcomes the teacher to Trinity Anglican College. Provides a table of all 6 probation steps with titles and timing. Notes their probation start date and advises that their assigned supporting staff will be in touch. Encourages the teacher to speak with their HoD, Stage Leader, or Dean of Studies with any questions.',
    template: false,
  },
  {
    name: 'Teacher Portal Access',
    type: 'Auto',
    recipients: 'New probationary teacher',
    subject: 'Your Probation Portal Access',
    content: 'Provides the teacher with a personal link to their probation portal where they can view progress, read step outcomes, write reflections, and acknowledge completed steps. Reminds them the link is personal and should not be shared.',
    template: false,
  },
  {
    name: 'Supporter Welcome (New Addition)',
    type: 'Auto',
    recipients: 'Newly added supporting staff member',
    subject: 'Probation Tracker Access',
    content: 'Notifies the new supporter that they have been added to the Probation Tracker with their assigned role. Provides their unique portal link and advises they will receive email notifications when probationary staff are assigned to them.',
    template: false,
  },
  {
    name: 'Supporter Assignment Notification',
    type: 'Auto',
    recipients: 'Each assigned supporting staff member',
    subject: 'Probation Assignment: [Teacher Name]',
    content: 'Notifies the supporter of their assignment as [Role] for the probation process of [Teacher Name], who commenced on [date]. Provides the supporter\'s personal portal link to view the teacher\'s progress. Reminds them the portal link is personal.',
    template: false,
  },
  {
    name: 'Next Step Leader Notification',
    type: 'Auto',
    recipients: 'Leader responsible for the next step',
    subject: 'Action Required: Step [N] – [Teacher Name]',
    content: 'Notifies the leader that the previous step has been completed and their step is now active. Shows the completed step title and the new step title with timing. Provides a link to their personal portal to review the teacher\'s progress.',
    template: false,
  },
  {
    name: 'Academic Admin Coordination Email',
    type: 'Auto',
    recipients: 'Academic Admin (Sub School)',
    subject: 'Meeting Coordination – Step [N]: [Teacher Name]',
    content: 'CC\'s the Academic Admin to advise that the step leader has been notified to arrange a lesson observation or review meeting. Asks the Admin to coordinate the scheduling on behalf of the step leader and confirm the time with the teacher.',
    template: false,
  },
  {
    name: 'Survey Invitation',
    type: 'Manual (sent from survey page)',
    recipients: 'Selected colleague email addresses',
    subject: 'Feedback Request: [Teacher Name] – Early Progress Review',
    content: 'Asks the recipient to provide confidential feedback on the teacher\'s initial professional practice as part of the Step 2 Early Progress Review. Provides a unique survey link. Advises responses are confidential and visible only to the Dean of Studies.',
    template: false,
  },
  {
    name: 'Probation Extended Notification',
    type: 'Auto',
    recipients: 'Director T&L, Deputy Principal, Dean of Studies',
    subject: 'Probation Extended: [Teacher Name]',
    content: 'Formally notifies the recipients that the teacher\'s probation has been extended, effective from Step [N]. Includes the reason for extension and a link to the teacher\'s profile. States that the process will continue from that step and a revised support plan should be developed.',
    template: true,
  },
  {
    name: 'Early Concerns Pathway Alert',
    type: 'Auto',
    recipients: 'Director T&L, Deputy Principal, Dean of Studies',
    subject: 'URGENT: Early Concerns Pathway – [Teacher Name]',
    content: 'Urgent notification that the Early Concerns Pathway has been activated for the teacher at Step [N]. Lists the specific concerns identified. States that immediate action is required and provides a link to the concern record.',
    template: false,
  },
  {
    name: 'Final Report Share',
    type: 'Auto on Step 6 completion',
    recipients: 'College Principal, all HR staff',
    subject: 'Final Probation Report: [Teacher Name]',
    content: 'Shares the completed final probation report. Displays the final outcome (Employment Confirmed / Extended / Not Confirmed). For confirmed employment, includes a full draft confirmation letter to send to the teacher. For non-confirmed outcomes, directs leaders to review the full report for the recommendation details.',
    template: true,
  },
]
