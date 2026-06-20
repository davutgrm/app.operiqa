'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userEmail: string
}

export default function Header({ userEmail }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="fixed top-0 inset-x-0 z-30 h-14 border-b border-line bg-canvas/95 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto h-full px-6 flex items-center justify-between">
        <span className="text-sm font-semibold text-hi tracking-tight">Operiqa</span>

        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 text-sm text-mid hover:text-hi transition-colors"
          >
            <span className="max-w-[200px] truncate">{userEmail}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-canvas border border-line rounded-xl shadow-lg shadow-black/5 overflow-hidden">
              <div className="px-3.5 py-3 border-b border-line">
                <p className="text-xs text-mute truncate">{userEmail}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={logout}
                  className="w-full text-left text-sm text-red-500 hover:bg-raised px-3 py-2 rounded-lg transition-colors"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
