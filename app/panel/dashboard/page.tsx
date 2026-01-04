"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Stats = {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  today: number;
  company?: {
    id: string;
    name: string;
    public_id: string;
    api_key: string;
    balance_usd: number;
    webhook_url?: string;
    webhook_updated_at?: string;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/panel/dashboard")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/panel/login");
          return null;
        }
        return r.json();
      })
      .then((j) => {
        if (!j) return;
        if (j.error) setError(j.error);
        else setStats(j);
      })
      .catch(() => setError("Failed to load dashboard"));
  }, []);

  if (error) return <div>❌ {error}</div>;
  if (!stats) return <div>Loading dashboard…</div>;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 28, fontWeight: 700, color: "#1a1a1a" }}>
          Dashboard
        </h1>
        {stats.company && (
          <p style={{ margin: 0, color: "#666", fontSize: 16 }}>
            Welcome back, <strong>{stats.company.name}</strong>
          </p>
        )}
      </div>

      {stats.company && (
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 24,
          marginBottom: 32
        }}>
          <h2 style={{ margin: 0, marginBottom: 20, fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>
            Company Information
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20
          }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
                Company Name
              </label>
              <div style={{
                padding: 12,
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "#1a1a1a"
              }}>
                {stats.company.name}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
                Public ID
              </label>
              <div style={{
                padding: 12,
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "monospace",
                color: "#1a1a1a"
              }}>
                {stats.company.public_id}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
                Balance
              </label>
              <div style={{
                padding: 12,
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "#1a1a1a"
              }}>
                ${stats.company.balance_usd.toFixed(2)} USD
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
                Webhook Status
              </label>
              <div style={{
                padding: 12,
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                color: stats.company.webhook_url ? "#059669" : "#6b7280"
              }}>
                {stats.company.webhook_url ? "Configured" : "Not configured"}
                {stats.company.webhook_updated_at && (
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                    Updated: {new Date(stats.company.webhook_updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
              API Key
            </label>
            <div style={{
              padding: 12,
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "monospace",
              color: "#1a1a1a",
              wordBreak: "break-all"
            }}>
              {stats.company.api_key}
            </div>
            <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#dc2626", fontWeight: 500 }}>
              ⚠️ Keep this key secret. It provides full access to your account.
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 style={{ margin: 0, marginBottom: 20, fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>
          KYC Statistics
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          <Card title="Total KYC" value={stats.total} />
          <Card title="Approved" value={stats.approved} color="#059669" />
          <Card title="Rejected" value={stats.rejected} color="#dc2626" />
          <Card title="Pending" value={stats.pending} color="#d97706" />
          <Card title="Today" value={stats.today} />
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}
    >
      <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 8 }}>{title}</div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: color || "#1a1a1a",
        }}
      >
        {value}
      </div>
    </div>
  );
}



