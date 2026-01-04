import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const token: string = body.token;
    const telegramId: number = body.telegramId;
    const username: string | null = body.username ?? null;

    if (!token || !telegramId) {
      return NextResponse.json(
        { error: "token and telegramId are required" },
        { status: 400 }
      );
    }

    // Если сессия с таким токеном уже есть — обновляем,
    // иначе создаём новую
    const { data, error } = await supabase
      .from("kyc_sessions")
      .upsert(
        {
          token,
          telegram_id: telegramId,
          telegram_username: username,
        },
        {
          onConflict: "token",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("attach-telegram error:", error);
      return NextResponse.json(
        { error: "db_error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, session: data });
  } catch (e: any) {
    console.error("attach-telegram exception:", e);
    return NextResponse.json(
      { error: "internal_error", details: e.message },
      { status: 500 }
    );
  }
}
