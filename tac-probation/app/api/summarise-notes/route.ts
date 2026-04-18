import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { transcript, stepNumber, stepTitle } = await req.json()

  if (!transcript || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Missing transcript or API key' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are helping a school administrator summarise a probation meeting transcript.

Step ${stepNumber}: ${stepTitle}

Meeting transcript:
"""
${transcript}
"""

Please provide a structured summary in JSON with exactly these two fields:
1. "notes" - A clear, professional summary of the key discussion points, observations, strengths, and development areas discussed (3-6 sentences)
2. "supportActions" - A concise list of the specific supports, actions, or follow-up commitments agreed upon (bullet points as a single string, each on a new line starting with "• ")

Respond ONLY with valid JSON, no markdown, no explanation.`,
      },
    ],
  })

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = JSON.parse(text)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
