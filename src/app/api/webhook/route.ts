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

  // Ensure row exists (3 is overridden if row already exists due to ignoreDuplicates)
  const { error: upsertError } = await supabase
    .from('user_credits')
    .upsert({ user_id: userId, credits: 0 }, { onConflict: 'user_id', ignoreDuplicates: true })
  if (upsertError) throw new Error(`upsert failed: ${upsertError.message}`)

  const { data, error: selectError } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single()
  if (selectError) throw new Error(`select failed: ${selectError.message}`)

  const newTotal = (data?.credits ?? 0) + amount
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({ credits: newTotal })
    .eq('user_id', userId)
  if (updateError) throw new Error(`update failed: ${updateError.message}`)

  console.log(`[webhook] ✓ Added ${amount} credits to user ${userId}, new total: ${newTotal}`)
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
      console.log('[webhook] checkout.session.completed — payment_status:', session.payment_status, '| metadata:', JSON.stringify(session.metadata))

      // 'paid' for normal subscriptions; 'no_payment_required' for trialing plans
      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        const userId = session.metadata?.user_id
        const credits = parseInt(session.metadata?.credits ?? '0', 10)
        if (!userId) throw new Error(`Missing user_id in session metadata (session: ${session.id})`)
        if (credits <= 0) throw new Error(`Invalid credits value in session metadata: ${session.metadata?.credits}`)
        await addCredits(userId, credits)
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
