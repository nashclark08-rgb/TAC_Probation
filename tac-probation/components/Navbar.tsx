import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-[#1e3a5f] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="flex flex-col leading-tight">
              <span className="text-[#c9a84c] font-bold text-sm tracking-widest uppercase">
                Trinity Anglican College
              </span>
              <span className="text-white text-xs tracking-wide">
                Teaching Staff Probation &amp; PDI Framework
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-[#c9a84c] transition-colors">
              Dashboard
            </Link>
            <Link href="/staff" className="hover:text-[#c9a84c] transition-colors">
              Staff
            </Link>
            <Link href="/staff/new" className="hover:text-[#c9a84c] transition-colors">
              + Add Staff
            </Link>
            <Link href="/concerns" className="hover:text-[#c9a84c] transition-colors">
              Concerns
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
