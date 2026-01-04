import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../_supabase";
import { genPublicId, genApiKey, genWebhookSecret } from "@/lib/keys";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const { owner_user_id, name, contact_email, contact_telegram } = body;

    // Validation
    if (!owner_user_id || typeof owner_user_id !== 'string') {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: "Company name must be at least 2 characters long" }, { status: 400 });
    }

    if (!contact_email || typeof contact_email !== 'string' || !contact_email.includes('@')) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    // Check if user already has a company
    const existing = await supabaseAdmin
      .from("kyc_clients")
      .select("id")
      .eq("owner_user_id", owner_user_id)
      .maybeSingle();

    if (existing.data) {
      return NextResponse.json({ error: "User already has a company" }, { status: 409 });
    }

    // Generate keys
    const publicId = genPublicId();
    const apiKey = genApiKey();
    const webhookSecret = genWebhookSecret();

    // Create company record
    const { data, error } = await supabaseAdmin
      .from("kyc_clients")
      .insert({
        owner_user_id,
        name: name.trim(),
        contact_email: contact_email.trim(),
        contact_telegram: contact_telegram ? contact_telegram.trim() : null,
        public_id: publicId,
        api_key: apiKey,
        webhook_secret: webhookSecret,
        balance_usd: 0,
        is_active: true
      })
      .select("id, name, public_id, api_key, contact_email, contact_telegram")
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      company: {
        id: data.id,
        name: data.name,
        public_id: data.public_id,
        api_key: data.api_key,
        contact_email: data.contact_email,
        contact_telegram: data.contact_telegram
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
