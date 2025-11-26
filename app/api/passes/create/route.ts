import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function generatePassCode(): string {
  return (
    'p_' +
    Math.random().toString(36).slice(2, 10) +
    '_' +
    Date.now().toString(36)
  );
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.cookies.get('session_company_id')?.value;

    if (!companyId) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      type,
      fullName,
      carPlate,
      validFrom,
      validUntil,
      singleUse,
    } = body;

    if (!type || !fullName || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: 'missing_fields' },
        { status: 400 }
      );
    }

    const code = generatePassCode();

    const { data, error } = await supabaseAdmin
      .from('passes')
      .insert({
        code,
        type,
        full_name: fullName,
        car_plate: carPlate || null,
        valid_from: validFrom,
        valid_until: validUntil,
        status: 'active',
        company_id: companyId,
        single_use: !!singleUse, // <-- вот здесь сохраняем одноразовость
      })
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
