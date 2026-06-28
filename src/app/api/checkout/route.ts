import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const PRICE_CREDITS: Record<string, number> = {
  'price_1TnP0192bdtsK7lGI7QSFB4N': 100,
  'price_1TnP0M92bdtsK7lG4a4rMQqr': 300,
  'price_1TnP0f92bdtsK7lGutK7PY0B': 1500,
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId } = await request.json()
  if (!priceId || !PRICE_CREDITS[priceId]) {
    return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })
  }

  const clean = (v: string | undefined) => v?.trim().replace(/^﻿/, '') ?? ''
  const stripe = new Stripe(clean(process.env.STRIPE_SECRET_KEY))
  const origin = request.nextUrl.origin

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        credits: String(PRICE_CREDITS[priceId]),
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          price_id: priceId,
        },
      },
      success_url: `${origin}/dashboard?subscribed=true`,
      cancel_url: `${origin}/pricing`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    console.error('[checkout] Stripe error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
