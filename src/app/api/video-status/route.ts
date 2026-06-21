import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const generationId = searchParams.get('generationId')
  if (!generationId) {
    return NextResponse.json({ error: 'Missing generationId' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('generations')
    .select('video_url')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
  }

  if (data.video_url) {
    return NextResponse.json({ status: 'COMPLETED', videoUrl: data.video_url })
  }

  return NextResponse.json({ status: 'PENDING' })
}