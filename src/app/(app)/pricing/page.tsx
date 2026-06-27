import Stripe from 'stripe'
import Link from 'next/link'
import PlanCard, { type Plan } from '@/components/PlanCard'

const PLANS = [
  { name: 'Warm Up',  priceId: 'price_1TmoxO92bdtsK7lGofNZTpjZ', credits: 100,  popular: false },
  { name: 'Collector', priceId: 'price_1TmoxO92bdtsK7lGZOLYRCoU', credits: 300,  popular: true  },
  { name: 'Retail',   priceId: 'price_1TmoxT92bdtsK7lGklwelknu', credits: 1500, popular: false },
]

export default async function PricingPage() {
  const clean = (v: string | undefined) => v?.trim().replace(/^﻿/, '') ?? ''
  const rawKey = process.env.STRIPE_SECRET_KEY ?? ''
  const key = clean(rawKey)
  console.log('[pricing] KEY raw length:', rawKey.length, '| cleaned length:', key.length)
  console.log('[pricing] KEY first 20 chars:', key.substring(0, 20))
  console.log('[pricing] KEY char codes [0-3]:', [...key.substring(0, 4)].map(c => c.charCodeAt(0)))

  const stripe = new Stripe(key)

  let plans: Plan[]
  try {
    console.log('[pricing] Fetching price_1TmoxT92bdtsK7lGklwelknu...')
    const testPrice = await stripe.prices.retrieve('price_1TmoxT92bdtsK7lGklwelknu')
    console.log('[pricing] price_1TmoxT result:', testPrice.id, testPrice.unit_amount, testPrice.currency)

    const stripeprices = await Promise.all(
      PLANS.map(p => stripe.prices.retrieve(p.priceId))
    )
    plans = PLANS.map((p, i) => ({
      ...p,
      amount: stripeprices[i].unit_amount ?? 0,
      currency: stripeprices[i].currency ?? 'eur',
    }))
  } catch (err) {
    console.error('[pricing] Stripe fetch failed:', err)
    plans = PLANS.map(p => ({ ...p, amount: 0, currency: 'eur' }))
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-line bg-canvas/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto h-full px-6 flex items-center justify-between">
          <span className="text-xl font-bold text-hi tracking-wide">Operiqa</span>
          <Link href="/dashboard" className="text-sm text-mid hover:text-hi transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="pt-14">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-2xl font-semibold text-hi tracking-tight">Plans & crédits</h1>
            <p className="text-sm text-mid mt-2">Choisissez le plan adapté à votre activité. Les crédits sont ajoutés chaque mois.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <PlanCard key={plan.priceId} plan={plan} />
            ))}
          </div>

          <p className="text-center text-xs text-mute mt-10">
            1 image = 1 crédit · 1 vidéo = 5 crédits · Les crédits s'accumulent et ne expirent pas.
          </p>
        </div>
      </div>
    </div>
  )
}
