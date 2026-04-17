import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { surveyId, respondentName, respondentEmail, overallRating, strengths, concerns, additionalNotes } = body

    if (!surveyId || !respondentName || !overallRating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await prisma.surveyResponse.findFirst({
      where: { surveyId, respondentEmail: respondentEmail ?? '' },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 409 })
    }

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId,
        respondentName,
        respondentEmail: respondentEmail ?? '',
        overallRating,
        strengths: strengths || null,
        concerns: concerns || null,
        additionalNotes: additionalNotes || null,
      },
    })

    return NextResponse.json({ success: true, response })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
