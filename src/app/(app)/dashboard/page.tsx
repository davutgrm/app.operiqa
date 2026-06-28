import { createClient } from '@/lib/supabase/server'
import MainPage from '@/components/MainPage'

interface Generation {
  id: string
  input_image_url: string
  output_image_urls: string[]
  video_url: string | null
  video_urls: Record<string, string>
  prompt: string
  created_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const initialGenerations: Generation[] = (rows ?? []).filter(
    (g: Generation) => Array.isArray(g.output_image_urls) && g.output_image_urls.length > 0
  )

  return <MainPage userEmail={user!.email ?? ''} initialGenerations={initialGenerations} />
}
