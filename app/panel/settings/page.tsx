"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Загружаем текущие настройки
  useEffect(() => {
    fetch("/api/panel/me")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/panel/login");
          return null;
        }
        return r.json();
      })
      .then((j) => {
        if (j?.company) {
          setWebhookUrl(j.company.webhook_url || "");
        }
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function saveWebhook() {
    setError(null);
    setSuccess(null);
    setSaving(true);

    // Валидация URL
    if (webhookUrl.trim() && !webhookUrl.match(/^https?:\/\/.+/)) {
      setError("Invalid webhook URL format. Must start with http:// or https://");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/panel/settings/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: webhookUrl.trim() || null }),
      });

      const j = await res.json();

      if (!res.ok) {
        setError(j?.error || "Failed to save webhook");
        return;
      }

      setSuccess("Webhook URL saved successfully!");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading settings…</div>;

  return (
    <div style={{ maxWidth: 600 }}>
      <h1>Settings</h1>

      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Company settings and configuration.
      </p>

      {error && (
        <div style={{ background: "#fee", border: "1px solid #f99", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{ background: "#efe", border: "1px solid #9f9", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          ✅ {success}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h3>Webhook Configuration</h3>
        <p style={{ opacity: 0.7, marginBottom: 12 }}>
          Configure webhook URL to receive KYC completion notifications when verification is finished.
        </p>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
            Webhook URL
          </label>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-app.com/webhook/kyc"
            style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
          <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 12 }}>
            Leave empty to disable webhooks. When KYC completes, we'll send a POST request with the results.
          </p>

          <button
            onClick={saveWebhook}
            disabled={saving}
            style={{
              padding: "8px 16px",
              background: saving ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Saving…" : "Save Webhook"}
          </button>
        </div>

        <div style={{ marginTop: 20, padding: 12, background: "#f8f9fa", borderRadius: 4 }}>
          <h4 style={{ marginBottom: 8 }}>Webhook Security</h4>
          <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 8 }}>
            All webhook requests are signed with HMAC-SHA256 for security verification.
          </p>
          <p style={{ opacity: 0.7, fontSize: 14 }}>
            Check the <code>X-PassGuard-Signature</code> header to verify request authenticity.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3>API Configuration</h3>
        <p style={{ opacity: 0.7 }}>
          Your API key is displayed on the main dashboard. Use it to create KYC sessions programmatically.
        </p>
      </div>

      <div style={{ marginTop: 32 }}>
        <button
          onClick={() => router.push("/panel/sessions")}
          style={{
            padding: "8px 16px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          ← Back to Sessions
        </button>
      </div>
    </div>
  );
}
