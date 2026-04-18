import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-[#1e3a5f] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex flex-col leading-tight">
            <span className="text-[#c9a84c] font-bold text-sm tracking-widest uppercase">
              Trinity Anglican College
            </span>
            <span className="text-white text-xs tracking-wide">
              Probation Tracker
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-[#c9a84c] transition-colors">
              Dashboard
            </Link>
            <Link href="/staff" className="hover:text-[#c9a84c] transition-colors">
              Staff
            </Link>
            <Link href="/concerns" className="hover:text-[#c9a84c] transition-colors">
              Concerns
            </Link>
            <Link
              href="/admin"
              className="border border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#1e3a5f] px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
