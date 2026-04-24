import Link from 'next/link'

const ROLES = [
  { value: 'hod', label: 'Head of Department' },
  { value: 'stage_leader', label: 'Stage Leader' },
  { value: 'dean_of_studies', label: 'Dean of Studies' },
  { value: 'director_tl', label: 'Director of Teaching & Learning' },
  { value: 'deputy_principal', label: 'Deputy Principal' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'curriculum_leader', label: 'Curriculum Leader' },
  { value: 'middle_leader', label: 'Middle Leader' },
  { value: 'academic_admin', label: 'Academic Administration (Sub School)' },
  { value: 'principal', label: 'College Principal' },
]

interface DefaultValues {
  name?: string
  email?: string
  role?: string
  subSchool?: string | null
  department?: string | null
  canAccessAdmin?: boolean
}

export default function SupporterForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => Promise<void>
  defaultValues?: DefaultValues
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <form action={action} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={defaultValues?.name ?? ''}
              placeholder="e.g. Dr James Whitfield"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={defaultValues?.email ?? ''}
              placeholder="j.whitfield@tac.qld.edu.au"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            required
            defaultValue={defaultValues?.role ?? ''}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          >
            <option value="">Select role...</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sub-School</label>
            <select
              name="subSchool"
              defaultValue={defaultValues?.subSchool ?? ''}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            >
              <option value="">Both / Not specified</option>
              <option value="junior">Junior School</option>
              <option value="senior">Senior School</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department / Stage</label>
            <input
              name="department"
              type="text"
              defaultValue={defaultValues?.department ?? ''}
              placeholder="e.g. Mathematics"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
        </div>

        {/* Admin access toggle */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="canAccessAdmin"
              defaultChecked={defaultValues?.canAccessAdmin ?? false}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
            />
            <div>
              <span className="block text-sm font-medium text-slate-700">Admin Page Access</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Grants this person a link to the Admin section from their supporting staff portal.
                Use for senior leaders such as the Principal, Deputy Principal, or Director of T&amp;L.
              </span>
            </div>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-[#1e3a5f] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d527d] transition-colors font-medium text-sm"
          >
            Save
          </button>
          <Link
            href="/admin/supporters"
            className="border border-slate-300 text-slate-600 py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors text-sm text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
