// lib/decisionEngine.ts

type Verdict = "approved" | "manual_review" | "rejected";

function num(x: any, d = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
}

function bool(x: any) {
  return x === true;
}

export function decideFinalStatus(input: {
  ml: any;         // ml_result
  ai: any;         // ai_result
}): { final_status: Verdict; reason: string } {

  const ml = input.ml || {};
  const ai = input.ai || {};

  const faceOk = bool(ml?.checks?.face_match?.ok);
  const faceScore = num(ml?.checks?.face_match?.score, 0);

  const docQualityOk = bool(ml?.checks?.document_quality?.ok);
  // ВАЖНО: у тебя сейчас document_expired.ok часто не отражает истину.
  // Поэтому ориентируемся на ai.analysis.document.expired (если есть) и на ai.extracted_identity.expiry_date (если есть).
  const aiExpired =
    String(ai?.analysis?.document?.expired ?? "").toLowerCase() === "yes" ||
    String(ai?.analysis?.document?.expired ?? "").toLowerCase() === "true";

  const aiConfidence = num(ai?.confidence, 0);

  // Liveness будем считать "fail" если ml.liveness.ok = false
  const liveOk = bool(ml?.checks?.liveness?.ok);

  // --- RULES (простые и рабочие) ---

  // Reject: плохой face match
  if (!faceOk && faceScore < 0.4) {
    return { final_status: "rejected", reason: "Low face match score" };
  }

  // Reject: документ просрочен (по AI) + нет причин доверять
  if (aiExpired && faceScore < 0.7) {
    return { final_status: "rejected", reason: "Document appears expired" };
  }

  // Approve: все ключевое ОК (liveness может быть fail? — нет, тогда не auto-approve)
  if (faceScore >= 0.7 && docQualityOk && !aiExpired && aiConfidence >= 0.7 && liveOk) {
    return { final_status: "approved", reason: "All checks passed (auto-approve)" };
  }

  // Остальное — manual review
  return { final_status: "manual_review", reason: "Needs manual review" };
}

