import SignupForm from '@/components/SignupForm'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { toLocale } from '@/lib/i18n/config'

export default async function SignupPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = toLocale((await params).lang)
  const dict = await getDictionary(lang)
  return <SignupForm lang={lang} dict={dict.signup} commonDict={dict.common} />
}
