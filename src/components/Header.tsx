'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from './ThemeToggle'

interface Props {
  userEmail: string
  credits: number | null
}

export default function Header({ userEmail, credits }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-line bg-canvas/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <span className="text-xl font-bold text-hi tracking-wide">Operiqa</span>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
            <ThemeToggle />

            <div className="flex items-center gap-1.5 bg-transparent border border-line rounded-lg px-2.5 py-1.5">
              <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-xs font-medium ${credits === 0 ? 'text-red-400' : 'text-mid'}`}>
                {credits === null ? '...' : `${credits} crédits`}
              </span>
            </div>

            <Link href="/pricing" className="text-xs font-medium text-hi bg-transparent border border-line rounded-lg px-3 py-1.5 hover:border-hi transition-colors">
              Upgrade
            </Link>

            <a href="/history" className="text-sm font-medium border border-line rounded-lg px-3 py-1.5 text-mid hover:text-hi hover:border-hi transition-colors">
              Mes images
            </a>

            <button onClick={logout} className="text-sm text-mid border border-line rounded-lg px-3 py-1.5 hover:text-red-500 hover:border-red-500 transition-colors">
              Déconnexion
            </button>
          </div>

          {/* Mobile right side */}
          <div className="flex sm:hidden items-center gap-2">
            {/* Credits pill */}
            <div className="flex items-center gap-1 border border-line rounded-lg px-2 py-1">
              <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-xs font-medium ${credits === 0 ? 'text-red-400' : 'text-mid'}`}>
                {credits === null ? '...' : credits}
              </span>
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-8 h-8 flex items-center justify-center border border-line rounded-lg text-mid hover:text-hi transition-colors"
            >
              {menuOpen ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="fixed top-14 inset-x-0 z-40 sm:hidden border-b border-line bg-canvas shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <div className="flex items-center justify-between py-2 px-3 rounded-xl">
              <span className="text-xs text-mute">{userEmail}</span>
              <ThemeToggle />
            </div>

            <Link
              href="/pricing"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-hi hover:bg-raised transition-colors"
            >
              <svg className="w-4 h-4 text-mute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade
            </Link>

            <a
              href="/history"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-hi hover:bg-raised transition-colors"
            >
              <svg className="w-4 h-4 text-mute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Mes images
            </a>

            <button
              onClick={() => { setMenuOpen(false); logout() }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setMenuOpen(false)} />
      )}
    </>
  )
}
