import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SurveyResponseForm from '@/components/forms/SurveyResponseForm'

export const dynamic = 'force-dynamic'

export default async function SurveyResponsePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string }>
}) {
  const { id } = await params
  const { email } = await searchParams

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      step: {
        include: {
          probation: {
            include: { staff: true },
          },
        },
      },
      responses: { where: { respondentEmail: email ?? '' } },
    },
  })

  if (!survey) notFound()

  const staffName = survey.step.probation.staff.name
  const alreadySubmitted = survey.responses.length > 0
  const isClosed = survey.closedAt && new Date() > new Date(survey.closedAt)

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white rounded-xl p-6 mb-6">
          <h1 className="font-bold text-xl text-[#c9a84c]">Trinity Anglican College</h1>
          <p className="text-slate-300 text-sm mt-1">Probation Tracker — Early Progress Review</p>
        </div>

        {isClosed ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-600">This survey has closed. Thank you for your participation.</p>
          </div>
        ) : alreadySubmitted ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="text-4xl mb-3">✓</div>
            <h2 className="font-semibold text-slate-800 mb-2">Response Recorded</h2>
            <p className="text-slate-500 text-sm">Your feedback has already been submitted. Thank you.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-1">Early Progress Review Feedback</h2>
            <p className="text-slate-500 text-sm mb-1">
              You are providing confidential feedback on the initial professional practice of:
            </p>
            <p className="font-bold text-slate-800 mb-4">{staffName}</p>
            <p className="text-xs text-slate-400 mb-6">
              Your responses are confidential and will only be seen by the Dean of Studies.
            </p>
            <SurveyResponseForm surveyId={id} email={email ?? ''} />
          </div>
        )}
      </div>
    </div>
  )
}
