import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { deleteSupportingStaff } from '@/lib/admin-actions'

const ROLE_LABELS: Record<string, string> = {
  deputy_principal: 'Deputy Principal (Sub-School)',
  director_tl: 'Director of Teaching & Learning',
  dean_of_studies: 'Dean of Studies (Sub-School)',
  hod: 'Head of Department',
  stage_leader: 'Stage Leader',
  hr: 'Human Resources',
  curriculum_leader: 'Curriculum Leader',
  middle_leader: 'Middle Leader',
}

export default async function SupportersPage() {
  const supporters = await prisma.supportingStaff.findMany({ orderBy: [{ role: 'asc' }, { name: 'asc' }] })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-slate-500 mb-1"><Link href="/admin" className="hover:text-[#1e3a5f]">Admin</Link> / Supporting Staff</div>
          <h1 className="text-2xl font-bold text-slate-800">Supporting Staff</h1>
        </div>
        <Link href="/admin/supporters/new" className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg hover:bg-[#2d527d] transition-colors text-sm">
          + Add Staff Member
        </Link>
      </div>

      {supporters.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 mb-3">No supporting staff added yet.</p>
          <Link href="/admin/supporters/new" className="text-[#1e3a5f] underline text-sm">Add your first supporting staff member</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {supporters.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="font-medium text-slate-800">{s.name}</div>
                <div className="text-sm text-slate-500">{ROLE_LABELS[s.role] ?? s.role}</div>
                <div className="text-xs text-slate-400">
                  {s.email}
                  {s.subSchool ? ` · ${s.subSchool === 'junior' ? 'Junior School' : s.subSchool === 'senior' ? 'Senior School' : 'Both Schools'}` : ''}
                  {s.department ? ` · ${s.department}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin/supporters/${s.id}`} className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  Edit
                </Link>
                <form action={async () => { 'use server'; await deleteSupportingStaff(s.id) }}>
                  <button type="submit" className="text-sm text-red-600 hover:text-red-700 px-2 py-1.5">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
