'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Ошибка входа');
      }

      // если роль guard — в панель охраны, иначе — в админку
      if (data.role === 'guard') {
        router.push('/guard');
      } else {
        router.push('/admin/passes');
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-xl bg-white flex items-center justify-center text-xs font-bold text-black">
            QR
          </div>
          <div>
            <p className="text-sm font-semibold">PassGuard</p>
            <p className="text-[11px] text-white/50">
              Вход в панель администратора / охраны
            </p>
          </div>
        </div>

        <h1 className="text-xl font-semibold mb-4">
          Вход в личный кабинет
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-white/70">
              Email
            </label>
            <input
              type="email"
              className="w-full border border-white/20 bg-black/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/60"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@company.az"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-white/70">
              Пароль
            </label>
            <input
              type="password"
              className="w-full border border-white/20 bg-black/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/60"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400">
              Ошибка: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black rounded-lg py-2 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-60 transition"
          >
            {loading ? 'Входим…' : 'Войти'}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-white/40">
          Доступ выдается управляющей компанией. Если у вас ещё нет логина и
          пароля, свяжитесь с администратором объекта.
        </p>
      </div>
    </main>
  );
}
