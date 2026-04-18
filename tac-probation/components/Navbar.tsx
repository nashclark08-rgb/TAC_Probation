import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <header>
      {/* White logo bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Trinity Anglican College" width={220} height={56} priority />
          </Link>
          <span className="text-[#1e3a5f] text-sm font-semibold tracking-wide hidden sm:block">
            Probation Tracker
          </span>
        </div>
      </div>
      {/* Navy nav bar */}
      <nav className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 h-11 text-sm">
            <Link href="/" className="hover:text-[#9e1b32] transition-colors">
              Dashboard
            </Link>
            <Link href="/staff" className="hover:text-[#9e1b32] transition-colors">
              Staff
            </Link>
            <Link href="/concerns" className="hover:text-[#9e1b32] transition-colors">
              Concerns
            </Link>
            <div className="flex-1" />
            <Link
              href="/admin"
              className="border border-[#9e1b32] text-[#9e1b32] hover:bg-[#9e1b32] hover:text-white px-3 py-1 rounded-lg transition-colors font-medium"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
