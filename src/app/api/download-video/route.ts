import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  let res: Response
  try {
    res = await fetch(url)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 502 })
  }

  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch video' }, { status: 502 })

  const blob = await res.blob()
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': 'attachment; filename="operiqa-video.mp4"',
    },
  })
}
