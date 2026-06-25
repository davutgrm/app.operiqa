'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
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
      router.replace('/auth/reset-password' + window.location.hash)
    }
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('https://ycxqpundxpsmcprshkmh.supabase.co/auth/v1/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        },
        body: JSON.stringify({
          email,
          redirect_to: 'https://app-operiqa.vercel.app/auth/reset-password',
        }),
      })
      const data = await res.json().catch(() => ({}))
      console.log('Reset response:', res.status, data)
      if (!res.ok) {
        const msg = (data as Record<string, string>)?.msg || (data as Record<string, string>)?.message || (data as Record<string, string>)?.error || `Error ${res.status}`
        setError(msg)
        return
      }
      setResetSent(true)
    } catch (err) {
      console.error('recover fetch error:', err)
      setError('Password reset request failed. Please try again.')
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
          <p className="text-sm font-semibold text-hi tracking-tight mb-6">Operiqa</p>
          {view === 'login' ? (
            <>
              <h1 className="text-2xl font-semibold text-hi tracking-tight">Giriş Yap</h1>
              <p className="text-sm text-mid mt-1.5">AI ile lifestyle görsel ve video üretin.</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-hi tracking-tight">Şifremi Unuttum</h1>
              <p className="text-sm text-mid mt-1.5">E-postanıza sıfırlama bağlantısı gönderelim.</p>
            </>
          )}
        </div>

        {view === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="ad@sirket.com"
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-hi placeholder:text-mute outline-none focus:border-line-heavy focus:ring-2 focus:ring-black/[0.04] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-mid">Şifre</label>
                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="text-xs text-mid hover:text-hi transition-colors"
                >
                  Şifremi unuttum
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        ) : resetSent ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sıfırlama bağlantısı e-postanıza gönderildi.
            </div>
            <button
              type="button"
              onClick={() => switchView('login')}
              className="w-full border border-line text-hi text-sm font-medium rounded-xl py-2.5 transition-opacity hover:opacity-70"
            >
              Giriş sayfasına dön
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="ad@sirket.com"
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
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
            </button>

            <button
              type="button"
              onClick={() => switchView('login')}
              className="w-full text-sm text-mid hover:text-hi transition-colors py-1"
            >
              ← Geri dön
            </button>
          </form>
        )}

        <p className="text-center text-xs text-mute mt-8">
          © {new Date().getFullYear()} Operiqa
        </p>
      </div>
    </div>
  )
}
