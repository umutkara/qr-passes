import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Затираем все сессионные куки
  res.cookies.set('session_user_id', '', {
    maxAge: 0,
    path: '/',
  });
  res.cookies.set('session_company_id', '', {
    maxAge: 0,
    path: '/',
  });
  res.cookies.set('session_role', '', {
    maxAge: 0,
    path: '/',
  });

  return res;
}
