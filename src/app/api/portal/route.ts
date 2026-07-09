import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clean = (v: string | undefined) => v?.trim().replace(/^﻿/, '') ?? ''
  const stripe = new Stripe(clean(process.env.STRIPE_SECRET_KEY))

  const { data: row } = await supabase
    .from('user_credits')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let customerId: string | null = row?.stripe_customer_id ?? null

  if (!customerId && user.email) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 })
    customerId = customers.data[0]?.id ?? null
    if (customerId) {
      await supabase
        .from('user_credits')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }
  }

  if (!customerId) {
    return NextResponse.json({ error: 'no_subscription' }, { status: 404 })
  }

  const { returnPath } = await request.json().catch(() => ({ returnPath: '/' }))
  const origin = request.nextUrl.origin

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}${returnPath ?? '/'}`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    console.error('[portal] Stripe error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
