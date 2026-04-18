import Link from 'next/link'

export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1e3a5f] transition-colors mb-4 group"
    >
      <span className="text-base leading-none group-hover:-translate-x-0.5 transition-transform">←</span>
      {label}
    </Link>
  )
}
