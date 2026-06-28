import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Called by n8n when a video is complete
// Body: { generation_id: string, image_index: number, video_url: string }
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const generationId = body['generation_id'] as string | undefined
  const imageIndex = body['image_index'] as number | undefined
  const videoUrl = body['video_url'] as string | undefined

  if (!generationId || imageIndex === undefined || !videoUrl) {
    return NextResponse.json({ error: 'Missing generation_id, image_index or video_url' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error: fetchError } = await supabase
    .from('generations')
    .select('video_urls')
    .eq('id', generationId)
    .single()

  if (fetchError || !data) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
  }

  const current = (data.video_urls as Record<string, string>) ?? {}
  current[String(imageIndex)] = videoUrl

  const { error } = await supabase
    .from('generations')
    .update({ video_urls: current })
    .eq('id', generationId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[video-callback] ✓ video_urls[' + imageIndex + '] set for', generationId)
  return NextResponse.json({ ok: true })
}
