import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in middleware')
    return NextResponse.next()
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Check for Supabase session cookies
    const hasSupabaseSession = request.cookies.get('sb-[project]-auth-token') ||
                              request.cookies.get('sb-wuhekeqkmohbwgwprvpo-auth-token');

    console.log('Middleware check - Path:', request.nextUrl.pathname);
    console.log('Middleware check - Has Supabase session cookie:', !!hasSupabaseSession);

    // Also try to get user from Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('Middleware check - User from getUser():', !!user);
    if (user) {
      console.log('Middleware check - User ID:', user.id);
    }

    // Protect panel routes
    if (request.nextUrl.pathname.startsWith('/panel')) {
      if (!user && !hasSupabaseSession) {
        console.log('Middleware: No user/session found, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url))
      }
      console.log('Middleware: User authenticated, allowing access to panel');
    }

    // Redirect authenticated users away from auth pages
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register' || request.nextUrl.pathname === '/forgot-password') {
      if (user || hasSupabaseSession) {
        console.log('Middleware: Authenticated user on auth page, redirecting to panel');
        return NextResponse.redirect(new URL('/panel', request.url))
      }
    }
  } catch (error) {
    console.error('Middleware Supabase error:', error)
    // If Supabase fails, allow the request to continue
    // This prevents 500 errors when Supabase is misconfigured
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
