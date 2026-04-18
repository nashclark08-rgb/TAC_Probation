import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { updateSupportingStaff } from '@/lib/admin-actions'
import SupporterForm from '@/components/forms/SupporterForm'
import BackLink from '@/components/BackLink'

export const dynamic = 'force-dynamic'

export default async function EditSupporterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supporter = await prisma.supportingStaff.findUnique({ where: { id } })
  if (!supporter) notFound()

  const action = async (formData: FormData) => {
    'use server'
    await updateSupportingStaff(id, formData)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackLink href="/admin/supporters" label="Back to Supporting Staff" />
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Edit Supporting Staff Member</h1>
      <SupporterForm action={action} defaultValues={supporter} />
    </div>
  )
}
