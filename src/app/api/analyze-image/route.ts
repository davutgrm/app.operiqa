import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const STYLE_SUFFIX = 'Photorealistic, high quality, detailed textures, professional interior photography, soft natural lighting.'

export async function POST(req: NextRequest) {
  let body: { imageBase64: string; mediaType: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { imageBase64, mediaType } = body
  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: 'Missing imageBase64 or mediaType' }, { status: 400 })
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(mediaType)) {
    return NextResponse.json({ error: 'Unsupported media type' }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      temperature: 0.2,
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
              text: 'First identify the furniture product type in this image (e.g. sofa, armchair, dining table, desk, chair, bed, shelf, cabinet). Look carefully at the furniture\'s exact type, height, and design before choosing a scene — a bar stool goes with a kitchen island or home bar, not a random kitchen scene; a dining chair goes with a dining table. Always match the scene to the product\'s real-world usage context, not just a generic home setting — consider whether this piece belongs in a home, café, restaurant, office, garden, or commercial space. For example: a bar stool suits a bar/café counter or kitchen island; an office chair suits an office or study; garden furniture suits an outdoor patio or garden; a dining chair suits a dining table; restaurant or café furniture suits a commercial hospitality space. Then write a short English lifestyle scene description for a professional photo, matching the room and setting to that product type. Only output the final scene description, nothing else (no product type label, no explanation). Max 2-3 sentences.',
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
