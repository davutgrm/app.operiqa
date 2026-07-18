import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'

const client = new Anthropic()

const STYLE_SUFFIX = 'Photorealistic, high quality, detailed textures, professional interior photography, soft natural lighting.'

export async function POST(req: NextRequest) {
  let body: { imageBase64: string; mediaType: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  let { imageBase64, mediaType } = body
  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: 'Missing imageBase64 or mediaType' }, { status: 400 })
  }

  // Claude'un vision API'si AVIF desteklemiyor — JPEG'e çevir
  if (mediaType === 'image/avif') {
    const jpegBuffer = await sharp(Buffer.from(imageBase64, 'base64')).jpeg({ quality: 92 }).toBuffer()
    imageBase64 = jpegBuffer.toString('base64')
    mediaType = 'image/jpeg'
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(mediaType)) {
    return NextResponse.json({ error: 'Unsupported media type' }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'First identify the furniture product type in this image (e.g. sofa, armchair, dining table, desk, chair, bed, shelf, cabinet). Then write a short English lifestyle scene description for a professional photo, matching the room and setting to that product type — for example, a dining room or home office for a table, a living room for a sofa or armchair, a bedroom for a bed, a living room or study for a shelf. Only output the final scene description, nothing else (no product type label, no explanation). Max 2-3 sentences.',
            },
          ],
        },
      ],
    })

    const description = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    return NextResponse.json({ description: `${description} ${STYLE_SUFFIX}` })
  } catch (err) {
    console.error('Anthropic API error:', err)
    return NextResponse.json({ error: 'Image analysis failed' }, { status: 500 })
  }
}
