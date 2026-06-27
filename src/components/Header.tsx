'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userEmail: string
  historyOpen: boolean
  onToggleHistory: () => void
  credits: number | null
}

export default function Header({ userEmail, historyOpen, onToggleHistory, credits }: Props) {
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-line bg-canvas/95 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto h-full px-6 flex items-center justify-between">
        <span className="text-xl font-bold text-hi tracking-wide">Operiqa</span>

        <div className="flex items-center gap-2">
          {/* Credits badge */}
          <div className="flex items-center gap-1.5 bg-transparent border border-line rounded-lg px-2.5 py-1.5">
            <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-xs font-medium ${credits === 0 ? 'text-red-400' : 'text-mid'}`}>
              {credits === null ? '...' : `${credits} crédits`}
            </span>
          </div>

          {/* Upgrade */}
          <Link
            href="/pricing"
            className="text-xs font-medium text-hi bg-transparent border border-line rounded-lg px-3 py-1.5 hover:border-hi transition-colors"
          >
            Upgrade
          </Link>

          {/* Mes images */}
          <button
            onClick={onToggleHistory}
            className={`text-sm font-medium border rounded-lg px-3 py-1.5 transition-colors ${
              historyOpen
                ? 'text-hi border-hi'
                : 'text-mid border-line hover:text-hi hover:border-hi'
            }`}
          >
            Mes images
          </button>

          {/* Déconnexion */}
          <button
            onClick={logout}
            className="text-sm text-mid border border-line rounded-lg px-3 py-1.5 hover:text-red-500 hover:border-red-500 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  )
}
