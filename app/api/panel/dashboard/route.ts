import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../_supabase'

export async function GET(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }



  // Get company by owner_user_id
  const { data: company, error: companyError } = await supabaseAdmin
    .from("kyc_clients")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  if (companyError || !company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }

  const clientId = company.id

  // Всего
  const { count: total } = await supabaseAdmin
    .from("kyc_sessions")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);



  // Approved

  const { count: approved } = await supabaseAdmin

    .from("kyc_sessions")

    .select("*", { count: "exact", head: true })

    .eq("client_id", clientId)

    .eq("status", "approved");



  // Rejected

  const { count: rejected } = await supabaseAdmin

    .from("kyc_sessions")

    .select("*", { count: "exact", head: true })

    .eq("client_id", clientId)

    .eq("status", "rejected");



  // Pending / in progress

  const { count: pending } = await supabaseAdmin

    .from("kyc_sessions")

    .select("*", { count: "exact", head: true })

    .eq("client_id", clientId)

    .in("status", ["pending", "started", "document_uploaded", "video_uploaded"]);



  // Today

  const today = new Date();

  today.setHours(0, 0, 0, 0);



  const { count: todayCount } = await supabaseAdmin

    .from("kyc_sessions")

    .select("*", { count: "exact", head: true })

    .eq("client_id", clientId)

    .gte("created_at", today.toISOString());



  // Get full company info
  const { data: companyData, error: companyDataError } = await supabaseAdmin
    .from("kyc_clients")
    .select("id,name,public_id,api_key,balance_usd,webhook_url,webhook_updated_at")
    .eq("id", clientId)
    .maybeSingle();

  if (companyDataError) {
    return NextResponse.json({ error: "Failed to load company data" }, { status: 500 });
  }

  return NextResponse.json({
    total: total || 0,
    approved: approved || 0,
    rejected: rejected || 0,
    pending: pending || 0,
    today: todayCount || 0,
    company: companyData
  });

}



