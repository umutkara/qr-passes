'use client';

import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import jsQR from 'jsqr';

type ScanResult =
  | 'idle'
  | 'ok'
  | 'expired'
  | 'cancelled'
  | 'used'
  | 'not_found'
  | 'error';

type PassInfo = {
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

export default function GuardPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const [scanResult, setScanResult] = useState<ScanResult>('idle');
  const [passInfo, setPassInfo] = useState<PassInfo | null>(null);
  const [message, setMessage] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);

  const lastCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        startScanLoop();
      } catch (e) {
        console.error('Camera error:', e);
        setMessage('Ошибка доступа к камере. Проверьте разрешения браузера.');
        setScanResult('error');
      }
    }

    function startScanLoop() {
      const scan = () => {
        if (stopped) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) {
          animationRef.current = requestAnimationFrame(scan);
          return;
        }

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (width && height) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const qr = jsQR(imageData.data, width, height);

            if (qr && qr.data) {
              const now = Date.now();
              if (
                qr.data !== lastCodeRef.current ||
                now - lastScanTimeRef.current > 2000
              ) {
                lastCodeRef.current = qr.data;
                lastScanTimeRef.current = now;
                checkCode(qr.data);
              }
            }
          }
        }

        animationRef.current = requestAnimationFrame(scan);
      };

      animationRef.current = requestAnimationFrame(scan);
    }

    startCamera();

    return () => {
      stopped = true;
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function checkCode(code: string) {
    setLoading(true);
    setScanResult('idle');
    setMessage('');
    setPassInfo(null);

    try {
      const res = await fetch('/api/passes/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const result = data?.result as ScanResult | undefined;
        if (result) {
          setScanResult(result);
        } else {
          setScanResult('error');
        }
        setMessage(data?.error || 'Ошибка проверки пропуска.');
        return;
      }

      const result = data.result as ScanResult;
      setScanResult(result);

      switch (result) {
        case 'ok':
          setMessage('Доступ разрешён.');
          break;
        case 'expired':
          setMessage('Срок действия пропуска истёк.');
          break;
        case 'cancelled':
          setMessage('Пропуск отменён администратором.');
          break;
        case 'used':
          setMessage('Одноразовый пропуск уже был использован.');
          break;
        case 'not_found':
          setMessage('Пропуск не найден или принадлежит другой компании.');
          break;
        default:
          setMessage('Результат проверки: ' + result);
      }


      if (data.pass) {
        setPassInfo(data.pass as PassInfo);
      }
    } catch (e) {
      console.error(e);
      setScanResult('error');
      setMessage('Ошибка связи с сервером.');
    } finally {
      setLoading(false);
    }
  }

  const statusBg = (() => {
    switch (scanResult) {
      case 'ok':
        return 'bg-emerald-500';
      case 'expired':
        return 'bg-orange-500';
      case 'cancelled':
      case 'not_found':
      case 'error':
        return 'bg-red-600';
      case 'used':
        return 'bg-amber-500';
      default:
        return 'bg-slate-700';
    }
  })();

  const statusText = (() => {
    switch (scanResult) {
      case 'ok':
        return 'Доступ разрешён';
      case 'expired':
        return 'Срок истёк';
      case 'cancelled':
        return 'Отменён';
      case 'used':
        return 'Уже использован';
      case 'not_found':
        return 'Не найден';
      case 'error':
        return 'Ошибка';
      default:
        return 'Ожидание сканирования';
    }
  })();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-4xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Панель охраны</h1>
          <p className="text-sm text-white/60">
            Наведите камеру на QR-пропуск или введите код вручную.
          </p>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Левая часть — камера и ручной ввод */}
        <div className="bg-zinc-900 rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
          <div className="relative w-full rounded-xl overflow-hidden border border-white/20 bg-black">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              muted
              playsInline
            />
            {/* overlay рамка */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 border-2 border-emerald-400/90 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.7)]" />
            </div>
          </div>
          <p className="text-[11px] text-white/40">
            Убедитесь, что камера направлена на QR-код. При успешном
            сканировании результат появится справа.
          </p>

          <div className="mt-2 border-t border-white/15 pt-3 space-y-2">
            <p className="text-xs text-white/60">
              Ручной ввод кода (на случай, если QR не считывается камерой):
            </p>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Вставьте сюда код пропуска"
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-white/20 bg-black/40 outline-none"
              />
              <button
                onClick={() => manualCode && checkCode(manualCode)}
                className="text-xs px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200"
              >
                Проверить
              </button>
            </div>
          </div>

          {/* скрытый canvas для распознавания */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Правая часть — статус и данные */}
        <div className="bg-zinc-900 rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
<div className={`${statusBg} rounded-xl px-3 py-2 text-sm font-semibold`}>
            {statusText}
          </div>

          {message && (
            <p className="text-sm text-white/80">
              {message}
            </p>
          )}

          {loading && (
            <p className="text-sm text-white/60">
              Проверяем пропуск…
            </p>
          )}

          {passInfo && (
            <div className="mt-2 border-t border-white/15 pt-3 text-sm space-y-2">
              <div>
                <p className="text-xs text-white/50">ФИО</p>
                <p className="text-sm font-medium">{passInfo.full_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-white/50">Тип пропуска</p>
                  <p className="text-sm">
                    {passInfo.type === 'vehicle'
                      ? 'Авто'
                      : passInfo.type === 'guest'
                      ? 'Гость'
                      : passInfo.type === 'resident'
                      ? 'Жилец'
                      : passInfo.type === 'contractor'
                      ? 'Подрядчик'
                      : passInfo.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Номер авто</p>
                  <p className="text-sm">
                    {passInfo.car_plate || '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-white/50">Действителен с</p>
                  <p className="text-xs">
                    {new Date(passInfo.valid_from).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Действителен до</p>
                  <p className="text-xs">
                    {new Date(passInfo.valid_until).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-white/50">Одноразовый:</span>
                <span className="text-xs font-medium">
                  {passInfo.single_use ? 'Да' : 'Нет'}
                </span>
              </div>

              <p className="text-[11px] text-white/40">
                Если статус &quot;Доступ разрешён&quot; — можно пропускать на территорию.
                Для одноразовых пропусков после успешного прохода статус может
                стать &quot;использован&quot;.
              </p>
            </div>
          )}

          {!passInfo && scanResult === 'idle' && (
            <p className="text-sm text-white/60 mt-2">
              Ожидание сканирования. Наведите камеру на QR-код.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}