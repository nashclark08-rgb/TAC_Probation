import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { updateSupportingStaff } from '@/lib/admin-actions'
import SupporterForm from '@/components/forms/SupporterForm'

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
      <div className="text-sm text-slate-500 mb-2">
        <Link href="/admin" className="hover:text-[#1e3a5f]">Admin</Link> /{' '}
        <Link href="/admin/supporters" className="hover:text-[#1e3a5f]">Supporting Staff</Link> / Edit
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Edit Supporting Staff Member</h1>
      <SupporterForm action={action} defaultValues={supporter} />
    </div>
  )
}
