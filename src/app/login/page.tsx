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
      setError('Identifiant ou mot de passe incorrect.')
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
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })
      if (resetError) {
        setError('La demande de réinitialisation a échoué. Veuillez réessayer.')
        return
      }
      setResetSent(true)
    } catch {
      setError('La demande de réinitialisation a échoué. Veuillez réessayer.')
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
              <h1 className="text-2xl font-semibold text-hi tracking-tight">Se connecter</h1>
              <p className="text-sm text-mid mt-1.5">Créez des visuels et vidéos lifestyle avec l'IA.</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-hi tracking-tight">Mot de passe oublié</h1>
              <p className="text-sm text-mid mt-1.5">Nous vous enverrons un lien de réinitialisation.</p>
            </>
          )}
        </div>

        {view === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="nom@entreprise.com"
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-hi placeholder:text-mute outline-none focus:border-line-heavy focus:ring-2 focus:ring-black/[0.04] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-mid">Mot de passe</label>
                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="text-xs text-mid hover:text-hi transition-colors"
                >
                  Mot de passe oublié
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
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
        ) : resetSent ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Lien de réinitialisation envoyé à votre adresse e-mail.
            </div>
            <button
              type="button"
              onClick={() => switchView('login')}
              className="w-full border border-line text-hi text-sm font-medium rounded-xl py-2.5 transition-opacity hover:opacity-70"
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-mid mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="nom@entreprise.com"
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
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>

            <button
              type="button"
              onClick={() => switchView('login')}
              className="w-full text-sm text-mid hover:text-hi transition-colors py-1"
            >
              ← Retour
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
