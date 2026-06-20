import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { extractImageUrls } from '@/lib/extract-image-urls'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const obj = body as Record<string, unknown>
  const generationId = obj['generation_id'] as string | undefined
  if (!generationId) {
    return NextResponse.json({ error: 'generation_id eksik.' }, { status: 400 })
  }

  const imageUrls = extractImageUrls(body)
  if (imageUrls.length === 0) {
    return NextResponse.json({ error: 'Yanıtta görsel URL bulunamadı.', received: body }, { status: 422 })
  }

  // Service role ile RLS'yi bypass ederek güncelle
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('generations')
    .update({ output_image_urls: imageUrls })
    .eq('id', generationId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: imageUrls.length })
}
