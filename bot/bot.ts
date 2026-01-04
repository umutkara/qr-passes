import { config } from "dotenv";
import { Telegraf } from "telegraf";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// -------------------------
// ENV
// -------------------------
config(); // .env / .env.local
config({ path: resolve(process.cwd(), ".env.bot") }); // .env.bot

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

console.log("DEBUG SUPABASE_URL =", SUPABASE_URL);
console.log(
  "DEBUG SERVICE ROLE KEY prefix =",
  SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.slice(0, 10) : "EMPTY"
);
console.log("DEBUG TELEGRAM_BOT_TOKEN set =", !!TELEGRAM_BOT_TOKEN);
console.log("DEBUG API_BASE_URL =", API_BASE_URL);

if (!SUPABASE_URL) throw new Error("❌ SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL is missing");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("❌ SUPABASE_SERVICE_ROLE_KEY is missing");
if (!TELEGRAM_BOT_TOKEN) throw new Error("❌ TELEGRAM_BOT_TOKEN is missing");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// -------------------------
function signWebhook(payload: string, secret: string, timestamp: number) {
  const signed = `${timestamp}.${payload}`;

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(signed)
    .digest("hex");

  return `t=${timestamp},v1=${hmac}`;
}

// -------------------------
// Upload to Supabase Storage
// -------------------------
async function uploadMedia(buffer: Buffer, filename: string) {
  const bucket = "kyc-media";

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, {
      contentType: "application/octet-stream",
      upsert: true,
    });

  if (error) {
    console.error("❌ Upload error:", error);
    throw new Error("Upload failed: " + error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  console.log("✅ Uploaded media, publicUrl =", data.publicUrl);
  return data.publicUrl;
}

// -------------------------
// /start — verify_token
// -------------------------
bot.start(async (ctx) => {
  const token = ctx.startPayload;
  const tgId = ctx.from?.id;

  console.log("➡ /start called, token =", token, "tgId =", tgId);

  if (!token) {
    await ctx.reply("Привет 👋\nЧтобы пройти KYC — используй персональную ссылку.");
    return;
  }

  let { data: session, error } = await supabase
    .from("kyc_sessions")
    .select("id, verify_token, status, created_at")
    .eq("verify_token", token)
    .maybeSingle();

  // Если точное совпадение не найдено, попробуем найти по префиксу
  // (в случае если Telegram обрезал токен)
  if (!session && token.startsWith("ks_")) {
    const { data: sessions, error: prefixError } = await supabase
      .from("kyc_sessions")
      .select("id, verify_token, status, created_at")
      .like("verify_token", `${token}%`)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!prefixError && sessions && sessions.length > 0) {
      session = sessions[0];
      console.log("Found session by prefix match:", session.verify_token);
    }
  }

  console.log("Supabase /start result:", { error, session });

  if (error) {
    console.error("❌ Supabase error in /start:", error);
    await ctx.reply("Произошла ошибка при поиске сессии. Попробуй позже.");
    return;
  }

  if (!session) {
    await ctx.reply("Ссылка невалидна или устарела.");
    return;
  }

  await supabase
    .from("kyc_sessions")
    .update({
      telegram_user_id: tgId,
      status: "started",
    })
    .eq("id", session.id);

  await ctx.reply(
    "Сессия найдена! 📄\nПришли *фото документа* (паспорт/ID).",
    { parse_mode: "Markdown" }
  );
});

