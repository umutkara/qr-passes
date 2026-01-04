import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const telegramId: number = body.telegramId;
    const type: "document" | "selfie" = body.type;
    const fileUrl: string = body.fileUrl;

    if (!telegramId || !type || !fileUrl) {
      return NextResponse.json(
        { error: "telegramId, type, fileUrl are required" },
        { status: 400 }
      );
    }

    // Находим сессию по telegram_id
    const { data: session, error: findError } = await supabase
      .from("kyc_sessions")
      .select("*")
      .eq("telegram_id", telegramId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("upload-from-telegram find session error:", findError);
      return NextResponse.json(
        { error: "db_error_find", details: findError.message },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "session_not_found" },
        { status: 404 }
      );
    }

    const patch: Record<string, any> = {};
    if (type === "document") {
      patch.document_url = fileUrl;
    } else if (type === "selfie") {
      patch.selfie_url = fileUrl;
    }

    const { data: updated, error: updateError } = await supabase
      .from("kyc_sessions")
      .update(patch)
      .eq("id", session.id)
      .select()
      .single();

    if (updateError) {
      console.error("upload-from-telegram update error:", updateError);
      return NextResponse.json(
        { error: "db_error_update", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, session: updated });
  } catch (e: any) {
    console.error("upload-from-telegram exception:", e);
    return NextResponse.json(
      { error: "internal_error", details: e.message },
      { status: 500 }
    );
  }
}
