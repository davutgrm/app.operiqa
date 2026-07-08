import ResetPasswordForm from '@/components/ResetPasswordForm'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { toLocale } from '@/lib/i18n/config'

export default async function ResetPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = toLocale((await params).lang)
  const dict = await getDictionary(lang)
  return <ResetPasswordForm lang={lang} dict={dict.resetPassword} commonDict={dict.common} />
}
