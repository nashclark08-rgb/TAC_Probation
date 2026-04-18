import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { adminCreateStaff } from '@/lib/admin-actions'

export const dynamic = 'force-dynamic'

export default async function NewStaffPage() {
  const supporters = await prisma.supportingStaff.findMany({ orderBy: [{ role: 'asc' }, { name: 'asc' }] })

  function byRole(role: string) {
    return supporters.filter((s) => s.role === role)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-sm text-slate-500 mb-2">
        <Link href="/staff" className="hover:text-[#1e3a5f]">Staff</Link> / Add New Teacher
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Add Probationary Teacher</h1>
      <p className="text-slate-500 text-sm mb-6">
        All 6 probation steps will be created automatically. Assign supporting staff so the system knows
        who to notify and who can complete each step.
      </p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <form action={adminCreateStaff} className="space-y-5">
          {/* Teacher details */}
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-100 w-full">
              Teacher Details
            </legend>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input name="name" type="text" required placeholder="e.g. Sarah Thompson" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input name="email" type="email" required placeholder="s.thompson@tac.qld.edu.au" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sub-School <span className="text-red-500">*</span></label>
                  <select name="subSchool" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                    <option value="">Select...</option>
                    <option value="junior">Junior School</option>
                    <option value="senior">Senior School</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department / Stage</label>
                  <input name="department" type="text" placeholder="e.g. Mathematics / Stage 3" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teaching Role / Classes</label>
                <textarea name="teachingRole" rows={2} placeholder="e.g. Mathematics Years 7–10, Extension Maths Year 10. Classes: 7M1, 8M2, 9M3, 10EXT" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                <input name="startDate" type="date" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
            </div>
          </fieldset>

          {/* Supporting staff assignment */}
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-100 w-full">
              Assign Supporting Staff
            </legend>
            {supporters.length === 0 && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                No supporting staff found.{' '}
                <Link href="/admin/supporters/new" className="underline">Add supporting staff</Link> first.
              </div>
            )}
            <div className="space-y-4">
              <SupporterSelect
                name="hodId"
                label="Head of Department (Steps 1 & 3 — Senior)"
                options={byRole('hod')}
                hint="Required for Senior School teachers"
              />
              <SupporterSelect
                name="stageLeaderId"
                label="Stage Leader (Steps 1 & 3 — Junior)"
                options={byRole('stage_leader')}
                hint="Required for Junior School teachers"
              />
              <SupporterSelect
                name="deanId"
                label="Dean of Studies (Steps 2 & 4)"
                options={byRole('dean_of_studies')}
              />
              <SupporterSelect
                name="directorId"
                label="Director of Teaching & Learning (Step 5)"
                options={byRole('director_tl')}
              />
              <SupporterSelect
                name="deputyId"
                label="Deputy Principal (Step 6)"
                options={byRole('deputy_principal')}
              />
            </div>
          </fieldset>

          {/* Academic Admin & Principal */}
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-100 w-full">
              Sub School Academic Admin &amp; Principal
            </legend>
            <div className="space-y-4">
              <SupporterSelect
                name="academicAdminId"
                label="Sub School Academic Admin"
                options={byRole('academic_admin')}
                hint="Will be CC'd on meeting/observation emails and will arrange meetings on behalf of supporting staff"
              />
              <SupporterSelect
                name="principalId"
                label="College Principal"
                options={byRole('principal')}
                hint="Will receive the final probation report when shared"
              />
            </div>
          </fieldset>

          <button
            type="submit"
            className="w-full bg-[#1e3a5f] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d527d] transition-colors font-medium text-sm"
          >
            Create Probation Record
          </button>
        </form>
      </div>
    </div>
  )
}

function SupporterSelect({
  name,
  label,
  options,
  hint,
}: {
  name: string
  label: string
  options: { id: string; name: string; email: string; department: string | null }[]
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-1">{hint}</p>}
      <select
        name={name}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
      >
        <option value="">— Not assigned —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}{o.department ? ` (${o.department})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
