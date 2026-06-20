import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fal } from '@fal-ai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { imageUrl, generationId } = await request.json()

  if (!imageUrl || !generationId) {
    return NextResponse.json({ error: 'Missing imageUrl or generationId' }, { status: 400 })
  }

  const FAL_KEY = process.env.FAL_KEY
  if (!FAL_KEY) {
    return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
  }

  fal.config({ credentials: FAL_KEY })

  // Submit video generation job to fal queue
  const { request_id } = await fal.queue.submit('fal-ai/wan-25-preview/image-to-video', {
    input: {
      image_url: imageUrl,
      prompt: 'Static camera slowly moving forward toward the furniture, like a person walking closer. Subtle natural handheld sway, no panning, no rotation. Sharp focus, no distortion, professional product video.',
      resolution: '480p',
    },
  })

  return NextResponse.json({ requestId: request_id, generationId })
}
