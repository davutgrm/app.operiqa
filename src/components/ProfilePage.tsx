'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'

interface Props {
  userEmail: string
  lang: Locale
  dict: Dictionary['profile']
  themeDict: Dictionary['theme']
}

export default function ProfilePage({ userEmail, lang, dict, themeDict }: Props) {
  const router = useRouter()
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState('')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${lang}/login`)
  }

  async function handleManageSubscription() {
    setPortalLoading(true)
    setPortalError('')
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnPath: `/${lang}/profile` }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setPortalError(dict.genericError)
        return
      }
      window.location.href = data.url
    } catch {
      setPortalError(dict.genericError)
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <h1
              className="font-serif font-light text-hi"
              style={{ fontSize: '2rem', letterSpacing: '0.06em', lineHeight: 1.2 }}
            >
              {dict.title}
            </h1>
            <p className="text-sm text-low mt-2.5 tracking-wide">{dict.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSwitcher lang={lang} />
            <ThemeToggle dict={themeDict} />
          </div>
        </div>

        <div className="mb-6">
          <Link href={`/${lang}/dashboard`} className="text-xs text-mid hover:text-hi transition-colors">
            {dict.backToDashboard}
          </Link>
        </div>

        {/* Account card */}
        <div className="card-premium luxury-card rounded-xl overflow-hidden">

          {/* User info */}
          <div className="px-6 py-6 border-b border-line">
            <p className="text-[10px] font-medium text-mute uppercase tracking-[0.14em] mb-5">{dict.account}</p>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-accent-muted border border-accent-ring">
                <span className="text-sm font-semibold text-accent">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-hi tracking-wide">{userEmail}</p>
                <p className="text-xs text-mute mt-0.5 tracking-wide">{dict.member}</p>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="px-6 py-6 border-b border-line">
            <p className="text-[10px] font-medium text-mute uppercase tracking-[0.14em] mb-5">{dict.subscription}</p>
            {portalError && <p className="text-xs text-red-500 mb-3">{portalError}</p>}
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="flex items-center gap-2.5 text-sm tracking-wide rounded-lg px-3.5 py-2 border border-line text-hi hover:border-line-mid transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {portalLoading ? dict.redirecting : dict.manageSubscription}
            </button>
          </div>

          {/* Session */}
          <div className="px-6 py-6">
            <p className="text-[10px] font-medium text-mute uppercase tracking-[0.14em] mb-5">{dict.session}</p>
            <button
              onClick={handleLogout}
              className="btn-danger flex items-center gap-2.5 text-sm tracking-wide rounded-lg px-3.5 py-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {dict.logout}
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
