import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const IMAGE_LIMIT = 100
export const VIDEO_LIMIT = 30

function monthStart() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = monthStart()

  const [{ count: imageCount }, { count: videoCount }] = await Promise.all([
    supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since),
    supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('video_url', 'is', null)
      .gte('created_at', since),
  ])

  return NextResponse.json({
    imageCount: imageCount ?? 0,
    videoCount: videoCount ?? 0,
    imageLimit: IMAGE_LIMIT,
    videoLimit: VIDEO_LIMIT,
  })
}
