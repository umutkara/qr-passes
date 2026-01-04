import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const companyId = req.cookies.get('session_company_id')?.value;
    if (!companyId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('passes')
      .update({ status: 'used' })
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: 'server_error', details: e?.message },
      { status: 500 }
    );
  }
}
