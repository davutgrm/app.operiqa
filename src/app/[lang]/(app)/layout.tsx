import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toLocale } from '@/lib/i18n/config'

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const lang = toLocale((await params).lang)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${lang}/login`)
  return <>{children}</>
}
