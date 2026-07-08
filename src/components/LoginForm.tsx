'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { interpolate } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'

interface Props {
  lang: Locale
  dict: Dictionary['login']
  commonDict: Dictionary['common']
}

export default function LoginForm({ lang, dict, commonDict }: Props) {
  const router = useRouter()
  const [view, setView] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1))
    if (params.get('type') === 'recovery') {
      router.replace(`/${lang}/auth/reset-password` + window.location.hash)
    }
  }, [router, lang])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(dict.loginError)
      setLoading(false)
      return
    }
    router.push(`/${lang}/dashboard`)
    router.refresh()
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/${lang}/auth/reset-password`,
      })
      if (resetError) {
        setError(dict.resetError)
        return
      }
      setResetSent(true)
    } catch {
      setError(dict.resetError)
    } finally {
      setLoading(false)
    }
  }

  function switchView(v: 'login' | 'forgot') {
    setView(v)
    setError('')
    setResetSent(false)
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8">
          <p className="text-sm font-semibold text-hi tracking-tight mb-6">{commonDict.appName}</p>
          {view === 'login' ? (
            <>
              <h1 className="text-2xl font-semibold text-hi tracking-tight">{dict.loginTitle}</h1>
              <p className="text-sm text-mid mt-1.5">{dict.loginSubtitle}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-hi tracking-tight">{dict.forgotTitle}</h1>
              <p className="text-sm text-mid mt-1.5">{dict.forgotSubtitle}</p>
            </>
          )}
        </div>

        {view === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">{dict.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder={dict.emailPlaceholder}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-hi placeholder:text-mute outline-none focus:border-line-heavy focus:ring-2 focus:ring-black/[0.04] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-mid">{dict.passwordLabel}</label>
                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="text-xs text-mid hover:text-hi transition-colors"
                >
                  {dict.forgotLink}
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder={dict.passwordPlaceholder}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-hi placeholder:text-mute outline-none focus:border-line-heavy focus:ring-2 focus:ring-black/[0.04] transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-hi text-canvas text-sm font-medium rounded-xl py-2.5 transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {loading ? dict.loggingIn : dict.loginButton}
            </button>
          </form>
        ) : resetSent ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {dict.resetSent}
            </div>
            <button
              type="button"
              onClick={() => switchView('login')}
              className="w-full border border-line text-hi text-sm font-medium rounded-xl py-2.5 transition-opacity hover:opacity-70"
            >
              {dict.backToLogin}
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">{dict.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder={dict.emailPlaceholder}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-hi placeholder:text-mute outline-none focus:border-line-heavy focus:ring-2 focus:ring-black/[0.04] transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-hi text-canvas text-sm font-medium rounded-xl py-2.5 transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {loading ? dict.sending : dict.sendResetLink}
            </button>

            <button
              type="button"
              onClick={() => switchView('login')}
              className="w-full text-sm text-mid hover:text-hi transition-colors py-1"
            >
              {dict.back}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-mute mt-8">
          {interpolate(commonDict.copyright, { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  )
}
