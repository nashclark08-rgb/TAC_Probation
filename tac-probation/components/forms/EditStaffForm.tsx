'use client'

import { useTransition } from 'react'
import { adminUpdateStaff } from '@/lib/admin-actions'

interface Supporter { id: string; name: string; email: string; department: string | null }

interface Props {
  defaults: {
    id: string
    name: string
    email: string
    subSchool: string
    department: string
    teachingRole: string
    startDate: string
    hodId: string
    stageLeaderId: string
    deanId: string
    directorId: string
    deputyId: string
    academicAdminId: string
    principalId: string
  }
  supporters: {
    hod: Supporter[]
    stage_leader: Supporter[]
    dean_of_studies: Supporter[]
    director_tl: Supporter[]
    deputy_principal: Supporter[]
    academic_admin: Supporter[]
    principal: Supporter[]
  }
}

export default function EditStaffForm({ defaults, supporters }: Props) {
  const [isPending, startTransition] = useTransition()
  const action = adminUpdateStaff.bind(null, defaults.id)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-100 w-full">
          Teacher Details
        </legend>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input name="name" type="text" required defaultValue={defaults.name}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input name="email" type="email" required defaultValue={defaults.email}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sub-School <span className="text-red-500">*</span></label>
              <select name="subSchool" required defaultValue={defaults.subSchool}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                <option value="junior">Junior School</option>
                <option value="senior">Senior School</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department / Stage</label>
              <input name="department" type="text" defaultValue={defaults.department}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teaching Role / Classes</label>
            <textarea name="teachingRole" rows={2} defaultValue={defaults.teachingRole}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date <span className="text-red-500">*</span></label>
            <input name="startDate" type="date" required defaultValue={defaults.startDate}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-100 w-full">
          Assigned Supporting Staff
        </legend>
        <div className="space-y-4">
          <SupporterSelect name="hodId" label="Head of Department (Steps 1 & 3 — Senior)" options={supporters.hod} current={defaults.hodId} />
          <SupporterSelect name="stageLeaderId" label="Stage Leader (Steps 1 & 3 — Junior)" options={supporters.stage_leader} current={defaults.stageLeaderId} />
          <SupporterSelect name="deanId" label="Dean of Studies (Steps 2 & 4)" options={supporters.dean_of_studies} current={defaults.deanId} />
          <SupporterSelect name="directorId" label="Director of Teaching & Learning (Step 5)" options={supporters.director_tl} current={defaults.directorId} />
          <SupporterSelect name="deputyId" label="Deputy Principal (Step 6)" options={supporters.deputy_principal} current={defaults.deputyId} />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-100 w-full">
          Academic Administration (Sub School) &amp; Principal
        </legend>
        <div className="space-y-4">
          <SupporterSelect name="academicAdminId" label="Academic Administration (Sub School)" options={supporters.academic_admin} current={defaults.academicAdminId} />
          <SupporterSelect name="principalId" label="College Principal" options={supporters.principal} current={defaults.principalId} />
        </div>
      </fieldset>

      <button type="submit" disabled={isPending}
        className="w-full bg-[#1e3a5f] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d527d] transition-colors font-medium text-sm disabled:opacity-50">
        {isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}

function SupporterSelect({ name, label, options, current }: { name: string; label: string; options: Supporter[]; current: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select name={name} defaultValue={current}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
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
