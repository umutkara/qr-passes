import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

interface Session {
  id: string;
  customer_id: string;
  status: string;
  verify_token: string;
  created_at: string;
  ml_result?: any;
  ai_result?: {
    verdict: string;
    confidence: number;
    reasoning: string;
    raw_response?: string;
  };
  final_status?: string;
  reviewed_at?: string;
}

async function getSession(id: string): Promise<Session> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/panel/sessions/${id}`, {
      cache: 'no-store',
      headers: {
        'Cookie': cookieHeader,
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        notFound();
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.session) {
      notFound();
    }

    return data.session;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    throw error;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailsPage({ params }: PageProps) {
  let session: Session | null = null;
  let error: string | null = null;

  try {
    const { id } = await params;
    session = await getSession(id);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load session';
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <Link href="/panel/sessions" style={{ textDecoration: 'none', color: '#0070f3' }}>
          ← Back to Sessions
        </Link>
        <div style={{ color: 'red', marginTop: 20 }}>
          ❌ Error: {error}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: 20 }}>
        <Link href="/panel/sessions" style={{ textDecoration: 'none', color: '#0070f3' }}>
          ← Back to Sessions
        </Link>
        <div style={{ color: 'red', marginTop: 20 }}>
          Session not found
        </div>
      </div>
    );
  }


  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <Link
        href="/panel/sessions"
        style={{
          textDecoration: 'none',
          color: '#0070f3',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12
        }}
      >
        ← Back to Sessions
      </Link>

      {/* HEADER */}
      <h1 style={{ marginTop: 12 }}>
        KYC Session
        <StatusBadge status={session.status} />
      </h1>

      <div style={{ opacity: 0.7 }}>
        Customer ID: <b>{session.customer_id}</b> ·
        Created: {new Date(session.created_at).toLocaleString()}
      </div>

      <hr style={{ margin: "20px 0" }} />

      {/* BASIC INFO */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* SESSION DATA */}
        <section>
          <h2>Session Information</h2>
          <Info label="Session ID" value={session.id} />
          <Info label="Customer ID" value={session.customer_id} />
          <Info label="Status" value={<StatusBadge status={session.status} />} />
          <Info label="Verify Token" value={session.verify_token} />
          <Info label="Created At" value={new Date(session.created_at).toLocaleString()} />
        </section>

        {/* STATUS */}
        <section>
          <h2>Status Details</h2>
          <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <p><strong>Current Status:</strong> <StatusBadge status={session.status} /></p>
            {session.final_status && (
              <p><strong>Final Result:</strong> <StatusBadge status={session.final_status} /></p>
            )}
            {session.reviewed_at && (
              <p><strong>Reviewed At:</strong> {new Date(session.reviewed_at).toLocaleString()}</p>
            )}
          </div>
        </section>
      </div>

      {/* VERIFICATION RESULTS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>

        {/* ML RESULT */}
        {session.ml_result && (
          <section>
            <h2>ML Result</h2>
            <pre style={{
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(session.ml_result, null, 2)}
            </pre>
          </section>
        )}

        {/* AI RESULT */}
        {session.ai_result && (
          <section>
            <h2>AI Result</h2>
            <pre style={{
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(session.ai_result, null, 2)}
            </pre>
          </section>
        )}
      </div>

    </div>
  );
}

/* UI COMPONENTS */

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <b>{label}:</b> {value}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "approved" ? "green" :
    status === "rejected" ? "red" :
    "orange";

  return (
    <span style={{
      marginLeft: 12,
      padding: "4px 8px",
      borderRadius: 6,
      background: color,
      color: "#fff",
      fontSize: 12
    }}>
      {status}
    </span>
  );
}
