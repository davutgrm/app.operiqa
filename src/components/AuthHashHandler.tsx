'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthHashHandler() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.substring(1)
    if (!hash) return
    const params = new URLSearchParams(hash)
    if (params.get('type') === 'recovery') {
      router.replace('/auth/reset-password' + window.location.hash)
    }
  }, [router])

  return null
}
