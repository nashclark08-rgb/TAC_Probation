import { createSupportingStaff } from '@/lib/admin-actions'
import SupporterForm from '@/components/forms/SupporterForm'
import BackLink from '@/components/BackLink'

export default function NewSupporterPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackLink href="/admin/supporters" label="Back to Supporting Staff" />
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Add Supporting Staff Member</h1>
      <SupporterForm action={createSupportingStaff} />
    </div>
  )
}
