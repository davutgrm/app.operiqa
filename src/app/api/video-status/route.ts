import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fal } from '@fal-ai/client'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const requestId = searchParams.get('requestId')
  const generationId = searchParams.get('generationId')

  if (!requestId || !generationId) {
    return NextResponse.json({ error: 'Missing requestId or generationId' }, { status: 400 })
  }

  const FAL_KEY = process.env.FAL_KEY
  if (!FAL_KEY) {
    return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
  }

  fal.config({ credentials: FAL_KEY })

  const status = await fal.queue.status('fal-ai/wan-25-preview/image-to-video', {
    requestId,
    logs: false,
  })

  console.log('[video-status] fal queue status:', status.status, '| requestId:', requestId)

  if (status.status === 'COMPLETED') {
    const result = await fal.queue.result('fal-ai/wan-25-preview/image-to-video', {
      requestId,
    }) as { data?: { video?: { url: string } }; video?: { url: string } }

    console.log('[video-status] fal result TAM OBJE:', JSON.stringify(result, null, 2))

    const videoUrl = result.data?.video?.url ?? result.video?.url
    console.log('[video-status] videoUrl:', videoUrl ?? 'BULUNAMADI')

    if (videoUrl) {
      await supabase
        .from('generations')
        .update({ video_url: videoUrl })
        .eq('id', generationId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ status: 'COMPLETED', videoUrl })
  }

  return NextResponse.json({ status: status.status })
}
