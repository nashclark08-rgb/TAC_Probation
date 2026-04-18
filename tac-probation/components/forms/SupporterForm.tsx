import Link from 'next/link'

const ROLES = [
  { value: 'deputy_principal', label: 'Deputy Principal (Sub-School)' },
  { value: 'director_tl', label: 'Director of Teaching & Learning' },
  { value: 'dean_of_studies', label: 'Dean of Studies (Sub-School)' },
  { value: 'hod', label: 'Head of Department' },
  { value: 'stage_leader', label: 'Stage Leader' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'curriculum_leader', label: 'Curriculum Leader' },
  { value: 'middle_leader', label: 'Middle Leader' },
  { value: 'academic_admin', label: 'Sub School Academic Admin' },
  { value: 'principal', label: 'College Principal' },
]

interface DefaultValues {
  name?: string
  email?: string
  role?: string
  subSchool?: string | null
  department?: string | null
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
