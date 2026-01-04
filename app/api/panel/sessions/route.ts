import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../_supabase'

async function getClientId(req: NextRequest): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in sessions API')
    return null
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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

export async function GET(req: NextRequest) {
  const clientId = await getClientId(req)
  if (!clientId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });



  const { data, error } = await supabaseAdmin

    .from("kyc_sessions")

    .select("id,customer_id,status,verify_token,created_at")

    .eq("client_id", clientId)

    .order("created_at", { ascending: false })

    .limit(20);



  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sessions: data || [] });

}
