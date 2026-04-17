import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'TAC Staff Probation | Trinity Anglican College',
  description: 'Teaching Staff Probation and Development Framework',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-800 text-slate-400 text-xs text-center py-3">
          © {new Date().getFullYear()} Trinity Anglican College · Teaching Staff Probation & PDI Framework
        </footer>
      </body>
    </html>
  )
}
