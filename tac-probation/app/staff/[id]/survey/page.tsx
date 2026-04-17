import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import SurveyManager from '@/components/forms/SurveyManager'

export const dynamic = 'force-dynamic'

export default async function StaffSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const member = await prisma.staff.findUnique({
    where: { id },
    include: {
      dean: true,
      probation: {
        include: {
          steps: {
            where: { stepNumber: 2 },
            include: {
              survey: { include: { responses: true } },
            },
          },
        },
      },
    },
  })

  if (!member || !member.probation) notFound()

  const step2 = member.probation.steps[0]
  if (!step2) notFound()

  const allSupporters = await prisma.supportingStaff.findMany({
    where: { role: { in: ['curriculum_leader', 'middle_leader', 'dean_of_studies', 'hod', 'stage_leader'] } },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-sm text-slate-500 mb-4">
        <Link href="/staff" className="hover:text-[#1e3a5f]">Staff</Link> /{' '}
        <Link href={`/staff/${id}`} className="hover:text-[#1e3a5f]">{member.name}</Link> / Early Progress Survey
      </div>

      <div className="bg-[#1e3a5f] text-white rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold">{member.name}</h1>
        <p className="text-slate-300 text-sm mt-1">Step 2: Early Progress Review — Survey Management</p>
        <p className="text-slate-400 text-xs mt-1">Led by: Dean of Studies (Sub-School) · Term 1, Weeks 3–4</p>
      </div>

      <SurveyManager
        stepId={step2.id}
        staffName={member.name}
        deanId={member.deanId ?? ''}
        existingSurvey={step2.survey}
        allSupporters={allSupporters}
      />
    </div>
  )
}
