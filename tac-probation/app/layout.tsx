import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Probation Tracker | Trinity Anglican College',
  description: 'Trinity Anglican College Probation Tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-[#1e3a5f] text-slate-300 text-xs text-center py-3">
          © {new Date().getFullYear()} Trinity Anglican College · Probation Tracker
        </footer>
      </body>
    </html>
  )
}
