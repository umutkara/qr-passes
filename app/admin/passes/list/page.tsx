'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Pass = {
  id: string;
  code: string;
  type: string;
  full_name: string;
  car_plate: string | null;
  valid_from: string;
  valid_until: string;
  status: string;
  single_use: boolean;
};

export default function PassListPage() {
  const router = useRouter();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPasses() {
    setLoading(true);
    const res = await fetch('/api/passes/list');
    const data = await res.json();
    setPasses(data.passes || []);
    setLoading(false);
  }

  async function markUsed(id: string) {
    await fetch('/api/passes/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadPasses();
  }

  useEffect(() => {
    loadPasses();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Все пропуска</h1>

      <button
        onClick={() => router.push('/admin/passes')}
        className="mb-4 text-sm text-blue-600 underline"
      >
        ← Назад
      </button>

      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white shadow rounded-xl">
            <thead className="bg-slate-200 text-sm">
              <tr>
                <th className="p-2">Тип</th>
                <th className="p-2">ФИО</th>
                <th className="p-2">Авто</th>
                <th className="p-2">Срок</th>
                <th className="p-2">Статус</th>
                <th className="p-2">Одноразовый</th>
                <th className="p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {passes.map((p) => (
                <tr key={p.id} className="border-t text-sm">
                  <td className="p-2">{p.type}</td>
                  <td className="p-2">{p.full_name}</td>
                  <td className="p-2">{p.car_plate || '-'}</td>
                  <td className="p-2">
                    {new Date(p.valid_from).toLocaleString()} <br />
                    → {new Date(p.valid_until).toLocaleString()}
                  </td>
                  <td className="p-2">{p.status}</td>
                  <td className="p-2">{p.single_use ? '✅' : '—'}</td>
                  <td className="p-2">
                    {p.single_use && p.status === 'active' && (
                      <button
                        onClick={() => markUsed(p.id)}
                        className="text-xs text-white bg-red-600 rounded px-2 py-1"
                      >
                        Использован
                      </button>
                    )}
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
