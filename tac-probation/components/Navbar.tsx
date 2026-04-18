import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <header>
      <nav className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20 gap-8">
            <Link href="/" className="shrink-0 py-2">
              <Image src="/logo.png" alt="Trinity Anglican College" width={150} height={60} style={{ objectFit: 'contain', maxHeight: '60px', width: 'auto' }} priority />
            </Link>
            <div className="flex items-center gap-6 text-sm flex-1">
              <Link href="/" className="hover:text-white/80 transition-colors">
                Dashboard
              </Link>
              <Link href="/staff" className="hover:text-white/80 transition-colors">
                Staff
              </Link>
              <Link href="/concerns" className="hover:text-white/80 transition-colors">
                Concerns
              </Link>
              <div className="flex-1" />
              <Link
                href="/admin"
                className="border border-white text-white hover:bg-white hover:text-[#1e3a5f] px-3 py-1 rounded-lg transition-colors font-medium"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
