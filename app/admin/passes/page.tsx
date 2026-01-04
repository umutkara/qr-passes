'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
// @ts-ignore
import QRCode from 'qrcode';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

type PassType = 'guest' | 'resident' | 'vehicle' | 'contractor';

type Pass = {
  id: string;
  code: string;
  type: PassType;
  full_name: string;
  car_plate: string | null;
  valid_from: string;
  valid_until: string;
  status: string;
  single_use: boolean;
  created_at?: string; // если есть в базе - используем в фильтре
};

export default function PassesAdminPage() {
  const router = useRouter();

  const [type, setType] = useState<PassType>('guest');
  const [fullName, setFullName] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [singleUse, setSingleUse] = useState(false);

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPass, setCreatedPass] = useState<Pass | null>(null);

  const [passes, setPasses] = useState<Pass[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // ---- ФИЛЬТРЫ ----
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState<'all' | PassType>('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'used' | 'cancelled' | 'expired'
  >('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const filteredPasses = passes.filter((p) => {
    // ФИО
    const nameOk =
      !filterName ||
      p.full_name.toLowerCase().includes(filterName.toLowerCase());

    // Тип
    const typeOk = filterType === 'all' || p.type === filterType;

    // Статус
    const statusOk = filterStatus === 'all' || p.status === filterStatus;

    // Дата (created_at или valid_from)
    const baseDateStr = p.created_at || p.valid_from;
    const baseDate = new Date(baseDateStr);

    let dateOk = true;

    if (filterFrom) {
      const fromDate = new Date(filterFrom + 'T00:00:00');
      if (baseDate < fromDate) dateOk = false;
    }

    if (filterTo) {
      const toDate = new Date(filterTo + 'T23:59:59');
      if (baseDate > toDate) dateOk = false;
    }

    return nameOk && typeOk && statusOk && dateOk;
  });

  // ---- ЛОГИКА ----

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    } finally {
      router.push('/login');
    }
  }

  async function fetchPasses() {
    try {
      setLoadingList(true);
      const res = await fetch('/api/passes/list');
      const data = await res.json();
      setPasses(data.passes ?? []);
    } catch (e) {
      console.error('fetch passes error', e);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchPasses();
  }, []);

  async function handleCreatePass(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoadingCreate(true);
    setCreatedPass(null);

    try {
      const res = await fetch('/api/passes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          fullName,
          carPlate: carPlate || null,
          validFrom: new Date(validFrom).toISOString(),
          validUntil: new Date(validUntil).toISOString(),
          singleUse,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.details || data?.error || 'Failed to create pass');
      }

      setCreatedPass(data.pass as Pass);
      await fetchPasses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleStatusChange(passId: string, status: string) {
    try {
      const res = await fetch('/api/passes/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passId, status }),
      });

      if (!res.ok) {
        console.error('status change error', await res.text());
      }

      await fetchPasses();
    } catch (e) {
      console.error('status change error', e);
    }
  }

  // ---- PDF A4 ----
  async function downloadPassPdf(pass: Pass) {
    try {
      const qrDataUrl: string = await QRCode.toDataURL(pass.code, {
        margin: 1,
        scale: 8,
      });
      const qrBase64 = qrDataUrl.split(',')[1];
      const qrBytes = Uint8Array.from(atob(qrBase64), (c) =>
        c.charCodeAt(0)
      );

      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      const fontBytes = await fetch('/fonts/OpenSans-Regular.ttf').then((res) =>
        res.arrayBuffer()
      );
      const font = await pdfDoc.embedFont(fontBytes);

      // A4
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();

      const qrImage = await pdfDoc.embedPng(qrBytes);

      const margin = 40;
      const cardX = margin;
      const cardY = margin;
      const cardWidth = width - margin * 2;
      const cardHeight = height - margin * 2;

      page.drawRectangle({
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
        color: rgb(0.97, 0.97, 0.99),
      });

      const headerHeight = 80;
      page.drawRectangle({
        x: cardX,
        y: cardY + cardHeight - headerHeight,
        width: cardWidth,
        height: headerHeight,
        color: rgb(0.12, 0.13, 0.18),
      });

      page.drawText('ДОСТУП НА ТЕРРИТОРИЮ', {
        x: cardX + 28,
        y: cardY + cardHeight - headerHeight + 46,
        size: 20,
        font,
        color: rgb(1, 1, 1),
      });

      page.drawText('PassGuard • QR-пропуск', {
        x: cardX + 28,
        y: cardY + cardHeight - headerHeight + 26,
        size: 11,
        font,
        color: rgb(0.82, 0.82, 0.92),
      });

      const codeText = `Код: ${pass.code}`;
      const codeWidth = font.widthOfTextAtSize(codeText, 11);
      page.drawText(codeText, {
        x: cardX + cardWidth - 28 - codeWidth,
        y: cardY + cardHeight - headerHeight + 30,
        size: 11,
        font,
        color: rgb(0.85, 0.85, 0.95),
      });

      const contentX = cardX + 28;
      const contentYTop = cardY + cardHeight - headerHeight - 24;
      let y = contentYTop;

      const typeLabelMap: Record<string, string> = {
        guest: 'Гостевой пропуск',
        resident: 'Пропуск жильца',
        vehicle: 'Пропуск для авто',
        contractor: 'Пропуск подрядчика',
      };
      const typeLabel: string = typeLabelMap[pass.type] || String(pass.type);

      page.drawText(typeLabel, {
        x: contentX,
        y,
        size: 16,
        font,
        color: rgb(0.15, 0.15, 0.22),
      });
      y -= 26;

      page.drawText('ФИО', {
        x: contentX,
        y,
        size: 9,
        font,
        color: rgb(0.45, 0.45, 0.55),
      });
      y -= 14;
      page.drawText(pass.full_name, {
        x: contentX,
        y,
        size: 13,
        font,
        color: rgb(0.12, 0.12, 0.18),
      });
      y -= 24;

      if (pass.car_plate) {
        page.drawText('Госномер авто', {
          x: contentX,
          y,
          size: 9,
          font,
          color: rgb(0.45, 0.45, 0.55),
        });
        y -= 14;
        page.drawText(String(pass.car_plate), {
          x: contentX,
          y,
          size: 14,
          font,
          color: rgb(0.05, 0.05, 0.08),
        });
        y -= 24;
      }

      const fromStr = new Date(pass.valid_from).toLocaleString('ru-RU');
      const untilStr = new Date(pass.valid_until).toLocaleString('ru-RU');

      page.drawText('Период действия', {
        x: contentX,
        y,
        size: 9,
        font,
        color: rgb(0.45, 0.45, 0.55),
      });
      y -= 14;
      page.drawText(`С: ${fromStr}`, {
        x: contentX,
        y,
        size: 11,
        font,
        color: rgb(0.15, 0.15, 0.22),
      });
      y -= 16;
      page.drawText(`До: ${untilStr}`, {
        x: contentX,
        y,
        size: 11,
        font,
        color: rgb(0.15, 0.15, 0.22),
      });
      y -= 24;

      const rawStatus: string = pass.status ?? 'unknown';
      const statusLabel =
        rawStatus === 'active'
          ? 'АКТИВЕН'
          : rawStatus === 'used'
          ? 'ИСПОЛЬЗОВАН'
          : rawStatus === 'cancelled'
          ? 'ОТМЕНЁН'
          : rawStatus === 'expired'
          ? 'ИСТЁК'
          : String(rawStatus).toUpperCase();

      const statusText = pass.single_use
        ? `${statusLabel} • ОДНОРАЗОВЫЙ`
        : statusLabel;

      page.drawText('Статус', {
        x: contentX,
        y,
        size: 9,
        font,
        color: rgb(0.45, 0.45, 0.55),
      });
      y -= 14;
      page.drawText(statusText, {
        x: contentX,
        y,
        size: 11,
        font,
        color:
          rawStatus === 'active'
            ? rgb(0.1, 0.5, 0.3)
            : rawStatus === 'cancelled'
            ? rgb(0.7, 0.2, 0.2)
            : rawStatus === 'used'
            ? rgb(0.25, 0.35, 0.6)
            : rgb(0.4, 0.4, 0.45),
      });

      const qrBlockWidth = 220;
      const qrBlockHeight = 260;
      const qrBlockX = cardX + cardWidth - 28 - qrBlockWidth;
      const qrBlockY = contentYTop - qrBlockHeight + 40;

      page.drawRectangle({
        x: qrBlockX,
        y: qrBlockY,
        width: qrBlockWidth,
        height: qrBlockHeight,
        color: rgb(0.93, 0.94, 0.99),
      });

      const qrSize = 160;
      const qrX = qrBlockX + (qrBlockWidth - qrSize) / 2;
      const qrY = qrBlockY + (qrBlockHeight - qrSize) / 2 + 10;

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      });

      page.drawText('Покажите этот QR на въезде / проходной', {
        x: qrBlockX + 18,
        y: qrBlockY + 18,
        size: 9,
        font,
        color: rgb(0.35, 0.35, 0.5),
      });

      page.drawText('Сгенерировано системой PassGuard', {
        x: cardX + 28,
        y: cardY + 14,
        size: 8,
        font,
        color: rgb(0.6, 0.6, 0.7),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], {
        type: 'application/pdf',
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `pass-${pass.code}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF error', e);
      alert('Не удалось сформировать PDF.');
    }
  }

  // ---- JSX ----

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-5xl flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Админка пропусков</h1>
          <p className="text-sm text-slate-600">
            Создание и управление QR-пропусками.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 border border-red-500 px-3 py-1 rounded-lg hover:bg-red-50"
        >
          Выйти
        </button>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Форма создания */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Создание QR-пропуска
          </h2>

          <form onSubmit={handleCreatePass} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Тип пропуска
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PassType)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="guest">Гость</option>
                <option value="vehicle">Авто</option>
                <option value="resident">Жилец</option>
                <option value="contractor">Подрядчик</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                ФИО
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Номер авто (если есть)
              </label>
              <input
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="90-AA-123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Действителен с
                </label>
                <input
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Действителен до
                </label>
                <input
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={singleUse}
                onChange={(e) => setSingleUse(e.target.checked)}
              />
              Одноразовый пропуск
            </label>

            {error && (
              <div className="text-red-600 text-sm">
                Ошибка: {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingCreate}
              className="w-full bg-black text-white rounded-lg py-2 font-semibold hover:bg-zinc-800 disabled:opacity-60"
            >
              {loadingCreate ? 'Создаём...' : 'Создать пропуск'}
            </button>
          </form>

          {createdPass && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium mb-2">
                Пропуск создан:
              </p>
              <div className="text-xs text-slate-700 space-y-1">
                <p>Код: {createdPass.code}</p>
                <p>ФИО: {createdPass.full_name}</p>
                <p>
                  Срок:{' '}
                  {new Date(
                    createdPass.valid_from
                  ).toLocaleString()}{' '}
                  —{' '}
                  {new Date(
                    createdPass.valid_until
                  ).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => downloadPassPdf(createdPass)}
                className="mt-3 text-xs border px-3 py-1 rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Скачать PDF
              </button>
            </div>
          )}
        </div>

        {/* Список пропусков */}
        <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">
              Пропуска компании
            </h2>
            <button
              onClick={fetchPasses}
              className="text-xs border px-3 py-1 rounded-lg hover:bg-slate-50"
            >
              Обновить
            </button>
          </div>

          {/* Фильтры */}
          <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px]">
            <input
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="border rounded-lg px-2 py-1"
              placeholder="Фильтр по ФИО"
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="border rounded-lg px-2 py-1"
            >
              <option value="all">Все типы</option>
              <option value="guest">Гость</option>
              <option value="vehicle">Авто</option>
              <option value="resident">Жилец</option>
              <option value="contractor">Подрядчик</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as any)
              }
              className="border rounded-lg px-2 py-1"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активен</option>
              <option value="used">Использован</option>
              <option value="cancelled">Отменён</option>
              <option value="expired">Истёк</option>
            </select>

            <div className="flex gap-1">
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="border rounded-lg px-2 py-1 w-1/2"
                title="Дата с"
              />
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="border rounded-lg px-2 py-1 w-1/2"
                title="Дата по"
              />
            </div>
          </div>

          {loadingList && (
            <p className="text-sm text-slate-500 mb-2">
              Загружаем список пропусков…
            </p>
          )}

          {passes.length === 0 && !loadingList && (
            <p className="text-sm text-slate-500">
              Пока нет созданных пропусков.
            </p>
          )}

          {passes.length > 0 &&
            filteredPasses.length === 0 &&
            !loadingList && (
              <p className="text-sm text-slate-500">
                По заданным фильтрам ничего не найдено.
              </p>
            )}

          {filteredPasses.length > 0 && (
            <div className="max-h-[420px] overflow-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-1 text-left">ФИО</th>
                    <th className="px-2 py-1 text-left">Тип</th>
                    <th className="px-2 py-1 text-left">Авто</th>
                    <th className="px-2 py-1 text-left">Срок</th>
                    <th className="px-2 py-1 text-left">Статус</th>
                    <th className="px-2 py-1 text-left">Одн.</th>
                    <th className="px-2 py-1 text-left">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPasses.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-2 py-1">
                        {p.full_name}
                      </td>
                      <td className="px-2 py-1">
                        {p.type === 'vehicle'
                          ? 'Авто'
                          : p.type === 'guest'
                          ? 'Гость'
                          : p.type === 'resident'
                          ? 'Жилец'
                          : p.type === 'contractor'
                          ? 'Подрядчик'
                          : p.type}
                      </td>
                      <td className="px-2 py-1">
                        {p.car_plate || '—'}
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex flex-col">
                          <span>
                            {new Date(
                              p.valid_from
                            ).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            до{' '}
                            {new Date(
                              p.valid_until
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        {p.status}
                      </td>
                      <td className="px-2 py-1">
                        {p.single_use ? 'Да' : 'Нет'}
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex flex-wrap gap-1">
                          {p.status !== 'active' && (
                            <button
                              className="border px-2 py-0.5 rounded-lg text-[10px] hover:bg-slate-50"
                              onClick={() =>
                                handleStatusChange(
                                  p.id,
                                  'active'
                                )
                              }
                            >
                              Активировать
                            </button>
                          )}
                          {p.status !== 'cancelled' && (
                            <button
                              className="border px-2 py-0.5 rounded-lg text-[10px] hover:bg-red-50"
                              onClick={() =>
                                handleStatusChange(
                                  p.id,
                                  'cancelled'
                                )
                              }
                            >
                              Отменить
                            </button>
                          )}
                          {p.status !== 'used' && (
                            <button
                              className="border px-2 py-0.5 rounded-lg text-[10px] hover:bg-slate-50"
                              onClick={() =>
                                handleStatusChange(p.id, 'used')
                              }
                            >
                              Как использ.
                            </button>
                          )}
                          <button
                            onClick={() => downloadPassPdf(p)}
                            className="border px-2 py-0.5 rounded-lg text-[10px] hover:bg-slate-50"
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
