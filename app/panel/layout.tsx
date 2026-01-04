import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('PanelLayout - checking auth...');

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log('PanelLayout - all cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

  // Check for Supabase cookies
  const sbAccessToken = cookieStore.get('sb-access-token');
  const sbRefreshToken = cookieStore.get('sb-refresh-token');
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0];
  const sbProjectToken = projectRef ? cookieStore.get(`sb-${projectRef}-auth-token`) : null;

  console.log('PanelLayout - Supabase cookies found:', {
    sbAccessToken: !!sbAccessToken,
    sbRefreshToken: !!sbRefreshToken,
    sbProjectToken: !!sbProjectToken,
    projectRef
  });

  if (!sbAccessToken && !sbRefreshToken && !sbProjectToken) {
    console.log('PanelLayout - no auth cookies, redirecting to /login');
    redirect("/login");
  }

  console.log('PanelLayout - auth cookies present, rendering panel');

  async function handleLogout() {
    "use server";
    try {
      const supabase = await supabaseServer();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
    redirect("/register");
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
          <form action={handleLogout}>
            <button
              type="submit"
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
          </form>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
