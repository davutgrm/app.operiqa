import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret || request.headers.get('x-admin-secret') !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user_id } = await request.json()
  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('usage_resets')
    .insert({ user_id, reset_date: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reset: data })
}
