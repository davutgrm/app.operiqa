import { createClient } from '@/lib/supabase/server'
import HistoryPage from '@/components/HistoryPage'

export default async function HistoryRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const generations = (rows ?? []).filter(
    (g: { output_image_urls: string[] }) =>
      Array.isArray(g.output_image_urls) && g.output_image_urls.length > 0
  )

  return <HistoryPage generations={generations} />
}
