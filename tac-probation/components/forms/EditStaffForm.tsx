'use client'

import { useState, useTransition } from 'react'
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
    stepAccessGrants: string  // JSON: {"hod":[1,2,3],"dean":null,...} null=all steps
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

const ROLE_SLOTS = ['hod', 'stageLeader', 'dean', 'director', 'deputy', 'academicAdmin', 'principal'] as const
type RoleSlot = typeof ROLE_SLOTS[number]

const STEP_NUMBERS = [1, 2, 3, 4, 5, 6]

export default function EditStaffForm({ defaults, supporters }: Props) {
  const [isPending, startTransition] = useTransition()
  const action = adminUpdateStaff.bind(null, defaults.id)

  // Parse existing access grants
  const parsedGrants: Record<string, number[] | null> = (() => {
    try { return defaults.stepAccessGrants ? JSON.parse(defaults.stepAccessGrants) : {} }
    catch { return {} }
  })()

  // Step access state: per role slot, null = all steps, number[] = restricted
  const [stepAccess, setStepAccess] = useState<Record<RoleSlot, number[] | null>>({
    hod: parsedGrants.hod ?? null,
    stageLeader: parsedGrants.stageLeader ?? null,
    dean: parsedGrants.dean ?? null,
    director: parsedGrants.director ?? null,
    deputy: parsedGrants.deputy ?? null,
    academicAdmin: parsedGrants.academicAdmin ?? null,
    principal: parsedGrants.principal ?? null,
  })

  const toggleStep = (role: RoleSlot, step: number) => {
    setStepAccess((prev) => {
      const current = prev[role] ?? STEP_NUMBERS
      if (current.includes(step)) {
        const next = current.filter((s) => s !== step)
        return { ...prev, [role]: next.length === STEP_NUMBERS.length ? null : next }
      } else {
        const next = [...current, step].sort((a, b) => a - b)
        return { ...prev, [role]: next.length === STEP_NUMBERS.length ? null : next }
      }
    })
  }

  const toggleAll = (role: RoleSlot, allSelected: boolean) => {
    setStepAccess((prev) => ({ ...prev, [role]: allSelected ? null : [] }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    // Serialise step access grants
    const grants: Record<string, number[] | null> = {}
    for (const slot of ROLE_SLOTS) {
      const access = stepAccess[slot]
      if (access !== null) grants[slot] = access
    }
    const grantsJson = Object.keys(grants).length > 0 ? JSON.stringify(grants) : ''
    fd.set('stepAccessGrants', grantsJson)
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
        <legend className="text-sm font-semibold text-slate-700 mb-1 pb-1 border-b border-slate-100 w-full">
          Assigned Supporting Staff &amp; Portal Step Access
        </legend>
        <p className="text-xs text-slate-400 mb-4">
          For each assigned supporter you can restrict which steps they can view in their portal.
          Leave all steps selected (or none ticked = all) to grant full access.
        </p>
        <div className="space-y-5">
          <SupporterSelectWithAccess
            name="hodId" label="Head of Department (Steps 1 & 3 — Senior)"
            options={supporters.hod} current={defaults.hodId}
            roleSlot="hod" stepAccess={stepAccess.hod}
            onToggleStep={toggleStep} onToggleAll={toggleAll}
          />
          <SupporterSelectWithAccess
            name="stageLeaderId" label="Stage Leader (Steps 1 & 3 — Junior)"
            options={supporters.stage_leader} current={defaults.stageLeaderId}
            roleSlot="stageLeader" stepAccess={stepAccess.stageLeader}
            onToggleStep={toggleStep} onToggleAll={toggleAll}
          />
          <SupporterSelectWithAccess
            name="deanId" label="Dean of Studies (Steps 2 & 4)"
            options={supporters.dean_of_studies} current={defaults.deanId}
            roleSlot="dean" stepAccess={stepAccess.dean}
            onToggleStep={toggleStep} onToggleAll={toggleAll}
          />
          <SupporterSelectWithAccess
            name="directorId" label="Director of Teaching & Learning (Step 5)"
            options={supporters.director_tl} current={defaults.directorId}
            roleSlot="director" stepAccess={stepAccess.director}
            onToggleStep={toggleStep} onToggleAll={toggleAll}
          />
          <SupporterSelectWithAccess
            name="deputyId" label="Deputy Principal (Step 6)"
            options={supporters.deputy_principal} current={defaults.deputyId}
            roleSlot="deputy" stepAccess={stepAccess.deputy}
            onToggleStep={toggleStep} onToggleAll={toggleAll}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-100 w-full">
          Academic Administration (Sub School) &amp; Principal
        </legend>
        <div className="space-y-5">
          <SupporterSelectWithAccess
            name="academicAdminId" label="Academic Administration (Sub School)"
            options={supporters.academic_admin} current={defaults.academicAdminId}
            roleSlot="academicAdmin" stepAccess={stepAccess.academicAdmin}
            onToggleStep={toggleStep} onToggleAll={toggleAll}
          />
          <SupporterSelectWithAccess
            name="principalId" label="College Principal"
            options={supporters.principal} current={defaults.principalId}
            roleSlot="principal" stepAccess={stepAccess.principal}
            onToggleStep={toggleStep} onToggleAll={toggleAll}
          />
        </div>
      </fieldset>

      <button type="submit" disabled={isPending}
        className="w-full bg-[#1e3a5f] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d527d] transition-colors font-medium text-sm disabled:opacity-50">
        {isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}

function SupporterSelectWithAccess({
  name, label, options, current, roleSlot, stepAccess, onToggleStep, onToggleAll,
}: {
  name: string
  label: string
  options: Supporter[]
  current: string
  roleSlot: RoleSlot
  stepAccess: number[] | null
  onToggleStep: (role: RoleSlot, step: number) => void
  onToggleAll: (role: RoleSlot, allSelected: boolean) => void
}) {
  const allowedSteps = stepAccess ?? STEP_NUMBERS
  const allSelected = stepAccess === null

  return (
    <div className="space-y-2">
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
      {current && (
        <div className="ml-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-500 mb-2">Portal step visibility:</p>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => onToggleAll(roleSlot, !allSelected)}
                className="rounded"
              />
              All steps
            </label>
            <span className="text-slate-300 text-xs">|</span>
            {STEP_NUMBERS.map((n) => (
              <label key={n} className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowedSteps.includes(n)}
                  onChange={() => onToggleStep(roleSlot, n)}
                  className="rounded"
                />
                Step {n}
              </label>
            ))}
          </div>
          {!allSelected && allowedSteps.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">No steps selected — this supporter will see no steps in their portal.</p>
          )}
        </div>
      )}
    </div>
  )
}
