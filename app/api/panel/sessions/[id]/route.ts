import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "../../../_supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientId = req.cookies.get("pg_client_id")?.value;

  if (!clientId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("kyc_sessions")
    .select("id,customer_id,status,verify_token,created_at,ml_result,ai_result,final_status,reviewed_at")
    .eq("id", id)
    .eq("client_id", clientId)
    .single();

  if (error) {
    console.error('Supabase error in sessions/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session: data });
}
