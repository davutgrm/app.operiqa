import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const PRICE_CREDITS: Record<string, number> = {
  'price_1TmnWu9setBh8QuDkKtkoGEd': 100,
  'price_1TmnXb9setBh8QuDksZh6sUW': 300,
  'price_1TmnY89setBh8QuD6KJrbkSX': 1500,
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId } = await request.json()
  if (!priceId || !PRICE_CREDITS[priceId]) {
    return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const origin = request.nextUrl.origin

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
}
