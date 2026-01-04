import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_STATUSES = ['active', 'used', 'cancelled', 'expired'];

export async function POST(req: NextRequest) {
  try {
    const companyId = req.cookies.get('session_company_id')?.value;

    if (!companyId) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    const { passId, status } = await req.json();

    if (!passId || !status) {
      return NextResponse.json(
        { error: 'missing_fields' },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'invalid_status' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('passes')
      .update({ status })
      .eq('id', passId)
      .eq('company_id', companyId);

    if (error) {
      console.error('db error', error);
      return NextResponse.json(
        { error: 'db_error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error('status route error', e);
    return NextResponse.json(
      { error: 'server_error', details: e?.message },
      { status: 500 }
    );
  }
}
