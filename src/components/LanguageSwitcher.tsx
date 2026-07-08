'use client'

import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/lib/i18n/config'

function persistLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`
}

export default function LanguageSwitcher({ lang }: { lang: Locale }) {
  const pathname = usePathname()
  const router = useRouter()

  function switchTo(locale: Locale) {
    if (locale === lang) return
    persistLocaleCookie(locale)
    const segments = pathname.split('/')
    segments[1] = locale
    router.push(segments.join('/') || `/${locale}`)
  }

  return (
    <div className="flex items-center gap-0.5 border border-line rounded-lg p-0.5">
      {locales.map(locale => (
        <button
          key={locale}
          type="button"
          onClick={() => switchTo(locale)}
          aria-current={locale === lang}
          className={`text-xs font-medium rounded-md px-2 py-1 transition-colors ${
            locale === lang ? 'bg-hi text-canvas' : 'text-mid hover:text-hi'
          }`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
