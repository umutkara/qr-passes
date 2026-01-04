// app/api/kyc/start/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BOT_USERNAME = process.env.TG_BOT_USERNAME!; // например: passguard_kyc_bot

const supabase = createClient(supabaseUrl, serviceRoleKey);

function generateVerifyToken() {
  return "ks_" + crypto.randomBytes(12).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1) Аутентификация клиента (компании) по API-ключу
    //    Компания может передать api_key:
    //    - в заголовке:  X-API-Key: ...
    //    - или в body:   { api_key: "..." }
    const apiKey =
      req.headers.get("x-api-key") ??
      body.api_key ??
      body.apiKey ??
      null;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key. Send it in 'X-API-Key' header or in body.api_key" },
        { status: 401 }
      );
    }

    const { data: client, error: clientError } = await supabase
      .from("kyc_clients")
      .select("id, name, is_active")
      .eq("api_key", apiKey)
      .single();

    if (clientError || !client) {
      console.error("clientError:", clientError);
      return NextResponse.json(
        { error: "Client not found or API key invalid" },
        { status: 401 }
      );
    }

    if (!client.is_active) {
      return NextResponse.json(
        { error: "Client is inactive" },
        { status: 403 }
      );
    }

    // 2) Параметры KYC-сессии от компании
    //    customer_id — это ИХ внутренний ID клиента (или телефон, или email)
    const {
      customer_id,
      purpose,
      callback_url,
    }: {
      customer_id?: string;
      purpose?: string;
      callback_url?: string;
    } = body;

    if (!customer_id) {
      return NextResponse.json(
        { error: "customer_id is required in body" },
        { status: 400 }
      );
    }

    const verifyToken = generateVerifyToken();

    // 3) Создаём запись в kyc_sessions
    const { data: kycSession, error: sessionError } = await supabase
      .from("kyc_sessions")
      .insert({
        client_id: client.id,
        customer_id,
        purpose: purpose ?? null,
        callback_url: callback_url ?? null,
        verify_token: verifyToken,
        status: "pending", // стартуем как pending
      })
      .select("id, verify_token, status, created_at")
      .single();

    if (sessionError || !kycSession) {
      console.error("sessionError:", sessionError);
      return NextResponse.json(
        { error: "Failed to create kyc_session" },
        { status: 500 }
      );
    }

    // 4) Формируем ссылку на Telegram-бота
    //    Пример: https://t.me/passguard_kyc_bot?start=<verify_token>
    const link = `https://t.me/${BOT_USERNAME}?start=${kycSession.verify_token}`;

    return NextResponse.json(
      {
        session_id: kycSession.id,
        verify_token: kycSession.verify_token,
        status: kycSession.status,
        link,
        created_at: kycSession.created_at,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("KYC start route error:", err?.message ?? err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
