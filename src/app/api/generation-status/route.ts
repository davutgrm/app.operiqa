import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id eksik.' }, { status: 400 })

  const { data: generation, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !generation) {
    return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })
  }

  const urls: string[] = generation.output_image_urls ?? []
  const status = urls.length > 0 ? 'completed' : 'pending'

  return NextResponse.json({ status, generation })
}
