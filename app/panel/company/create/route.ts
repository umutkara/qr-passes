import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../api/_supabase";
import crypto from "crypto";

function genPublicId() {
  return "cl_" + crypto.randomBytes(6).toString("hex");
}
function genApiKey() {
  return "pk_" + crypto.randomBytes(24).toString("hex");
}
function genWebhookSecret() {
  return "whsec_" + crypto.randomBytes(24).toString("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const tgId = Number(body.tg_id);
  const name = (body.name || "").trim();
  const contact_email = body.contact_email || null;

  if (!tgId) return NextResponse.json({ error: "tg_id required" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  // if already exists -> return existing
  const existing = await supabaseAdmin
    .from("kyc_clients")
    .select("id,name,public_id,api_key,webhook_secret")
    .eq("telegram_admin_id", tgId)
    .maybeSingle();

  if (existing.data) return NextResponse.json({ company: existing.data });

  const { data, error } = await supabaseAdmin
    .from("kyc_clients")
    .insert({
      name,
      contact_email,
      contact_telegram: null,
      public_id: genPublicId(),
      api_key: genApiKey(),
      webhook_secret: genWebhookSecret(),
      telegram_admin_id: tgId,
      is_active: true,
    })
    .select("id,name,public_id,api_key,webhook_secret")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: data }, { status: 201 });
}
