"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface WebhookData {
  webhook_url: string | null;
  webhook_secret: string;
  webhook_updated_at: string | null;
}

export default function WebhookSettings() {
  const router = useRouter();
  const [data, setData] = useState<WebhookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  // Load webhook settings
  useEffect(() => {
    fetch("/panel/company/webhook")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/panel/login");
          return null;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (j) {
          setData(j);
          setWebhookUrl(j.webhook_url || "");
          setWebhookSecret(j.webhook_secret || "");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load webhook settings");
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveSettings() {
    setError(null);
    setSuccess(null);
    setSaving(true);

    // Validate webhook URL
    const trimmedUrl = webhookUrl.trim();
    if (trimmedUrl && !trimmedUrl.match(/^https?:\/\/.+/)) {
      setError("Invalid webhook URL format. Must start with http:// or https://");
      setSaving(false);
      return;
    }

    // Validate webhook secret
    const trimmedSecret = webhookSecret.trim();
    if (!trimmedSecret || trimmedSecret.length < 10) {
      setError("Webhook secret must be at least 10 characters long");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/panel/company/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: trimmedUrl || null,
          webhook_secret: trimmedSecret
        }),
      });

      const j = await res.json();

      if (!res.ok) {
        setError(j?.error || "Failed to save webhook settings");
        return;
      }

      // Update local state with response
      setData(j);
      setSuccess("Webhook settings saved successfully!");
    } catch (err) {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  }

  function maskSecret(secret: string) {
    if (secret.length <= 8) return "•".repeat(secret.length);
    return secret.slice(0, 4) + "•".repeat(secret.length - 8) + secret.slice(-4);
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
        Loading webhook settings...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 800,
      margin: "0 auto",
      padding: 24,
      backgroundColor: "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, marginBottom: 8, color: "#1a1a1a", fontSize: 24, fontWeight: 600 }}>
          Webhook Settings
        </h2>
        <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
          Configure webhook endpoints to receive real-time KYC verification notifications
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#166534",
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span>✅</span>
          {success}
        </div>
      )}

      <div style={{ display: "grid", gap: 24 }}>
        {/* Current Settings Display */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 20
        }}>
          <h3 style={{ margin: 0, marginBottom: 16, color: "#1a1a1a", fontSize: 18, fontWeight: 600 }}>
            Current Configuration
          </h3>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                Webhook URL
              </label>
              <div style={{
                padding: 12,
                backgroundColor: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontFamily: "monospace",
                fontSize: 14,
                color: data?.webhook_url ? "#1a1a1a" : "#9ca3af"
              }}>
                {data?.webhook_url || "Not configured"}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                Webhook Secret
              </label>
              <div style={{
                padding: 12,
                backgroundColor: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontFamily: "monospace",
                fontSize: 14,
                color: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <span>{showSecret ? data?.webhook_secret : maskSecret(data?.webhook_secret || "")}</span>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: "4px 8px",
                    borderRadius: 4,
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#374151"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
                >
                  {showSecret ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                Last Updated
              </label>
              <div style={{
                padding: 12,
                backgroundColor: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                color: "#6b7280"
              }}>
                {formatDate(data?.webhook_updated_at ?? null)}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 20
        }}>
          <h3 style={{ margin: 0, marginBottom: 16, color: "#1a1a1a", fontSize: 18, fontWeight: 600 }}>
            Update Settings
          </h3>

          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Webhook URL <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-app.com/api/webhooks/kyc"
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: "monospace",
                  boxSizing: "border-box"
                }}
              />
              <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#6b7280" }}>
                HTTP or HTTPS URL where webhook notifications will be sent. Leave empty to disable webhooks.
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Webhook Secret <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Enter webhook secret (min 10 characters)"
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: "monospace",
                  boxSizing: "border-box"
                }}
              />
              <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#6b7280" }}>
                Secret key used to sign webhook requests for security verification.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                onClick={saveSettings}
                disabled={saving}
                style={{
                  padding: "12px 24px",
                  backgroundColor: saving ? "#9ca3af" : "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s"
                }}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>

              <button
                onClick={() => {
                  setWebhookUrl(data?.webhook_url || "");
                  setWebhookSecret(data?.webhook_secret || "");
                  setError(null);
                  setSuccess(null);
                }}
                disabled={saving}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "transparent",
                  color: "#6b7280",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "all 0.2s"
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div style={{
          backgroundColor: "#fefce8",
          border: "1px solid #fde047",
          borderRadius: 8,
          padding: 20
        }}>
          <h4 style={{ margin: 0, marginBottom: 12, color: "#92400e", fontSize: 16, fontWeight: 600 }}>
            🔒 Security Information
          </h4>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#78350f", fontSize: 14, lineHeight: 1.5 }}>
            <li>All webhook requests are signed with HMAC-SHA256 using your webhook secret</li>
            <li>Check the <code>X-PassGuard-Signature</code> header to verify request authenticity</li>
            <li>Webhook requests include the complete KYC verification results</li>
            <li>Keep your webhook secret secure and rotate it regularly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
