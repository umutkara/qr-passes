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

  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Middleware getUser error:', userError)
    }

    console.log('Middleware - Path:', request.nextUrl.pathname)
    // Check for Supabase session cookies
    const sbAccessToken = request.cookies.get('sb-access-token');
    const sbRefreshToken = request.cookies.get('sb-refresh-token');
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0];
    const sbProjectToken = projectRef ? request.cookies.get(`sb-${projectRef}-auth-token`) : null;

    const hasAuthCookies = sbAccessToken || sbRefreshToken || sbProjectToken;

    console.log('Middleware - Auth cookies present:', hasAuthCookies)

    // Protect panel routes
    if (request.nextUrl.pathname.startsWith('/panel')) {
      if (!hasAuthCookies) {
        console.log('Middleware: No auth cookies, redirecting to login')
        return NextResponse.redirect(new URL('/login', request.url))
      }
      console.log('Middleware: Auth cookies present, allowing access to panel')
    }

    // Redirect authenticated users away from auth pages
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register' || request.nextUrl.pathname === '/forgot-password') {
      if (hasAuthCookies) {
        console.log('Middleware: Auth cookies present on auth page, redirecting to panel')
        return NextResponse.redirect(new URL('/panel', request.url))
      }
    }

  } catch (error) {
    console.error('Middleware error:', error)
    // Continue with request if middleware fails
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}