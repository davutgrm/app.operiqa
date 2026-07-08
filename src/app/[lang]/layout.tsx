import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ThemeProvider from '@/components/ThemeProvider'
import AuthHashHandler from '@/components/AuthHashHandler'
import { locales, toLocale, type Locale } from '@/lib/i18n/config'
import '../globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const descriptions: Record<Locale, string> = {
  fr: 'Génération de visuels lifestyle par IA',
  tr: 'Yapay zeka ile lifestyle görsel üretimi',
}

export function generateStaticParams() {
  return locales.map(lang => ({ lang }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = toLocale((await params).lang)
  return {
    title: 'Operiqa',
    description: descriptions[lang],
    icons: {
      icon: [
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
  }
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const lang = toLocale((await params).lang)
  return (
    <html lang={lang} className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full font-sans antialiased">
        <ThemeProvider>
          <AuthHashHandler />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
