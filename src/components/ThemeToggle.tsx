'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('operiqa-theme')
    const initial = saved === 'light' ? 'light' : 'dark'
    setTheme(initial)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem('operiqa-theme', next)
  }

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
      style={{
        border: '1px solid var(--sidebar-line)',
        background: 'transparent',
        color: 'var(--color-low)',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)'
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent-ring)'
        ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-muted)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-low)'
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sidebar-line)'
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {theme === 'dark' ? (
        /* Sun icon — click to go light */
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        /* Moon icon — click to go dark */
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  )
}
