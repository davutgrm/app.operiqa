'use client'

import { useState } from 'react'
import { formatCurrency, formatNumber, interpolate } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'

export interface Plan {
  name: string
  priceId: string
  credits: number
  amount: number
  currency: string
  popular: boolean
}

interface Props {
  plan: Plan
  lang: Locale
  dict: Dictionary['planCard']
}

export default function PlanCard({ plan, lang, dict }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const price = plan.amount > 0 ? formatCurrency(lang, plan.amount, plan.currency) : '—'

  async function handleSubscribe() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? dict.genericError)
        return
      }
      window.location.href = data.url
    } catch {
      setError(dict.genericError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative rounded-2xl border bg-canvas p-6 flex flex-col gap-5 transition-shadow hover:shadow-md ${
      plan.popular ? 'border-hi shadow-sm' : 'border-line'
    }`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-hi text-canvas text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
          {dict.popular}
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-mute uppercase tracking-widest">{plan.name}</p>
        <p className="mt-2">
          <span className="text-3xl font-bold text-hi">{price}</span>
          <span className="text-sm text-mute ml-1">{dict.perMonth}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 bg-raised border border-line rounded-xl px-3.5 py-2.5">
        <svg className="w-4 h-4 text-mute flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-semibold text-hi">{formatNumber(lang, plan.credits)} {dict.creditsSuffix}</span>
        <span className="text-xs text-mute">{dict.perMonth}</span>
      </div>

      <ul className="space-y-2.5 text-sm text-mid flex-1">
        {[
          interpolate(dict.creditsPerMonth, { count: formatNumber(lang, plan.credits) }),
          dict.feature4Images,
          dict.featureVideos,
        ].map(feature => (
          <li key={feature} className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`w-full text-sm font-medium rounded-xl py-3 transition-opacity hover:opacity-80 disabled:opacity-40 ${
          plan.popular
            ? 'bg-hi text-canvas'
            : 'border border-line text-hi bg-canvas hover:bg-raised'
        }`}
      >
        {loading ? dict.redirecting : dict.subscribe}
      </button>
    </div>
  )
}
