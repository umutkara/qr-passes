"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateKycPage() {
  const router = useRouter();

  const [customerId, setCustomerId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultLink, setResultLink] = useState<string | null>(null);

  async function createKyc() {
    setError(null);
    setResultLink(null);

    if (!customerId.trim()) {
      setError("customer_id is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/panel/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId.trim(),
          purpose: purpose.trim() || null,
        }),
      });

      const j = await res.json();

      if (!res.ok) {
        setError(j?.error || "Failed to create KYC session");
        return;
      }

      setResultLink(j.link);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1>Create KYC session</h1>

      <p style={{ opacity: 0.7 }}>
        Generate a personal Telegram link for your client.
      </p>

      {error && (
        <div
          style={{
            background: "#fee",
            border: "1px solid #f99",
            padding: 12,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          ❌ {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <div>
          <label>Customer ID</label>
          <input
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="e.g. user_123"
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label>Purpose (optional)</label>
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Signup / Withdrawal / etc."
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <button
          onClick={createKyc}
          disabled={loading}
          style={{
            padding: "10px 14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Creating…" : "Generate KYC link"}
        </button>
      </div>

      {resultLink && (
        <div
          style={{
            marginTop: 20,
            padding: 12,
            border: "1px solid #ccc",
            borderRadius: 8,
            background: "#f9f9f9",
          }}
        >
          <p style={{ marginBottom: 6 }}>✅ KYC link created:</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>{resultLink}</pre>

          <button
            style={{ marginTop: 10 }}
            onClick={() => {
              navigator.clipboard.writeText(resultLink);
              alert("Link copied");
            }}
          >
            Copy link
          </button>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button onClick={() => router.push("/panel/sessions")}>
          ← Back to sessions
        </button>
      </div>
    </div>
  );
}



