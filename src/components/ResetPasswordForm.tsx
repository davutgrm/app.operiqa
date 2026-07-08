'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { interpolate } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'

interface Props {
  lang: Locale
  dict: Dictionary['resetPassword']
  commonDict: Dictionary['common']
}

export default function ResetPasswordForm({ lang, dict, commonDict }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // PKCE flow: code already exchanged server-side via /auth/callback, session in cookie
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true)
        return
      }

      // Implicit flow fallback: #access_token=...&type=recovery
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (accessToken && refreshToken && type === 'recovery') {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => { error ? setInvalidLink(true) : setReady(true) })
        return
      }

      setInvalidLink(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError(dict.mismatchError)
      return
    }
    if (password.length < 6) {
      setError(dict.tooShortError)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(dict.updateError)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push(`/${lang}/dashboard`), 2000)
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8">
          <p className="text-sm font-semibold text-hi tracking-tight mb-6">{commonDict.appName}</p>
          <h1 className="text-2xl font-semibold text-hi tracking-tight">{dict.title}</h1>
          <p className="text-sm text-mid mt-1.5">{dict.subtitle}</p>
        </div>

        {success ? (
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {dict.success}
          </div>
        ) : invalidLink ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {dict.invalidLink}
            </div>
            <button
              onClick={() => router.push(`/${lang}/login`)}
              className="w-full bg-hi text-canvas text-sm font-medium rounded-xl py-2.5 transition-opacity hover:opacity-80"
            >
              {dict.backToLogin}
            </button>
          </div>
        ) : !ready ? (
          <div className="flex items-center gap-3 text-sm text-mid">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {dict.verifying}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">{dict.newPasswordLabel}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                placeholder="••••••••"
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-hi placeholder:text-mute outline-none focus:border-line-heavy focus:ring-2 focus:ring-black/[0.04] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">{dict.confirmPasswordLabel}</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
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
              {loading ? dict.saving : dict.submitButton}
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
