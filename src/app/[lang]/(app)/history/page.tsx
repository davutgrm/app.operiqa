import { createClient } from '@/lib/supabase/server'
import HistoryPage from '@/components/HistoryPage'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { toLocale } from '@/lib/i18n/config'

export default async function HistoryRoute({ params }: { params: Promise<{ lang: string }> }) {
  const lang = toLocale((await params).lang)
  const dict = await getDictionary(lang)
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

  return <HistoryPage generations={generations} lang={lang} dict={dict.history} themeDict={dict.theme} />
}
