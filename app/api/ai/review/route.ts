import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PRODUCTION_PROMPT } from "@/lib/aiPrompts";
import fs from "fs/promises";
import path from "path";
import { extractJpgFramesFromVideoUrl } from "@/lib/videoFrames";
import { decideFinalStatus } from "@/lib/decisionEngine";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function extractJson(text: string) {
  const t = text.trim();
  // Strip markdown fences
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fence ? fence[1] : t).trim();
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function uploadLocalFileToStorage(localPath: string, storagePath: string) {
  const buf = await fs.readFile(localPath);

  const { error } = await supabaseAdmin.storage
    .from("kyc-media")
    .upload(storagePath, buf, { contentType: "image/jpeg", upsert: true });

  if (error) throw new Error("Upload frame failed: " + error.message);

  const { data } = supabaseAdmin.storage.from("kyc-media").getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function POST(req: NextRequest) {
  let session_id: string | null = null;
  let ml_result: any = null;
  let document_url: string | null = null;
  let video_url: string | null = null;
  let video_frame_urls: string[] = [];
  let videoFrameUrls: string[] = [];

  try {
    console.log("🔍 /api/ai/review endpoint hit");

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }

    const body = await req.json();
    session_id = body.session_id;
    ml_result = body.ml_result;
    document_url = body.document_url ?? null;
    video_url = body.video_url ?? null;
    video_frame_urls = Array.isArray(body.video_frame_urls) ? body.video_frame_urls : [];

    // Если не передали evidence URLs — берём из БД
    if (!document_url || !video_url) {
      const { data: sessDb, error: sessErr } = await supabaseAdmin
        .from("kyc_sessions")
        .select("document_url, video_url")
        .eq("id", session_id)
        .single();

      if (!sessErr && sessDb) {
        document_url = document_url ?? sessDb.document_url ?? null;
        video_url = video_url ?? sessDb.video_url ?? null;
      }
    }

    console.log("📎 Evidence (after DB lookup):", { document_url, video_url });

    // Validation
    if (!session_id) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    if (!ml_result) {
      return NextResponse.json({ error: "ml_result required" }, { status: 400 });
    }

    console.log("📋 Session ID:", session_id);
    console.log("📎 Document URL:", document_url ?? "none");
    console.log("📎 Video URL:", video_url ?? "none");

    // Check raw_text length
    const rawText = ml_result?.fields?.raw_text || null;
    if (rawText) {
      console.log("📄 raw_text length:", rawText.length);
      console.log("📄 raw_text preview (first 120 chars):", rawText.substring(0, 120));
    } else {
      console.log("⚠️ raw_text not found in ml_result.fields, but proceeding anyway");
    }

    // Check if already completed
    const { data: existingSession } = await supabaseAdmin
      .from("kyc_sessions")
      .select("ai_result, final_status")
      .eq("id", session_id)
      .single();

    if (existingSession?.ai_result) {
      console.log("⏭️ AI review already completed, skipping");
      return NextResponse.json({
        ok: true,
        aiResult: existingSession.ai_result,
        finalStatus: existingSession.final_status
      });
    }

    console.log("🔥 AI REVIEW HIT for", session_id);
    console.log("🤖 Calling OpenAI API...");

    // Extract frames from video if available
    videoFrameUrls = [];

    if (video_url) {
      try {
        const tmpDir = path.join(process.cwd(), ".tmp-frames");
        await ensureDir(tmpDir);

        const sessionSafe = session_id.replace(/[^a-zA-Z0-9_-]/g, "");
        const fileBase = `frame_${sessionSafe}`;

        const framePaths = await extractJpgFramesFromVideoUrl({
          videoUrl: video_url,
          outDir: tmpDir,
          fileBase,
          frameCount: 3,
        });

        // Заливаем кадры в Supabase Storage и получаем public URLs
        const uploaded: string[] = [];
        for (let i = 0; i < framePaths.length; i++) {
          const storagePath = `frames/${sessionSafe}/${fileBase}_${i + 1}.jpg`;
          const publicUrl = await uploadLocalFileToStorage(framePaths[i], storagePath);
          uploaded.push(publicUrl);
        }
        videoFrameUrls = uploaded;

        console.log("🖼️ videoFrameUrls:", videoFrameUrls);
      } catch (e: any) {
        console.error("⚠️ Frame extraction failed:", e?.message || e);
      }
    }

    // Build user message content array
    const userContent: any[] = [];

    // Add JSON text block with FULL ml_result + fields + evidence
    const jsonData = {
      session_id,
      ml_result, // полный ML JSON
      evidence: {
        document_url,
        video_url,
        video_frame_urls: videoFrameUrls,
      },
    };
    userContent.push({
      type: "text",
      text: JSON.stringify(jsonData, null, 2)
    });

    // 1) Паспорт как картинка
    if (document_url) {
      userContent.push({
        type: "image_url",
        image_url: { url: document_url },
      });
    }

    // 2) Кадры видео как картинки
    for (const u of videoFrameUrls.slice(0, 3)) {
      userContent.push({
        type: "image_url",
        image_url: { url: u },
      });
    }

    // Use vision-capable model if document_url exists
    const model = document_url 
      ? (process.env.OPENAI_MODEL || "gpt-4o-mini") 
      : (process.env.OPENAI_MODEL || "gpt-4o-mini");
    
    console.log("🤖 Using OpenAI model:", model);

    const completion = await openai.chat.completions.create({
      model: model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: PRODUCTION_PROMPT,
        },
        {
          role: "user",
          content: userContent,
        }
      ]
    });

    const content = completion.choices[0]?.message?.content || "";
    const jsonText = extractJson(content);

    let aiResult: any;
    try {
      aiResult = JSON.parse(jsonText);
    } catch (e) {
      console.error("❌ AI returned non-JSON:", content);
      console.error("❌ JSON parse error:", e);
      
      // Fallback with safe structure
      aiResult = {
        session_id: session_id,
        evidence: {
          document_url: document_url ?? null,
          video_url: video_url ?? null,
          video_frame_urls: videoFrameUrls ?? [],
        },
        extracted_identity: null,
        analysis: {
          face_match: { result: "fail", score: 0 },
          liveness: { result: "fail", score: 0, reason: "AI returned invalid JSON" },
          document: {
            quality: "poor",
            expired: "ambiguous",
            notes: ["AI returned invalid JSON"]
          }
        },
        human_review_summary: {
          what_ml_said: [],
          what_i_verified: [],
          inconsistencies_or_risks: ["AI returned invalid JSON format"],
          recommended_next_step: "manual_review"
        },
        final_verdict: "manual_review",
        confidence: 0,
        reasoning: "AI returned invalid JSON: " + String(e)
      };
    }

    // Force session_id and evidence URLs (do not rely on model)
    aiResult.session_id = session_id;
    aiResult.evidence = {
      document_url: document_url ?? null,
      video_url: video_url ?? null,
      video_frame_urls: videoFrameUrls ?? [],
    };

    // Validate required fields
    if (!aiResult.final_verdict) {
      console.error("❌ AI result missing final_verdict:", aiResult);
      aiResult.final_verdict = "manual_review";
      aiResult.reasoning = (aiResult.reasoning || "") + " [Missing final_verdict field]";
    }

    const decision = decideFinalStatus({ ml: ml_result, ai: aiResult });
    const finalStatus = decision.final_status;

    // чтобы AI-ответ тоже содержал объяснение финального решения:
    aiResult.final_decision = {
      final_status: finalStatus,
      policy_reason: decision.reason,
    };

    const confidence = aiResult.confidence ?? 0;

    console.log("✅ AI FINAL RESULT:", JSON.stringify(aiResult, null, 2));
    console.log("✅ FINAL STATUS:", finalStatus);
    console.log("✅ CONFIDENCE:", confidence);
    console.log("✅ Evidence URLs:", aiResult.evidence);

    // Save to Supabase
    const { data: updated, error: updError, count } = await supabaseAdmin
      .from("kyc_sessions")
      .update({
        ml_result: ml_result,
        ai_result: aiResult,
        final_status: finalStatus,
        reviewed_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", session_id)
      .select("id, ai_result, final_status, status");

    if (updError) {
      console.error("❌ Supabase update failed:", updError);
      return NextResponse.json({
        error: "DB update failed",
        details: updError.message
      }, { status: 500 });
    }

    if (!updated || count === 0) {
      console.error("❌ CRITICAL: Database update affected 0 rows for session_id:", session_id);
      return NextResponse.json({
        error: "Session not found to update"
      }, { status: 404 });
    }

    console.log("✅ Database updated successfully (affected rows:", count, ")");
    
    // Read-back verification
    const { data: readBack } = await supabaseAdmin
      .from("kyc_sessions")
      .select("ai_result, final_status, status")
      .eq("id", session_id)
      .single();

    if (readBack) {
      console.log("✅ READ-BACK VERIFICATION:");
      console.log("  - ai_result exists:", !!readBack.ai_result);
      console.log("  - final_status:", readBack.final_status);
      console.log("  - status:", readBack.status);
    }

    return NextResponse.json({
      ok: true,
      aiResult,
      finalStatus
    });

  } catch (err: any) {
    console.error("❌ AI review error:", err?.message || err);

    // Fallback AI result with full structure
    const fallbackAi: any = {
      session_id: session_id,
      evidence: {
        document_url: document_url ?? null,
        video_url: video_url ?? null,
        video_frame_urls: videoFrameUrls ?? [],
      },
      extracted_identity: null,
      analysis: {
        face_match: { result: "fail", score: 0 },
        liveness: { result: "fail", score: 0, reason: "AI service error" },
        document: {
          quality: "poor",
          expired: "ambiguous",
          notes: ["AI service error"]
        }
      },
      human_review_summary: {
        what_ml_said: [],
        what_i_verified: [],
        inconsistencies_or_risks: ["AI service error occurred"],
        recommended_next_step: "manual_review"
      },
      final_verdict: "manual_review",
      confidence: 0,
      reasoning: "AI service error: " + (err?.message || String(err))
    };

    const decision = decideFinalStatus({ ml: ml_result, ai: fallbackAi });
    const finalStatus = decision.final_status;

    // чтобы fallback тоже содержал объяснение финального решения:
    fallbackAi.final_decision = {
      final_status: finalStatus,
      policy_reason: decision.reason,
    };

    console.log("⚠️ AI fallback used:", fallbackAi);
    console.log("⚠️ FINAL STATUS (fallback):", finalStatus);

    if (session_id) {
      // Save fallback to DB
      const { error: errorUpdate, count } = await supabaseAdmin
        .from("kyc_sessions")
        .update({
          ml_result: ml_result, // Also save ml_result in fallback case
          ai_result: fallbackAi,
          final_status: finalStatus,
          reviewed_at: new Date().toISOString(),
          status: "completed"
        })
        .eq("id", session_id)
        .select("id, ai_result, final_status, status");

      if (errorUpdate) {
        console.error("❌ Database update failed (fallback):", errorUpdate);
      } else if (count === 0) {
        console.error("❌ CRITICAL: Fallback DB update affected 0 rows for session_id:", session_id);
      } else {
        console.log("✅ Fallback AI result saved to database (affected rows:", count, ")");
        
        // Read-back verification for fallback
        const { data: readBack } = await supabaseAdmin
          .from("kyc_sessions")
          .select("ai_result, final_status, status")
          .eq("id", session_id)
          .single();
        
        if (readBack) {
          console.log("✅ FALLBACK READ-BACK:");
          console.log("  - ai_result exists:", !!readBack.ai_result);
          console.log("  - final_status:", readBack.final_status);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      aiResult: fallbackAi,
      finalStatus
    });
  }
}
