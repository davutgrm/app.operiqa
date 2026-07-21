import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config'

function getLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale
  }
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  if (acceptLanguage.toLowerCase().startsWith('tr')) return 'tr'
  return defaultLocale
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Route Handlers (/api/*) and the fixed Supabase callback URL (/auth/callback)
  // stay outside the [lang] segment and skip locale handling entirely.
  if (pathname.startsWith('/api') || pathname.startsWith('/auth/')) {
    const { data: { user } } = await supabase.auth.getUser()
    const PUBLIC_API_PATHS = ['/api/webhook', '/api/n8n-callback', '/api/video-callback', '/auth/callback']
    if (!user && !PUBLIC_API_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL(`/${getLocale(request)}/login`, request.url))
    }
    return supabaseResponse
  }

  const pathnameLocale = locales.find(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (!pathnameLocale) {
    const locale = getLocale(request)
    return NextResponse.redirect(new URL(`/${locale}${pathname}${request.nextUrl.search}`, request.url))
  }

  const { data: { user } } = await supabase.auth.getUser()
  const pathWithoutLocale = pathname.slice(`/${pathnameLocale}`.length) || '/'

  const PUBLIC_PATHS = ['/login', '/signup', '/auth/reset-password']
  if (!user && !PUBLIC_PATHS.includes(pathWithoutLocale)) {
    return NextResponse.redirect(new URL(`/${pathnameLocale}/login`, request.url))
  }

  if (user && (pathWithoutLocale === '/login' || pathWithoutLocale === '/signup')) {
    return NextResponse.redirect(new URL(`/${pathnameLocale}`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
