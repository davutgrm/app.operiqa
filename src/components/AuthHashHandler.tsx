'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { locales, defaultLocale } from '@/lib/i18n/config'

export default function AuthHashHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.substring(1)
    if (!hash) return
    const params = new URLSearchParams(hash)
    if (params.get('type') === 'recovery') {
      const segment = pathname.split('/')[1]
      const lang = (locales as readonly string[]).includes(segment) ? segment : defaultLocale
      router.replace(`/${lang}/auth/reset-password` + window.location.hash)
    }
  }, [router, pathname])

  return null
}
