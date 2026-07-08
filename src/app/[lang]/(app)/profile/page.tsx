import { createClient } from '@/lib/supabase/server'
import ProfilePage from '@/components/ProfilePage'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { toLocale } from '@/lib/i18n/config'

export default async function ProfileRoute({ params }: { params: Promise<{ lang: string }> }) {
  const lang = toLocale((await params).lang)
  const dict = await getDictionary(lang)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <ProfilePage userEmail={user?.email ?? ''} lang={lang} dict={dict.profile} themeDict={dict.theme} />
}
