import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [supportersCount, termsCount, staffCount] = await Promise.all([
    prisma.supportingStaff.count(),
    prisma.termCalendar.count(),
    prisma.staff.count(),
  ])

  const supporters = await prisma.supportingStaff.findMany({ orderBy: { role: 'asc' } })
  const roleGroups: Record<string, typeof supporters> = {}
  for (const s of supporters) {
    if (!roleGroups[s.role]) roleGroups[s.role] = []
    roleGroups[s.role].push(s)
  }

  const ROLE_LABELS: Record<string, string> = {
    deputy_principal: 'Deputy Principal (Sub-School)',
    director_tl: 'Director of Teaching & Learning',
    dean_of_studies: 'Dean of Studies (Sub-School)',
    hod: 'Head of Department',
    stage_leader: 'Stage Leader',
    hr: 'Human Resources',
    curriculum_leader: 'Curriculum Leader',
    middle_leader: 'Middle Leader',
    academic_admin: 'Sub School Academic Admin',
    principal: 'College Principal',
  }

  const setup = {
    supporters: supportersCount >= 3,
    terms: termsCount >= 2,
    staff: staffCount >= 1,
  }
  const allReady = Object.values(setup).every(Boolean)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Administration</h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure the probation framework — set up supporting staff, term calendar, and probationary teachers.
        </p>
      </div>

      {/* Setup status */}
      {!allReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-amber-800 mb-2">Setup Checklist</h2>
          <ul className="space-y-2 text-sm">
            <SetupItem done={setup.supporters} label="Add supporting staff (HoD, Dean, Director T&L, Deputy Principal)" href="/admin/supporters/new" />
            <SetupItem done={setup.terms} label="Configure school term calendar" href="/admin/terms" />
            <SetupItem done={setup.staff} label="Add at least one probationary staff member" href="/staff/new" />
          </ul>
        </div>
      )}

      {/* Quick nav cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <AdminCard
          title="Supporting Staff"
          description="Manage HoDs, Stage Leaders, Dean of Studies, Director T&L, Deputy Principals, and HR"
          count={supportersCount}
          href="/admin/supporters"
          buttonLabel="Manage Staff"
          colour="blue"
        />
        <AdminCard
          title="Term Calendar"
          description="Set Term 1–4 start and end dates so the system can calculate step due dates"
          count={termsCount}
          href="/admin/terms"
          buttonLabel="Configure Terms"
          colour="indigo"
        />
        <AdminCard
          title="Probationary Teachers"
          description="Add new probationary teachers with their assigned supporters and teaching roles"
          count={staffCount}
          href="/staff/new"
          buttonLabel="Add Teacher"
          colour="emerald"
        />
      </div>

      {/* Supporting staff by role */}
      {supportersCount > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Supporting Staff Directory</h2>
            <Link href="/admin/supporters/new" className="text-sm bg-[#1e3a5f] text-white px-4 py-2 rounded-lg hover:bg-[#2d527d] transition-colors">
              + Add Staff
            </Link>
          </div>
          <div className="space-y-4">
            {Object.entries(roleGroups).map(([role, people]) => (
              <div key={role}>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                  {ROLE_LABELS[role] ?? role}
                </h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {people.map((p) => (
                    <Link
                      key={p.id}
                      href={`/admin/supporters/${p.id}`}
                      className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-slate-700 text-sm">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.email}{p.department ? ` · ${p.department}` : ''}</div>
                      </div>
                      <span className="text-xs text-slate-400">Edit</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SetupItem({ done, label, href }: { done: boolean; label: string; href: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-amber-200 text-amber-700'}`}>
        {done ? '✓' : '!'}
      </span>
      {done ? (
        <span className="text-slate-600 line-through">{label}</span>
      ) : (
        <Link href={href} className="text-amber-800 underline">{label}</Link>
      )}
    </li>
  )
}

function AdminCard({ title, description, count, href, buttonLabel, colour }: {
  title: string; description: string; count: number; href: string; buttonLabel: string; colour: string
}) {
  const colours: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50',
    indigo: 'border-indigo-200 bg-indigo-50',
    emerald: 'border-emerald-200 bg-emerald-50',
  }
  return (
    <div className={`rounded-xl border p-5 ${colours[colour] ?? ''}`}>
      <div className="text-2xl font-bold text-slate-700 mb-1">{count}</div>
      <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-4">{description}</p>
      <Link href={href} className="text-sm bg-[#1e3a5f] text-white px-4 py-2 rounded-lg hover:bg-[#2d527d] transition-colors inline-block">
        {buttonLabel}
      </Link>
    </div>
  )
}
