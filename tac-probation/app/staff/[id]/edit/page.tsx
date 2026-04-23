import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BackLink from '@/components/BackLink'
import EditStaffForm from '@/components/forms/EditStaffForm'

export const dynamic = 'force-dynamic'

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [member, allSupporters] = await Promise.all([
    prisma.staff.findUnique({
      where: { id },
      include: { hod: true, stageLeader: true, dean: true, director: true, deputy: true, academicAdmin: true, principal: true },
    }),
    prisma.supportingStaff.findMany({ orderBy: [{ role: 'asc' }, { name: 'asc' }] }),
  ])

  if (!member) notFound()

  const byRole = (role: string) => allSupporters.filter((s) => s.role === role)
    .map((s) => ({ id: s.id, name: s.name, email: s.email, department: s.department }))

  const supporters = {
    hod: byRole('hod'),
    stage_leader: byRole('stage_leader'),
    dean_of_studies: byRole('dean_of_studies'),
    director_tl: byRole('director_tl'),
    deputy_principal: byRole('deputy_principal'),
    academic_admin: byRole('academic_admin'),
    principal: byRole('principal'),
  }

  const defaults = {
    id: member.id,
    name: member.name,
    email: member.email,
    subSchool: member.subSchool,
    department: member.department ?? '',
    teachingRole: member.teachingRole ?? '',
    startDate: member.startDate.toISOString().split('T')[0],
    hodId: member.hodId ?? '',
    stageLeaderId: member.stageLeaderId ?? '',
    deanId: member.deanId ?? '',
    directorId: member.directorId ?? '',
    deputyId: member.deputyId ?? '',
    academicAdminId: member.academicAdminId ?? '',
    principalId: member.principalId ?? '',
    stepAccessGrants: member.stepAccessGrants ?? '',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackLink href={`/staff/${id}`} label={`Back to ${member.name}`} />
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Edit Staff Record</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <EditStaffForm defaults={defaults} supporters={supporters} />
      </div>
    </div>
  )
}
