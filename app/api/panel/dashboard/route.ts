import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../_supabase'

export async function GET(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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

  // Check authentication via cookies (same as panel layout)
  const allCookies = req.cookies.getAll();
  console.log('API dashboard - all cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

  const sbAccessToken = req.cookies.get('sb-access-token');
  const sbRefreshToken = req.cookies.get('sb-refresh-token');
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0];
  const sbProjectToken = projectRef ? req.cookies.get(`sb-${projectRef}-auth-token`) : null;

  console.log('API dashboard - auth cookies check:', {
    sbAccessToken: !!sbAccessToken,
    sbRefreshToken: !!sbRefreshToken,
    sbProjectToken: !!sbProjectToken,
    projectRef
  });

  if (!sbAccessToken && !sbRefreshToken && !sbProjectToken) {
    console.log('API dashboard - no auth cookies found, returning 401');
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  console.log('API dashboard - auth cookies present, proceeding');

  // Decode JWT token to get user ID
  let userId = null;
  if (sbAccessToken) {
    try {
      // Simple JWT decode (without verification for now)
      const payload = sbAccessToken.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      userId = decoded.sub;
      console.log('API dashboard - decoded user ID from token:', userId);
    } catch (error) {
      console.error('API dashboard - failed to decode token:', error);
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
  }



  // Get company by owner_user_id
  const { data: company, error: companyError } = await supabaseAdmin
    .from("kyc_clients")
    .select("id")
    .eq("owner_user_id", userId)
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



