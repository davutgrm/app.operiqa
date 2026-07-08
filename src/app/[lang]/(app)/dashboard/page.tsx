import { createClient } from '@/lib/supabase/server'
import MainPage from '@/components/MainPage'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { toLocale } from '@/lib/i18n/config'

interface Generation {
  id: string
  input_image_url: string
  output_image_urls: string[]
  video_url: string | null
  video_urls: Record<string, string>
  prompt: string
  created_at: string
}

export default async function DashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = toLocale((await params).lang)
  const dict = await getDictionary(lang)
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

  return (
    <MainPage
      userEmail={user!.email ?? ''}
      initialGenerations={initialGenerations}
      lang={lang}
      dict={dict.dashboard}
      headerDict={dict.header}
      themeDict={dict.theme}
      imageUploaderDict={dict.imageUploader}
      generatedImagesDict={dict.generatedImages}
    />
  )
}
