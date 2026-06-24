import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

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
              text: 'Analyze this furniture product image and write a short English scene description for a professional lifestyle photo. Only write the scene description, nothing else. Max 2 sentences.',
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

    return NextResponse.json({ description })
  } catch (err) {
    console.error('Anthropic API error:', err)
    return NextResponse.json({ error: 'Image analysis failed' }, { status: 500 })
  }
}
