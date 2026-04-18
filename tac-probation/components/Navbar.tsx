import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'

export default function Navbar() {
  return (
    <header>
      <nav className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20 gap-6">
            <Link href="/" className="shrink-0 py-2">
              <Image
                src="/logo.png"
                alt="Trinity Anglican College"
                width={150}
                height={60}
                style={{ objectFit: 'contain', maxHeight: '60px', width: 'auto' }}
                priority
              />
            </Link>
            <div className="flex items-center gap-5 text-sm flex-1 min-w-0">
              <Link href="/" className="hover:text-white/80 transition-colors whitespace-nowrap">
                Dashboard
              </Link>
              <Link href="/staff" className="hover:text-white/80 transition-colors whitespace-nowrap">
                Staff
              </Link>
              <Link href="/concerns" className="hover:text-white/80 transition-colors whitespace-nowrap">
                Concerns
              </Link>
              <Link href="/reports" className="hover:text-white/80 transition-colors whitespace-nowrap">
                Reports
              </Link>
              <div className="flex-1" />
              <ThemeToggle />
              <Link
                href="/admin"
                className="border border-white text-white hover:bg-white hover:text-[#1e3a5f] px-3 py-1 rounded-lg transition-colors font-medium whitespace-nowrap"
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
