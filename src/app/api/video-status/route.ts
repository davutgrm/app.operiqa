import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const generationId = searchParams.get('generationId')
  const imageIndex = searchParams.get('imageIndex') ?? '0'

  if (!generationId) {
    return NextResponse.json({ error: 'Missing generationId' }, { status: 400 })
  }

  // Use select('*') to guarantee video_urls JSONB column is returned
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
  }

  const videoUrls: Record<string, string> = (data.video_urls as Record<string, string>) ?? {}

  // Sadece istenen imageIndex'in videosunu döndür
  let videoUrl: string | null = videoUrls[imageIndex] ?? null

  // Legacy fallback: sadece imageIndex "0" ise video_url kolonuna bak
  if (!videoUrl && imageIndex === '0' && data.video_url) {
    videoUrl = data.video_url as string
  }

  if (videoUrl) {
    return NextResponse.json({ status: 'COMPLETED', videoUrl })
  }

  return NextResponse.json({ status: 'PENDING' })
}
