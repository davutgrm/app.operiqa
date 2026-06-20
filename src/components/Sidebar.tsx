'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

interface Props {
  userEmail: string
}

const NAV = [
  {
    href: '/dashboard',
    label: 'Oluştur',
    icon: (
      <svg className="w-[15px] h-[15px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'Geçmiş',
    icon: (
      <svg className="w-[15px] h-[15px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: (
      <svg className="w-[15px] h-[15px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]

export default function Sidebar({ userEmail }: Props) {
  const pathname = usePathname()

  return (
    <aside className="sidebar fixed left-0 top-0 h-screen w-60 flex flex-col z-30">

      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 flex-shrink-0 border-b sidebar-line">
        <div className="logo-mark w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-canvas" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-[13px] font-medium text-hi" style={{ letterSpacing: '0.16em' }}>
          OPERIQA
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${active ? 'active' : ''}`}
            >
              {icon}
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: theme toggle + email */}
      <div className="px-5 py-4 flex-shrink-0 border-t sidebar-line flex items-center justify-between gap-2">
        <p className="text-[11px] text-mute truncate tracking-wide min-w-0">{userEmail}</p>
        <ThemeToggle />
      </div>
    </aside>
  )
}
