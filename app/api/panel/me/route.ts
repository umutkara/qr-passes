import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "../../_supabase";



export async function GET(req: NextRequest) {

  const clientId = req.cookies.get("pg_client_id")?.value;

  if (!clientId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });



  const { data, error } = await supabaseAdmin

    .from("kyc_clients")

    .select("id,name,public_id,api_key,webhook_secret")

    .eq("id", clientId)

    .maybeSingle();



  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) return NextResponse.json({ error: "Company not found" }, { status: 404 });



  return NextResponse.json({ company: data });

}
