import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in middleware')
    return NextResponse.next()
  }

  // Create server client for session checking
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update both request and response cookies
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Auth protection moved to app/panel/layout.tsx (server component)
  // This middleware auth check is disabled to avoid conflicts
  /*
  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Middleware getUser error:', userError)
    }

    console.log('Middleware - Path:', request.nextUrl.pathname)
    console.log('Middleware - User:', user ? user.email : 'null')
    console.log('Middleware - Cookies:', request.cookies.getAll().map(c => c.name))

    // Protect panel routes
    if (request.nextUrl.pathname.startsWith('/panel')) {
      if (!user) {
        console.log('Middleware: No authenticated user, redirecting to login')
        return NextResponse.redirect(new URL('/login', request.url))
      }
      console.log('Middleware: User authenticated, allowing access to panel')
    }

    // Redirect authenticated users away from auth pages
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register' || request.nextUrl.pathname === '/forgot-password') {
      if (user) {
        console.log('Middleware: Authenticated user on auth page, redirecting to panel')
        return NextResponse.redirect(new URL('/panel', request.url))
      }
    }

  } catch (error) {
    console.error('Middleware error:', error)
    // Continue with request if middleware fails
  }
  */

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}