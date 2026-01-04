import { KycVerifyResponse } from "./kycClient";

export function formatKycResultForUser(result: KycVerifyResponse): string {
  const { status, checks, fields } = result;

  const statusText =
    status === "approved"
      ? "✅ Верификация пройдена"
      : status === "manual_review"
      ? "⏳ Верификация отправлена на ручную проверку"
      : "❌ Верификация не пройдена";

  // Нормализуем, чтобы дальше они точно были НЕ undefined
  const faceMatch = checks.face_match ?? { ok: false, score: null as number | null };
  const liveness = checks.liveness ?? { ok: false, score: null as number | null };
  const documentQuality = checks.document_quality ?? { ok: false };
  const documentExpired = checks.document_expired ?? { ok: true };

  const faceMatchScore =
    typeof faceMatch.score === "number" ? faceMatch.score : null;

  const livenessScore =
    typeof liveness.score === "number" ? liveness.score : null;

  const lines: string[] = [];

  lines.push(statusText);
  lines.push("");
  lines.push("📊 Checks:");

  lines.push(
    `• Face match: ${faceMatch.ok ? "OK" : "FAIL"}${
      faceMatchScore !== null ? ` (score: ${faceMatchScore.toFixed(3)})` : ""
    }`
  );

  lines.push(
    `• Liveness: ${liveness.ok ? "OK" : "FAIL"}${
      livenessScore !== null ? ` (score: ${livenessScore.toFixed(3)})` : ""
    }`
  );

  lines.push(
    `• Document quality: ${documentQuality.ok ? "OK" : "CHECK"}`
  );

  lines.push(
    `• Document expired: ${documentExpired.ok ? "NOT EXPIRED" : "EXPIRED"}`
  );

  lines.push("");
  lines.push("📄 Document fields:");

  lines.push(`• Document number: ${fields.document_number ?? "-"}`);
  lines.push(`• Birth date: ${fields.birthday ?? "-"}`);
  lines.push(`• Expiry date: ${fields.expiry_date ?? "-"}`);

  if (fields.raw_text) {
    lines.push("");
    lines.push("📝 Raw OCR:");
    lines.push(fields.raw_text.slice(0, 400)); // чтобы не спамить слишком много
  }

  return lines.join("\n");
}
