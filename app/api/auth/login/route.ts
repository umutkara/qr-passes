import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'missing_credentials' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'invalid_credentials' },
        { status: 401 }
      );
    }

    // проверяем пароль по полю password_hash
    if (user.password_hash !== password) {
      return NextResponse.json(
        { error: 'invalid_credentials' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      companyId: user.company_id,
      role: user.role,
    });

    // сохраняем сессию
    res.cookies.set('session_user_id', user.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    res.cookies.set('session_company_id', user.company_id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    res.cookies.set('session_role', user.role, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return res;
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: 'server_error', details: e?.message },
      { status: 500 }
    );
  }
}
