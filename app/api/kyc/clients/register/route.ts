import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

function generatePublicId() {
  // короткий публичный ID клиента
  return 'kc_' + crypto.randomBytes(6).toString('hex');
}

function generateApiKey() {
  // секретный API-ключ, который будем показывать клиенту один раз
  return 'pk_' + crypto.randomBytes(24).toString('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name: string | undefined = body?.name;
    const contactEmail: string | undefined = body?.contact_email;
    const contactTelegram: string | undefined = body?.contact_telegram;
    const tonWallet: string | undefined = body?.ton_wallet;

    if (!name) {
      return NextResponse.json(
        { error: 'missing_name', message: 'Название компании обязательно.' },
        { status: 400 }
      );
    }

    const publicId = generatePublicId();
    const apiKey = generateApiKey();

    const { data, error } = await supabaseAdmin
      .from('kyc_clients')
      .insert({
        name,
        contact_email: contactEmail ?? null,
        contact_telegram: contactTelegram ?? null,
        ton_wallet: tonWallet ?? null,
        public_id: publicId,
        api_key: apiKey,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'db_error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        client_id: data.id,
        public_id: data.public_id,
        api_key: apiKey, // показываем ключ в ответе, бот потом отдаст его компании
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('register client error:', e);
    return NextResponse.json(
      {
        error: 'server_error',
        details: e?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}
