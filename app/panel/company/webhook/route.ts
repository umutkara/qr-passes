import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../api/_supabase'

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

export async function GET(req: NextRequest) {
  const clientId = await getClientId(req)
  if (!clientId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("kyc_clients")
    .select("webhook_url, webhook_secret, webhook_updated_at")
    .eq("id", clientId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  return NextResponse.json({
    webhook_url: data.webhook_url || null,
    webhook_secret: data.webhook_secret,
    webhook_updated_at: data.webhook_updated_at
  });
}

export async function POST(req: NextRequest) {
  const clientId = await getClientId(req)
  if (!clientId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const webhookUrl = body.webhook_url ? String(body.webhook_url).trim() : null;
  const webhookSecret = body.webhook_secret ? String(body.webhook_secret).trim() : null;

  // Валидация URL если он предоставлен
  if (webhookUrl && !webhookUrl.match(/^https?:\/\/.+/)) {
    return NextResponse.json({ error: "Invalid webhook URL format. Must start with http:// or https://" }, { status: 400 });
  }

  // Валидация webhook_secret
  if (!webhookSecret || webhookSecret.length < 10) {
    return NextResponse.json({ error: "Webhook secret must be at least 10 characters long" }, { status: 400 });
  }

  const updateData: any = {
    webhook_secret: webhookSecret,
    webhook_updated_at: new Date().toISOString()
  };

  if (webhookUrl !== undefined) {
    updateData.webhook_url = webhookUrl;
  }

  const { error } = await supabaseAdmin
    .from("kyc_clients")
    .update(updateData)
    .eq("id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    webhook_url: webhookUrl,
    webhook_secret: webhookSecret,
    webhook_updated_at: updateData.webhook_updated_at
  });
}
