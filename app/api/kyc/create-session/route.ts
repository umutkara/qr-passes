import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

export async function POST(req: Request) {
  try {
    const { companyId, externalUserId } = await req.json();

    if (!companyId || !externalUserId) {
      return NextResponse.json(
        { error: "companyId and externalUserId are required" },
        { status: 400 }
      );
    }

    const token = crypto.randomUUID();

    const { error } = await supabase.from("kyc_sessions").insert({
      token,
      company_id: companyId,
      external_user_id: externalUserId,
      status: "pending",
      source: "telegram",
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    const botUsername = process.env.TG_BOT_USERNAME; // например: "pass_guard_bot"
    const tgLink = `https://t.me/${botUsername}?start=${token}`;

    const webLink = `${process.env.NEXT_PUBLIC_SITE_URL}/kyc/${token}`;

    return NextResponse.json({
      token,
      tgLink,
      webLink,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