// -------------------------
// 1️⃣ Фото документа
// -------------------------
bot.on("photo", async (ctx) => {
  const tgId = ctx.from?.id;
  console.log("➡ photo from tgId =", tgId);

  if (!tgId) {
    await ctx.reply("Не могу определить твой Telegram ID.");
    return;
  }

  const { data: session, error } = await supabase
    .from("kyc_sessions")
    .select("id, verify_token, status, created_at, document_url, video_url")
    .eq("telegram_user_id", tgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log("Supabase photo session:", { error, hasSession: !!session, document_url: session?.document_url });

  if (error) {
    console.error("❌ Supabase error in photo handler:", error);
    await ctx.reply("Ошибка при поиске сессии. Попробуй позже.");
    return;
  }

  if (!session) {
    await ctx.reply("Нет активной KYC-сессии. Открой персональную ссылку ещё раз.");
    return;
  }

  // Проверяем наличие документа по URL
  if (session.document_url) {
    await ctx.reply(
      "Документ уже загружен ✔\nТеперь пришли *видео 2–3 секунды*.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const photos = ctx.message.photo;
  const fileId = photos[photos.length - 1].file_id;
  const fileLink = await ctx.telegram.getFileLink(fileId);

  console.log("Downloading document from:", fileLink.href);
  const fileResp = await fetch(fileLink.href);
  const buffer = Buffer.from(await fileResp.arrayBuffer());

  const filename = `doc_${session.id}_${Date.now()}.jpg`;
  const docUrl = await uploadMedia(buffer, filename);

  console.log("Document uploaded to:", docUrl);

  // Сохраняем URL документа в базу данных
  const { data: updated, error: updError } = await supabase
    .from("kyc_sessions")
    .update({
      document_url: docUrl,
      status: "document_uploaded",
    })
    .eq("id", session.id)
    .select();

  console.log("Document URL update result:", { updError, updated });

  if (updError) {
    console.error("❌ Supabase update error (document_url):", updError);
    await ctx.reply("Ошибка при сохранении документа. Попробуй ещё раз.");
    return;
  }

  await ctx.reply(
    "Документ получен ✔\nТеперь пришли *видео 2–3 секунды* (селфи-видео).",
    { parse_mode: "Markdown" }
  );
});

// -------------------------
// 2️⃣ Видео (селфи + liveness)
// -------------------------
bot.on("video", async (ctx) => {
  const tgId = ctx.from?.id;
  console.log("➡ video from tgId =", tgId);

  if (!tgId) {
    await ctx.reply("Не могу определить твой Telegram ID.");
    return;
  }

  const { data: session, error } = await supabase
    .from("kyc_sessions")
    .select("id, verify_token, status, created_at, document_url, video_url, client_id, customer_id, final_status")
    .eq("telegram_user_id", tgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log("Supabase video session:", { error, hasSession: !!session, document_url: session?.document_url });

  if (error) {
    console.error("❌ Supabase error in video handler:", error);
    await ctx.reply("Ошибка при поиске сессии. Попробуй позже.");
    return;
  }

  if (!session) {
    await ctx.reply("Нет активной KYC-сессии. Сначала открой ссылку /start.");
    return;
  }

  // Проверяем наличие документа по URL
  if (!session.document_url) {
    await ctx.reply("Сначала пришли *фото документа*.", {
      parse_mode: "Markdown",
    });
    return;
  }

  const fileId = ctx.message.video.file_id;
  const file = await ctx.telegram.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;

  console.log("Downloading video from:", fileUrl);

  const r = await fetch(fileUrl);
  const buffer = Buffer.from(await r.arrayBuffer());

  const filename = `video_${session.id}_${Date.now()}.mp4`;
  const videoUrl = await uploadMedia(buffer, filename);

  console.log("Video uploaded to:", videoUrl);

  // Сохраняем URL видео в базу данных
  const { data: updated, error: updError } = await supabase
    .from("kyc_sessions")
    .update({
      video_url: videoUrl,
      status: "video_uploaded",
    })
    .eq("id", session.id)
    .select();

  console.log("Video URL update result:", { updError, updated });

  if (updError) {
    console.error("❌ Supabase update error (video_url):", updError);
    await ctx.reply("Ошибка при сохранении видео. Попробуй ещё раз.");
    return;
  }

  await ctx.reply("Видео получено 🎥\nПроверяю данные...");

  // -----------------------------
  // Запрос в ML /verify
  // -----------------------------
  const payload = {
    sessionId: session.id,
    documentUrl: session.document_url, // Получаем из базы данных
    videoUrl: videoUrl,
    selfieUrl: null,
    country: "AZ",
    documentType: "ID_CARD",
  };

  console.log("➡ Sending to ML /verify:", payload);

  const ml = await fetch(`${ML_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log("ML /verify status =", ml.status);

  if (!ml.ok) {
    const txt = await ml.text();
    console.error("❌ ML error:", txt);
    await ctx.reply("Ошибка ML-сервиса:\n" + txt);
    return;
  }

  const result = await ml.json();

  // ШАГ 1 — Сохраняем ML-результат
  await supabase
    .from("kyc_sessions")
    .update({
      ml_result: result,
      status: "ml_checked",
    })
    .eq("id", session.id);

  console.log("✅ ML result saved with status: ml_checked");

  // ЧАСТЬ 3 — ЗАЩИТА ОТ ПОВТОРА
  if (session.final_status) {
    console.log("Session already finalized with", session.final_status, "- skip AI review");
    await ctx.reply("Результат ML:");
    await ctx.reply("```json\n" + JSON.stringify(result, null, 2) + "\n```", {
      parse_mode: "Markdown",
    });
    await ctx.reply(`KYC завершён ✅\nФинальный статус: ${session.final_status}`);
    return;
  }

  // ШАГ 2 — AI review через API endpoint с полным ml_result + evidence URLs
  console.log("🔥 CALLING AI REVIEW FOR SESSION", session.id);

  let aiResult = null;
  let finalStatus = "manual_review";

  try {
    console.log("🤖 Calling AI review API with full ml_result and evidence URLs...");
    const aiResponse = await fetch("http://localhost:3000/api/ai/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: session.id,
        ml_result: result,
        document_url: session.document_url,
        video_url: videoUrl
      }),
    });

    const aiText = await aiResponse.text();
    console.log("🤖 AI /review status:", aiResponse.status);
    console.log("🤖 AI /review body:", aiText);

    if (!aiResponse.ok) {
      console.error("❌ AI review API error:", aiResponse.status, aiText);
      await ctx.reply("AI review failed:\n" + aiText);
      throw new Error(`AI review API error: ${aiResponse.status}`);
    }

    const aiData = JSON.parse(aiText);
    aiResult = aiData.aiResult;
    finalStatus = aiData.finalStatus || aiResult?.final_verdict || "manual_review";

    console.log("✅ AI review completed:", aiResult, "finalStatus:", finalStatus);

    // Optional: show short summary to user
    await ctx.reply("AI verdict: " + finalStatus);

  } catch (aiError) {
    console.error("❌ AI review failed:", aiError);

    // Fallback если AI endpoint упал
    const fallbackAi = {
      session_id: session.id,
      evidence: {
        document_url: session.document_url ?? null,
        video_url: videoUrl ?? null,
      },
      extracted_identity: null,
      analysis: {
        face_match: { result: "unknown", score: null, notes: ["AI endpoint unavailable"] },
        liveness: { result: "unknown", score: null, notes: ["AI endpoint unavailable"] },
        document: {
          quality: "unknown",
          expired: "unknown",
          notes: ["AI endpoint unavailable"]
        },
        ocr_notes: []
      },
      human_review_summary: {
        what_ml_said: [],
        what_i_verified: [],
        inconsistencies_or_risks: ["AI endpoint unavailable"],
        recommended_next_step: "manual_review"
      },
      final_verdict: "manual_review",
      confidence: 0,
      reasoning: "AI endpoint unavailable - manual review required"
    };

    console.log("⚠️ AI fallback used:", fallbackAi);

    // Сохраняем fallback в БД
    console.log("💾 Saving fallback AI result to database...");
    const { error: fallbackError } = await supabase
      .from("kyc_sessions")
      .update({
        ai_result: fallbackAi,
        final_status: fallbackAi.final_verdict,
        reviewed_at: new Date().toISOString(),
        status: "completed"
      })
      .eq("id", session.id);

    if (fallbackError) {
      console.error("❌ Failed to save fallback AI result:", fallbackError);
      throw new Error("Fallback database update failed");
    }

    console.log("✅ Fallback AI result saved to database");

    // Обновляем переменные для webhook
    aiResult = fallbackAi;
    finalStatus = fallbackAi.final_verdict;
  }

  // 5️⃣ Webhook отправлять ВСЕГДА
  let webhookSent = false;

  console.log("📤 Sending webhook after AI result saved...");

  // Получаем webhook_url и webhook_secret компании
  const { data: company } = await supabase
    .from("kyc_clients")
    .select("webhook_url, webhook_secret")
    .eq("id", session.client_id)
    .maybeSingle();
  if (company?.webhook_url && company?.webhook_secret) {
    const payload = {
      session_id: session.id,
      final_status: finalStatus,
      ml_result: result,
      ai_result: aiResult,
      document_url: session.document_url ?? aiResult?.evidence?.document_url ?? null,
      video_url: videoUrl ?? session.video_url ?? aiResult?.evidence?.video_url ?? null,
    };

    console.log("📤 Webhook payload:");
    console.log("  - session_id:", payload.session_id);
    console.log("  - final_status:", payload.final_status);
    console.log("  - document_url:", payload.document_url);
    console.log("  - video_url:", payload.video_url);

    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = signWebhook(
      body,
      company.webhook_secret,
      timestamp
    );

    try {
      await fetch(company.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "PassGuard-Webhook/1.0",
          "X-PassGuard-Signature": signature,
        },
        body,
      });
      console.log("✅ Webhook sent to:", company.webhook_url);
      webhookSent = true;
    } catch (e) {
      console.error("❌ Webhook failed:", e);
    }
  }

  await ctx.reply("Результат ML:");
  await ctx.reply("```json\n" + JSON.stringify(result, null, 2) + "\n```", {
    parse_mode: "Markdown",
  });

  await ctx.reply(`AI Review: ${finalStatus} ✅\nWebhook отправлен 📤`);

  await ctx.reply("KYC завершён ✔");
});

// -------------------------
bot.launch().then(() => console.log("🚀 Bot started"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
