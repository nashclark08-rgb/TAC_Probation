'use client'

import { useState, useTransition } from 'react'
import { adminCreateStaff } from '@/lib/admin-actions'

interface Supporter {
  id: string
  name: string
  email: string
  department: string | null
}

interface Props {
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

export default function NewStaffForm({ supporters }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const validate = (fd: FormData): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!fd.get('name')) errs.name = 'Full name is required'
    const email = fd.get('email') as string
    if (!email) {
      errs.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address'
    }
    if (!fd.get('subSchool')) errs.subSchool = 'Sub-school is required'
    if (!fd.get('startDate')) errs.startDate = 'Start date is required'
    return errs
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const errs = validate(fd)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    startTransition(() => adminCreateStaff(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Teacher details */}
      <fieldset>
        <legend className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-100 w-full">
          Teacher Details
        </legend>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. Sarah Thompson"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] ${
                  errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="s.thompson@tac.qld.edu.au"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sub-School <span className="text-red-500">*</span>
              </label>
              <select
                name="subSchool"
                required
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] ${
                  errors.subSchool ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              >
                <option value="">Select…</option>
                <option value="junior">Junior School</option>
                <option value="senior">Senior School</option>
              </select>
              {errors.subSchool && <p className="text-xs text-red-600 mt-1">{errors.subSchool}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department / Stage</label>
              <input
                name="department"
                type="text"
                placeholder="e.g. Mathematics / Stage 3"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teaching Role / Classes</label>
            <textarea
              name="teachingRole"
              rows={2}
              placeholder="e.g. Mathematics Years 7–10, Extension Maths Year 10. Classes: 7M1, 8M2, 9M3, 10EXT"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              name="startDate"
              type="date"
              required
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] ${
                errors.startDate ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate}</p>}
          </div>
        </div>
      </fieldset>

      {/* Supporting staff assignment */}
      <fieldset>
        <legend className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-100 w-full">
          Assign Supporting Staff
        </legend>
        <div className="space-y-4">
          <SupporterSelect name="hodId" label="Head of Department (Steps 1 & 3 — Senior)" options={supporters.hod} hint="Required for Senior School teachers" />
          <SupporterSelect name="stageLeaderId" label="Stage Leader (Steps 1 & 3 — Junior)" options={supporters.stage_leader} hint="Required for Junior School teachers" />
          <SupporterSelect name="deanId" label="Dean of Studies (Steps 2 & 4)" options={supporters.dean_of_studies} />
          <SupporterSelect name="directorId" label="Director of Teaching & Learning (Step 5)" options={supporters.director_tl} />
          <SupporterSelect name="deputyId" label="Deputy Principal (Step 6)" options={supporters.deputy_principal} />
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
            options={supporters.academic_admin}
            hint="Will be CC'd on meeting/observation emails and will arrange meetings on behalf of supporting staff"
          />
          <SupporterSelect
            name="principalId"
            label="College Principal"
            options={supporters.principal}
            hint="Will receive the final probation report when shared"
          />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#1e3a5f] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d527d] transition-colors font-medium text-sm disabled:opacity-50"
      >
        {isPending ? 'Creating…' : 'Create Probation Record'}
      </button>
    </form>
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
  options: Supporter[]
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
