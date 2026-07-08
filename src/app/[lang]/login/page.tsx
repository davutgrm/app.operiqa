import LoginForm from '@/components/LoginForm'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { toLocale } from '@/lib/i18n/config'

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = toLocale((await params).lang)
  const dict = await getDictionary(lang)
  return <LoginForm lang={lang} dict={dict.login} commonDict={dict.common} />
}
