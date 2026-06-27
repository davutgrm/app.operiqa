import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

const PRICE_CREDITS: Record<string, number> = {
  'price_1TmnWu9setBh8QuDkKtkoGEd': 100,
  'price_1TmnXb9setBh8QuDksZh6sUW': 300,
  'price_1TmnY89setBh8QuD6KJrbkSX': 1500,
}

async function addCredits(userId: string, amount: number) {
  const supabase = createServiceClient()

  await supabase
    .from('user_credits')
    .upsert({ user_id: userId, credits: 0 }, { onConflict: 'user_id', ignoreDuplicates: true })

  const { data } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single()

  await supabase
    .from('user_credits')
    .update({ credits: (data?.credits ?? 0) + amount, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  console.log(`[webhook] ✓ Added ${amount} credits to user ${userId}, new total: ${(data?.credits ?? 0) + amount}`)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    // First payment when subscription is created
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.payment_status === 'paid') {
        const userId = session.metadata?.user_id
        const credits = parseInt(session.metadata?.credits ?? '0', 10)
        if (userId && credits > 0) {
          await addCredits(userId, credits)
        }
      }
    }

    // Monthly renewal (billing_reason === 'subscription_create' is the first invoice, skip it)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null; billing_reason?: string }
      if (invoice.billing_reason === 'subscription_cycle') {
        const subscriptionId = invoice.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.user_id
        const priceId = subscription.items.data[0]?.price.id
        const credits = PRICE_CREDITS[priceId]
        if (userId && credits) {
          await addCredits(userId, credits)
        }
      }
    }
  } catch (err) {
    console.error('[webhook] Processing error:', err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
