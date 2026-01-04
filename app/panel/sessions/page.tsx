import Link from "next/link";
import { cookies } from "next/headers";

interface Session {
  id: string;
  customer_id: string;
  status: string;
  verify_token: string;
  created_at: string;
}

async function getSessions(): Promise<Session[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/panel/sessions`, {
      cache: 'no-store', // Always fetch fresh data for admin panel
      headers: {
        'Cookie': cookieHeader,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.sessions || [];
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export default async function SessionsPage() {
  let sessions: Session[] = [];
  let error: string | null = null;

  try {
    sessions = await getSessions();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load sessions';
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h1>KYC Sessions</h1>
        <div style={{ color: 'red', marginTop: 20 }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>KYC Sessions</h1>
        <Link
          href="/panel/create"
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 5
          }}
        >
          Create New Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p>No sessions found.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>
                  Session ID
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>
                  Customer ID
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>
                  Created
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '14px' }}>
                    {session.id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {session.customer_id}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={session.status} />
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666' }}>
                    {new Date(session.created_at).toLocaleDateString()} {new Date(session.created_at).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link
                      href={`/panel/sessions/${session.id}`}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f0f0f0',
                        color: '#333',
                        textDecoration: 'none',
                        borderRadius: 4,
                        fontSize: '14px'
                      }}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#10b981'; // green
      case 'rejected':
        return '#ef4444'; // red
      case 'pending':
        return '#f59e0b'; // yellow
      case 'in_progress':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <span style={{
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      color: 'white',
      backgroundColor: getStatusColor(status),
      textTransform: 'capitalize'
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}