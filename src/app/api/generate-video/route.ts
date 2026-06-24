import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fal } from '@fal-ai/client'
import sharp from 'sharp'
import { VIDEO_LIMIT } from '../usage/route'

export async function POST(request: NextRequest) {
  console.log('[generate-video] ▶ FONKSİYON ÇAĞRILDI', new Date().toISOString())

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Monthly video limit check
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const { count: videoCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('video_url', 'is', null)
    .gte('created_at', monthStart.toISOString())
  if ((videoCount ?? 0) >= VIDEO_LIMIT) {
    return NextResponse.json({ error: 'Bu ay video limitinize ulaştınız.' }, { status: 429 })
  }

  let { imageUrl, generationId } = await request.json()
  if (!imageUrl || !generationId) {
    return NextResponse.json({ error: 'Missing imageUrl or generationId' }, { status: 400 })
  }

  const FAL_KEY = process.env.FAL_KEY?.replace(/^﻿/, '')
  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
  if (!N8N_WEBHOOK_URL) {
    return NextResponse.json({ error: 'N8N_WEBHOOK_URL yapılandırılmamış.' }, { status: 500 })
  }

  // PNG → JPEG: alpha channel causes transparency artifacts in Wan 2.5
  if (/\.png(\?|$)/i.test(imageUrl)) {
    console.log('[generate-video] PNG tespit edildi, JPEG\'e dönüştürülüyor...')
    if (!FAL_KEY) {
      return NextResponse.json({ error: 'FAL_KEY yapılandırılmamış.' }, { status: 500 })
    }
    const res = await fetch(imageUrl)
    const buffer = Buffer.from(await res.arrayBuffer())
    const jpegBuffer = await sharp(buffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 92 })
      .toBuffer()
    const jpegFile = new File([new Uint8Array(jpegBuffer)], 'video-input.jpg', { type: 'image/jpeg' })
    fal.config({ credentials: FAL_KEY })
    imageUrl = await fal.storage.upload(jpegFile)
    console.log('[generate-video] ✓ JPEG yüklendi:', imageUrl)
  }

  const n8nBody = {
    action: 'video',
    image_url: imageUrl,
    generation_id: generationId,
  }

  console.log('[generate-video] ▶ n8n fetch BAŞLIYOR:', JSON.stringify(n8nBody))

  let webhookRes: Response
  try {
    webhookRes = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nBody),
    })
  } catch (err) {
    const error = err as Error
    console.error('[generate-video] ✗ n8n fetch hatası:', error.message)
    return NextResponse.json({ error: 'n8n webhook bağlantı hatası.' }, { status: 502 })
  }

  if (!webhookRes.ok) {
    const errText = await webhookRes.text()
    console.error('[generate-video] ✗ n8n hata yanıtı:', webhookRes.status, errText)
    return NextResponse.json({ error: `n8n webhook hatası: ${errText}` }, { status: 502 })
  }

  console.log('[generate-video] ✓ Tamamlandı, pending döndürülüyor')
  return NextResponse.json({ generationId, status: 'pending' })
}
