import crypto from "crypto";

export function genPublicId() {
  return "kc_" + crypto.randomBytes(6).toString("hex");
}

export function genApiKey() {
  return "pk_" + crypto.randomBytes(32).toString("hex");
}

export function genWebhookSecret() {
  return "whsec_" + crypto.randomBytes(24).toString("hex");
}
