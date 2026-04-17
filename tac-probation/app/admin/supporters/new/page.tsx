import Link from 'next/link'
import { createSupportingStaff } from '@/lib/admin-actions'
import SupporterForm from '@/components/forms/SupporterForm'

export default function NewSupporterPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-sm text-slate-500 mb-2">
        <Link href="/admin" className="hover:text-[#1e3a5f]">Admin</Link> /{' '}
        <Link href="/admin/supporters" className="hover:text-[#1e3a5f]">Supporting Staff</Link> / New
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Add Supporting Staff Member</h1>
      <SupporterForm action={createSupportingStaff} />
    </div>
  )
}
