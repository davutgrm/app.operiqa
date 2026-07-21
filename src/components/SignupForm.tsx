'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import LanguageSwitcher from './LanguageSwitcher'
import { interpolate } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'

interface Props {
  lang: Locale
  dict: Dictionary['signup']
  commonDict: Dictionary['common']
}

const MIN_PASSWORD_LENGTH = 8

export default function SignupForm({ lang, dict, commonDict }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupSent, setSignupSent] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(dict.passwordTooShortError)
      return
    }
    if (password !== confirmPassword) {
      setError(dict.passwordMismatchError)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: name.trim() ? { full_name: name.trim() } : undefined,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/${lang}/dashboard`,
        },
      })
      if (signupError) {
        setError(dict.signupError)
        return
      }
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError(dict.emailInUseError)
        return
      }
      setSignupSent(true)
    } catch {
      setError(dict.signupError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-semibold text-hi tracking-tight">{commonDict.appName}</p>
            <LanguageSwitcher lang={lang} />
          </div>
          <h1 className="text-2xl font-semibold text-hi tracking-tight">{dict.signupTitle}</h1>
          <p className="text-sm text-mid mt-1.5">{dict.signupSubtitle}</p>
        </div>

        {signupSent ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">{dict.checkEmailTitle}</p>
                <p className="text-green-700/80 mt-0.5">{dict.checkEmailSubtitle}</p>
              </div>
            </div>
            <Link
              href={`/${lang}/login`}
              className="block w-full text-center border border-line text-hi text-sm font-medium rounded-xl py-2.5 transition-opacity hover:opacity-70"
            >
              {dict.backToLogin}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">{dict.nameLabel}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                placeholder={dict.namePlaceholder}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-hi placeholder:text-mute outline-none focus:border-line-heavy focus:ring-2 focus:ring-black/[0.04] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">{dict.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder={dict.emailPlaceholder}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-hi placeholder:text-mute outline-none focus:border-line-heavy focus:ring-2 focus:ring-black/[0.04] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">{dict.passwordLabel}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
                placeholder={dict.passwordPlaceholder}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-hi placeholder:text-mute outline-none focus:border-line-heavy focus:ring-2 focus:ring-black/[0.04] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">{dict.confirmPasswordLabel}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
                placeholder={dict.confirmPasswordPlaceholder}
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
              {loading ? dict.signingUp : dict.signupButton}
            </button>

            <p className="text-center text-xs text-mid">
              {dict.alreadyHaveAccount}{' '}
              <Link href={`/${lang}/login`} className="text-hi font-medium hover:opacity-70 transition-opacity">
                {dict.loginLink}
              </Link>
            </p>
          </form>
        )}

        <p className="text-center text-xs text-mute mt-8">
          {interpolate(commonDict.copyright, { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  )
}
