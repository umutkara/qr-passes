import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const companyId = req.cookies.get('session_company_id')?.value;
    const guardUserId = req.cookies.get('session_user_id')?.value || null;

    if (!companyId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body || !body.code) {
      return NextResponse.json({ error: 'missing_code' }, { status: 400 });
    }

    const code = String(body.code);

    // Ищем пропуск по коду и компании
    const { data: pass, error } = await supabaseAdmin
      .from('passes')
      .select('*')
      .eq('code', code)
      .eq('company_id', companyId)
      .single();

    // Не найден
    if (error || !pass) {
      await supabaseAdmin.from('pass_logs').insert({
        pass_id: null,
        company_id: companyId,
        guard_user_id: guardUserId,
        result: 'not_found',
      });

      return NextResponse.json(
        { ok: false, result: 'not_found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const from = new Date(pass.valid_from);
    const until = new Date(pass.valid_until);

    let result: 'ok' | 'expired' | 'cancelled' | 'used' = 'ok';

    // Проверка статуса отмены
    if (pass.status === 'cancelled') {
      result = 'cancelled';
    } else if (now < from || now > until) {
      // Срок действия
      result = 'expired';
    } else if (pass.status === 'used' && pass.single_use) {
      // Одноразовый — уже использован
      result = 'used';
    } else {
      // Успешный проход
      result = 'ok';
    }

    // Если одноразовый и всё нормально → помечаем использованным
    if (result === 'ok' && pass.single_use && pass.status === 'active') {
      await supabaseAdmin
        .from('passes')
        .update({ status: 'used' })
        .eq('id', pass.id)
        .eq('company_id', companyId);
      pass.status = 'used'; // обновим локально, чтобы вернуть актуальный статус
    }

    // Логируем результат
    await supabaseAdmin.from('pass_logs').insert({
      pass_id: pass.id,
      company_id: companyId,
      guard_user_id: guardUserId,
      result,
    });

    return NextResponse.json(
      {
        ok: result === 'ok',
        result,
        pass,
      },
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
