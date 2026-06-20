'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8">
          <p className="text-sm font-semibold text-hi tracking-tight mb-6">Operiqa</p>
          <h1 className="text-2xl font-semibold text-hi tracking-tight">Giriş Yap</h1>
          <p className="text-sm text-mid mt-1.5">AI ile lifestyle görsel ve video üretin.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-xs font-medium text-mid mb-1.5">Şifre</label>
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

        <p className="text-center text-xs text-mute mt-8">
          © {new Date().getFullYear()} Operiqa
        </p>
      </div>
    </div>
  )
}
