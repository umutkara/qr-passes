import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_STATUSES = ['active', 'cancelled', 'used'] as const;
type PassStatus = (typeof ALLOWED_STATUSES)[number];

export async function POST(req: NextRequest) {
  try {
    const companyId = req.cookies.get('session_company_id')?.value;

    if (!companyId) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { id, status } = body as {
      id?: string;
      status?: PassStatus;
    };

    if (!id || !status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'bad_request' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('passes')
      .update({ status })
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: 'db_error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { pass: data },
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
