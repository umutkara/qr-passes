import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

// Генерим короткий токен для верификации
function generateVerifyToken() {
  return 'ks_' + crypto.randomBytes(12).toString('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiKey: string | undefined = body?.api_key;
    const customerId: string | undefined = body?.customer_id;
    const purpose: string | undefined = body?.purpose;
    const callbackUrl: string | undefined = body?.callback_url;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'missing_api_key', message: 'api_key обязателен.' },
        { status: 400 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        {
          error: 'missing_customer_id',
          message: 'customer_id обязателен.',
        },
        { status: 400 }
      );
    }

    // 1. Находим клиента по api_key
    const { data: client, error: clientError } = await supabaseAdmin
      .from('kyc_clients')
      .select('id, is_active')
      .eq('api_key', apiKey)
      .single();

    if (clientError || !client) {
      console.error('client lookup error:', clientError);
      return NextResponse.json(
        {
          error: 'invalid_api_key',
          message: 'Клиент с таким api_key не найден.',
        },
        { status: 401 }
      );
    }

    if (!client.is_active) {
      return NextResponse.json(
        {
          error: 'client_inactive',
          message: 'Клиент деактивирован.',
        },
        { status: 403 }
      );
    }

    // 2. Генерим токен для verify-ссылки
    const verifyToken = generateVerifyToken();

    // 3. Создаём запись о KYC-сессии
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('kyc_sessions')
      .insert({
        client_id: client.id,
        customer_id: customerId,
        purpose: purpose ?? null,
        status: 'pending',
        callback_url: callbackUrl ?? null,
        verify_token: verifyToken,
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error('session insert error:', sessionError);
      return NextResponse.json(
        {
          error: 'db_error',
          message: sessionError?.message ?? 'Не удалось создать сессию.',
        },
        { status: 500 }
      );
    }

    // 4. Формируем ссылку для верификации (позже привяжем к реальной странице /verify)
    const origin =
      typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL
        ? process.env.NEXT_PUBLIC_BASE_URL
        : 'http://localhost:3000';

    const verifyUrl = `${origin}/verify/${encodeURIComponent(
      session.verify_token
    )}`;

    return NextResponse.json(
      {
        session_id: session.id,
        verify_token: session.verify_token,
        verify_url: verifyUrl,
        status: session.status,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('create kyc session error:', e);
    return NextResponse.json(
      {
        error: 'server_error',
        message: e?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}
