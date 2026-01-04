import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../_supabase";

export async function POST(req: NextRequest) {
  const clientId = req.cookies.get("pg_client_id")?.value;
  if (!clientId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const webhookUrl = body.webhook_url ? String(body.webhook_url).trim() : null;

  // Валидация URL если он предоставлен
  if (webhookUrl && !webhookUrl.match(/^https?:\/\/.+/)) {
    return NextResponse.json({ error: "Invalid webhook URL format" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("kyc_clients")
    .update({ webhook_url: webhookUrl })
    .eq("id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, webhook_url: webhookUrl });
}



