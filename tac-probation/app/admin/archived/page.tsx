import { prisma } from '@/lib/prisma'
import { restoreStaff } from '@/lib/actions'
import BackLink from '@/components/BackLink'

export const dynamic = 'force-dynamic'

export default async function ArchivedStaffPage() {
  const archived = await prisma.staff.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: 'desc' },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackLink href="/admin" label="Back to Admin" />
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Archived Staff</h1>
      <p className="text-slate-500 text-sm mb-6">
        Staff records removed from active lists. Restore to make them visible again.
      </p>

      {archived.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
          No archived staff members.
        </div>
      ) : (
        <div className="space-y-3">
          {archived.map((member) => (
            <div key={member.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{member.name}</p>
                <p className="text-sm text-slate-500">
                  {member.email} · {member.subSchool === 'junior' ? 'Junior School' : 'Senior School'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Archived: {member.deletedAt ? new Date(member.deletedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </p>
              </div>
              <form action={restoreStaff.bind(null, member.id)}>
                <button
                  type="submit"
                  className="text-sm border border-[#1e3a5f] text-[#1e3a5f] px-3 py-1.5 rounded-lg hover:bg-[#1e3a5f] hover:text-white transition-colors"
                >
                  Restore
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
