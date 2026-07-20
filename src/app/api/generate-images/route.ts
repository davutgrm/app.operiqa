import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fal } from '@fal-ai/client'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  console.log('[generate-images] ▶ FONKSİYON ÇAĞRILDI', new Date().toISOString())

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('[generate-images] ✗ Kullanıcı yok, 401 dönülüyor')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  console.log('[generate-images] ✓ Kullanıcı doğrulandı:', user.id)

  // Credit check
  const { data: creditRow } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!creditRow || creditRow.credits < 1) {
    return NextResponse.json({ error: 'Krediniz bitti.' }, { status: 429 })
  }

  const formData = await request.formData()
  const imageFile = formData.get('image') as File
  const prompt = formData.get('prompt') as string
  if (!imageFile || !prompt) {
    console.log('[generate-images] ✗ Eksik alan — imageFile:', !!imageFile, 'prompt:', !!prompt)
    return NextResponse.json({ error: 'Fotoğraf veya prompt eksik.' }, { status: 400 })
  }
  console.log('[generate-images] ✓ Form verisi alındı — dosya:', imageFile.name, imageFile.size, 'bytes')

  const FAL_KEY = process.env.FAL_KEY?.replace(/^﻿/, '')
  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL?.replace(/^﻿/, '')
  console.log('[generate-images] ENV — FAL_KEY mevcut:', !!FAL_KEY, '| N8N_WEBHOOK_URL:', N8N_WEBHOOK_URL ?? 'TANIMLANMAMIŞ')
  if (!FAL_KEY) return NextResponse.json({ error: 'FAL_KEY yapılandırılmamış.' }, { status: 500 })
  if (!N8N_WEBHOOK_URL) return NextResponse.json({ error: 'N8N_WEBHOOK_URL yapılandırılmamış.' }, { status: 500 })

  // 1. AVIF ise fal.ai'nin desteklemediği format — JPEG'e çevir
  const safeName = (name: string) =>
    name.replace(/^﻿/, '').replace(/[^\x00-\x7F]/g, '_').replace(/\s+/g, '_')
  let fileToUpload: File = new File([imageFile], safeName(imageFile.name), { type: imageFile.type })
  const isAvif = imageFile.type === 'image/avif' || imageFile.name.toLowerCase().endsWith('.avif')
  if (isAvif) {
    console.log('[generate-images] AVIF tespit edildi, JPEG\'e dönüştürülüyor...')
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const jpegBuffer = await sharp(buffer).jpeg({ quality: 92 }).toBuffer()
    const jpegName = safeName(imageFile.name.replace(/\.avif$/i, '.jpg'))
    fileToUpload = new File([new Uint8Array(jpegBuffer)], jpegName, { type: 'image/jpeg' })
    console.log('[generate-images] ✓ AVIF → JPEG dönüşümü tamamlandı:', jpegName, jpegBuffer.length, 'bytes')
  }

  // 2. Görseli fal storage'a yükle → kalıcı URL al
  console.log('[generate-images] fal.storage.upload başlıyor...')
  fal.config({ credentials: FAL_KEY })
  const inputImageUrl = await fal.storage.upload(fileToUpload)
  console.log('[generate-images] ✓ fal upload tamamlandı:', inputImageUrl)

  // 2. DB'ye "pending" generation kaydı oluştur (output_image_urls boş)
  const { data: generation, error: dbError } = await supabase
    .from('generations')
    .insert({ user_id: user.id, input_image_url: inputImageUrl, prompt, output_image_urls: [] })
    .select()
    .single()
  if (dbError || !generation) {
    console.error('[generate-images] ✗ DB insert hatası:', dbError?.message)
    return NextResponse.json({ error: dbError?.message ?? 'DB hatası.' }, { status: 500 })
  }
  console.log('[generate-images] ✓ DB kaydı oluşturuldu, generation.id:', generation.id)

  // Deduct 1 credit atomically (safe guard: gte ensures no negative balance on race)
  const { data: updatedCredits } = await supabase
    .from('user_credits')
    .update({ credits: creditRow.credits - 1 })
    .eq('user_id', user.id)
    .gte('credits', 1)
    .select('credits')

  if (!updatedCredits || updatedCredits.length === 0) {
    await supabase.from('generations').delete().eq('id', generation.id)
    return NextResponse.json({ error: 'Krediniz bitti.' }, { status: 429 })
  }
  console.log('[generate-images] ✓ Kredi düşürüldü, kalan:', updatedCredits[0].credits)

  // 3. n8n'e gönder — n8n arka planda işler, Supabase'i doğrudan günceller
  let enrichedPrompt =
    `The furniture product in the reference image must remain exactly as-is: same shape, same color, same material, same proportions, same design details. ` +
    `Only replace the background and room environment — the product itself must not be redesigned, resized, distorted, or reoriented. ` +
    `Position and angle the product naturally within the new scene, as a real photographer would compose the shot. ` +
    `Do not add other furniture or people. ` +
    `Place the product in this scene: ${prompt.trim()}.`

  if (!/photorealistic/i.test(prompt)) {
    enrichedPrompt += ` Photorealistic, professional interior photography, 8K quality, soft natural lighting.`
  }

  enrichedPrompt = enrichedPrompt.replace(/^﻿/, '').replace(/[^\x00-\xFF]/g, ' ')

  const n8nBody = {
    action: 'image',
    scene_description: enrichedPrompt,
    image_url: inputImageUrl,
    generation_id: generation.id,
    image_size: 'portrait_4_3',
  }

  console.log('[generate-images] ▶ n8n fetch BAŞLIYOR — URL:', N8N_WEBHOOK_URL)
  console.log('[generate-images]   body:', JSON.stringify(n8nBody))

  let webhookRes: Response | null = null
  try {
    const safeBody = JSON.stringify(n8nBody, (key, value) => {
      if (typeof value === 'string') {
        return value.replace(/[^\x00-\x7F]/g, '')
      }
      return value
    })
    console.log('BODY CHARS:', JSON.stringify(safeBody).split('').slice(0,10).map(c => c.charCodeAt(0)))
    webhookRes = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: safeBody,
    })
    console.log('[generate-images] ✓ n8n fetch TAMAMLANDI — status:', webhookRes.status, webhookRes.statusText)
  } catch (err) {
    console.error('FETCH ERROR:', err)
    throw err
  }

  if (!webhookRes.ok) {
    const errText = await webhookRes.text()
    console.error('[generate-images] ✗ n8n hata yanıtı:', webhookRes.status, errText)
    return NextResponse.json({ error: `n8n webhook hatası: ${errText}` }, { status: 502 })
  }

  console.log('[generate-images] ✓ Tamamlandı, pending döndürülüyor')
  // n8n ack döndürdü — frontend /api/generation-status ile polling yapacak
  return NextResponse.json({ generation, status: 'pending' })
}
