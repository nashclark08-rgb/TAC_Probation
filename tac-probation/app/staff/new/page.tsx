import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import BackLink from '@/components/BackLink'
import NewStaffForm from '@/components/forms/NewStaffForm'

export const dynamic = 'force-dynamic'

export default async function NewStaffPage() {
  const supporters = await prisma.supportingStaff.findMany({ orderBy: [{ role: 'asc' }, { name: 'asc' }] })

  function byRole(role: string) {
    return supporters.filter((s) => s.role === role)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackLink href="/staff" label="Back to Staff" />
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Add Probationary Teacher</h1>
      <p className="text-slate-500 text-sm mb-6">
        All 6 probation steps will be created automatically. Assign supporting staff so the system knows
        who to notify and who can complete each step.
      </p>

      {supporters.length === 0 && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          No supporting staff found.{' '}
          <Link href="/admin/supporters/new" className="underline">Add supporting staff</Link> first.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <NewStaffForm
          supporters={{
            hod: byRole('hod'),
            stage_leader: byRole('stage_leader'),
            dean_of_studies: byRole('dean_of_studies'),
            director_tl: byRole('director_tl'),
            deputy_principal: byRole('deputy_principal'),
            academic_admin: byRole('academic_admin'),
            principal: byRole('principal'),
          }}
        />
      </div>
    </div>
  )
}
