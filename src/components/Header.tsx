'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userEmail: string
  historyOpen: boolean
  onToggleHistory: () => void
}

export default function Header({ userEmail, historyOpen, onToggleHistory }: Props) {
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-line bg-canvas/95 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto h-full px-6 flex items-center justify-between">
        <span className="text-sm font-semibold text-hi tracking-tight">Operiqa</span>

        <div className="flex items-center gap-1">
          <span className="hidden sm:block text-xs text-mute max-w-[160px] truncate mr-2">{userEmail}</span>
          <button
            onClick={onToggleHistory}
            className={`text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
              historyOpen
                ? 'text-hi bg-raised border border-line'
                : 'text-mid hover:text-hi hover:bg-raised'
            }`}
          >
            My Images
          </button>
          <div className="w-px h-4 bg-line mx-1" />
          <button
            onClick={logout}
            className="text-sm text-mid hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-raised"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
