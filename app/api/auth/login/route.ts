import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    console.log('API login - start');

    const { email, password } = await req.json();
    console.log('API login - parsed body:', { email: email ? 'present' : 'missing', password: password ? 'present' : 'missing' });

    console.log('API login - creating supabase client');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    console.log('API login - supabase client created');

    console.log('API login - calling signInWithPassword');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('API login - signInWithPassword completed');

    console.log('API login - result:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message,
      errorName: error?.name
    });

    if (error) {
      console.error('API login - auth error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user || !data.session) {
      console.error('API login - no user or session in response');
      return NextResponse.json({ error: 'Authentication failed' }, { status: 400 });
    }

    console.log('API login - success, user:', data.user.email);

    // Create response and set auth cookies manually
    const response = NextResponse.json({ ok: true, user: data.user.email });

    // Set Supabase auth cookies
    const { access_token, refresh_token } = data.session;
    if (access_token) {
      response.cookies.set('sb-access-token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }
    if (refresh_token) {
      response.cookies.set('sb-refresh-token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365 // 1 year
      });
    }

    // Set the project-specific cookie name
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0];
    if (projectRef && access_token) {
      response.cookies.set(`sb-${projectRef}-auth-token`, access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      });
    }

    return response;

  } catch (err) {
    console.error('API login - unexpected error:', err);
    console.error('API login - error stack:', err instanceof Error ? err.stack : 'no stack');
    return NextResponse.json({
      error: 'Internal server error',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}