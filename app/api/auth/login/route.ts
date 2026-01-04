import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    console.log('API login - received:', { email: email ? 'present' : 'missing', password: password ? 'present' : 'missing' });

    const supabase = supabaseServer();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    console.log('API login - result:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message
    });

    if (error) {
      console.error('API login - error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      console.error('API login - no user in response');
      return NextResponse.json({ error: 'Authentication failed' }, { status: 400 });
    }

    console.log('API login - success, user:', data.user.email);
    return NextResponse.json({ ok: true, user: data.user.email });

  } catch (err) {
    console.error('API login - unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}