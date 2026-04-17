import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const stepId = formData.get('stepId') as string | null
    const uploadedBy = formData.get('uploadedBy') as string | null

    if (!file || !stepId) {
      return NextResponse.json({ error: 'Missing file or stepId' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Use PDF, JPEG, PNG, or Word documents.' },
        { status: 400 }
      )
    }

    const blob = await put(file.name, file, { access: 'public' })

    const attachment = await prisma.stepAttachment.create({
      data: {
        stepId,
        filename: blob.url,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedBy: uploadedBy ?? 'Unknown',
      },
    })

    return NextResponse.json({ success: true, attachment })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const attachment = await prisma.stepAttachment.findUnique({ where: { id } })
  if (!attachment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await del(attachment.filename)
  await prisma.stepAttachment.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
