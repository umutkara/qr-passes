'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from '../../lib/supabase';

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await getSupabaseClient().auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
    router.push("/register");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          padding: 16,
          borderRight: "1px solid #eee",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <div>
          <h3 style={{ marginBottom: 16 }}>PassGuard</h3>

          <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/panel">Dashboard</Link>
            <Link href="/panel/sessions">KYC Sessions</Link>
            <Link href="/panel/company">Company Settings</Link>
          </nav>
        </div>

        {/* Logout button at bottom */}
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #eee" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "8px 12px",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              color: "#374151",
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e5e7eb";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f3f4f6";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
