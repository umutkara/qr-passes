import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../_supabase'
import crypto from "crypto";

function genVerifyToken() {
  return "ks_" + crypto.randomBytes(16).toString("hex");
}

async function getClientId(req: NextRequest): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: company } = await supabaseAdmin
    .from("kyc_clients")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  return company?.id || null
}

export async function POST(req: NextRequest) {
  const clientId = await getClientId(req)
  if (!clientId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });



  const body = await req.json().catch(() => null);

  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });



  const customer_id = String(body.customer_id || "").trim();

  const purpose = body.purpose ? String(body.purpose) : null;



  if (!customer_id) return NextResponse.json({ error: "customer_id required" }, { status: 400 });



  const verify_token = genVerifyToken();



  const { data: session, error } = await supabaseAdmin

    .from("kyc_sessions")

    .insert({

      client_id: clientId,

      customer_id,

      purpose,

      verify_token,

      status: "pending",

    })

    .select("id,verify_token,status")

    .single();



  if (error) return NextResponse.json({ error: error.message }, { status: 500 });



  const botName = process.env.TG_BOT_USERNAME || "passguard_kyc_bot";

  const link = `https://t.me/${botName}?start=${verify_token}`;



  return NextResponse.json({ session_id: session.id, verify_token, status: session.status, link }, { status: 201 });

}
