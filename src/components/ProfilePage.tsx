'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userEmail: string
}

export default function ProfilePage({ userEmail }: Props) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1
            className="font-serif font-light text-hi"
            style={{ fontSize: '2rem', letterSpacing: '0.06em', lineHeight: 1.2 }}
          >
            Profil
          </h1>
          <p className="text-sm text-low mt-2.5 tracking-wide">Informations de votre compte.</p>
        </div>

        {/* Account card */}
        <div className="card-premium luxury-card rounded-xl overflow-hidden">

          {/* User info */}
          <div className="px-6 py-6 border-b border-line">
            <p className="text-[10px] font-medium text-mute uppercase tracking-[0.14em] mb-5">Compte</p>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-accent-muted border border-accent-ring">
                <span className="text-sm font-semibold text-accent">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-hi tracking-wide">{userEmail}</p>
                <p className="text-xs text-mute mt-0.5 tracking-wide">Membre</p>
              </div>
            </div>
          </div>

          {/* Session */}
          <div className="px-6 py-6">
            <p className="text-[10px] font-medium text-mute uppercase tracking-[0.14em] mb-5">Session</p>
            <button
              onClick={handleLogout}
              className="btn-danger flex items-center gap-2.5 text-sm tracking-wide rounded-lg px-3.5 py-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Se déconnecter
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
