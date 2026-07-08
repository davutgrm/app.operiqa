import { redirect } from 'next/navigation'
import { toLocale } from '@/lib/i18n/config'

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = toLocale((await params).lang)
  redirect(`/${lang}/dashboard`)
}
