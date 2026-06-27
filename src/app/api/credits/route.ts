import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Initialize with 3 credits if no row exists yet
  await supabase
    .from('user_credits')
    .upsert({ user_id: user.id, credits: 3 }, { onConflict: 'user_id', ignoreDuplicates: true })

  const { data } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ credits: data?.credits ?? 0 })
}
