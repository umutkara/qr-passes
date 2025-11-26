import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const companyId = request.cookies.get('session_company_id')?.value;
  const role = request.cookies.get('session_role')?.value;

  // 🔒 Защита /admin/* — только для admin
  if (pathname.startsWith('/admin')) {
    if (!companyId || role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 🔒 Защита /guard — любой залогиненный (admin или guard)
  if (pathname.startsWith('/guard')) {
    if (!companyId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ❌ БОЛЬШЕ НИКАКИХ РЕДИРЕКТОВ С /login
  // /login всегда просто открывается как есть

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/guard/:path*'],
};
