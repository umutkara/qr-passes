export default function KycLandingPage() {
    const year = new Date().getFullYear();
  
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Шапка */}
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-black text-xs font-bold">
              PG
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wide">
                PassGuard KYC
              </span>
              <span className="text-xs text-white/50">
                Identity verification via Telegram
              </span>
            </div>
          </div>
        </header>
  
        {/* Контент */}
        <main className="flex-1 px-6 py-10 flex flex-col items-center">
          <div className="max-w-2xl w-full text-left">
            <h1 className="text-3xl md:text-4xl font-semibold mb-4">
              Верификация личности через Telegram, как сервис.
            </h1>
  
            <p className="text-sm md:text-base text-white/60 mb-6">
              PassGuard KYC — это модуль проверки личности, который работает
              через Telegram. Весь основной функционал доступен через нашего
              бота, без лишнего фронтенда и сложных интеграций.
            </p>
  
            <div className="border border-white/10 rounded-2xl p-5 mb-8">
              <div className="text-xs text-white/50 mb-2">
                Как это работает
              </div>
              <ul className="text-sm text-white/70 space-y-1 mb-4">
                <li>• Вы запускаете бота PassGuard KYC в Telegram.</li>
                <li>• Получаете доступ и инструкции для интеграции.</li>
                <li>
                  • Ваш сервис запрашивает верификацию — мы проверяем данные
                  через Telegram и возвращаем статус <span className="text-white">KYC VERIFIED</span>.
                </li>
              </ul>
  
              <a
                href="https://t.me/passguard_kyc_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition"
              >
                Открыть бота в Telegram
              </a>
  
              <p className="text-[11px] text-white/40 mt-3">
                Требуется установленный Telegram на вашем устройстве.
              </p>
            </div>
  
            <div className="text-xs text-white/50 space-y-1">
              <p>
                Сейчас модуль PassGuard KYC находится в режиме раннего доступа.
              </p>
              <p>
                Позже здесь появится документация по API, управление клиентами
                и настройки тарифа.
              </p>
            </div>
          </div>
        </main>
  
        {/* Подвал */}
        <footer className="px-6 py-4 border-t border-white/10 text-xs text-white/40">
          PassGuard · KYC module · {year}
        </footer>
      </div>
    );
  }
  