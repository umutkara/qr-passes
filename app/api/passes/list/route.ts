import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const companyId = req.cookies.get('session_company_id')?.value;

    if (!companyId) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // optional filter

    let query = supabaseAdmin
      .from('passes')
      .select('*')
      .eq('company_id', companyId)
      .order('valid_from', { ascending: false })
      .limit(100);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: 'db_error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { passes: data ?? [] },
      { status: 200 }
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: 'server_error', details: e?.message },
      { status: 500 }
    );
  }
}
