import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO — KYC FIRST */}
      <section className="relative overflow-hidden pt-24 pb-28 animate-fadeIn">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[10%] w-[40rem] h-[40rem] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-30%] right-[0%] w-[35rem] h-[35rem] bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-6xl font-semibold leading-tight mb-6 animate-slideUp">
            AI Verification for the Real World
          </h1>
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto animate-slideUp delay-150">
            PassGuard KYC — мгновенная верификация личности с использованием Face Match,
            Video Liveness и AI-анализом документов. Готово к использованию в Telegram,
            вебе и корпоративных системах.
          </p>

          <div className="flex justify-center gap-4 mt-10 animate-scaleIn">
            <Link
              href="/register"
              className="px-8 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition"
            >
              Начать бесплатно
            </Link>

            <Link
              href="/login"
              className="px-8 py-3 rounded-full border border-white/20 text-white font-medium text-sm hover:bg-white/10 transition"
            >
              Войти в аккаунт
            </Link>
          </div>
        </div>
      </section>

      {/* KYC FEATURES */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-12 text-center animate-slideUp">
            Возможности PassGuard KYC
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Face Match",
                text: "AI сравнивает лицо с документа и реальное лицо пользователя, используя embedding-модели.",
              },
              {
                title: "Video Liveness",
                text: "Определяем живость по видео: моргания, микродвижения, текстура кожи, защита от экранных записей.",
              },
              {
                title: "OCR документов",
                text: "Чтение номера документа, ФИО, MRZ, даты рождения и срока действия. Даже на сложных снимках.",
              },
              {
                title: "Anti-Spoofing",
                text: "AI-защита от подделок: фото, распечатки, deepfake, видео с монитора.",
              },
              {
                title: "Document Quality Check",
                text: "Определяем блики, размытость, подделку, искажения и низкое качество изображения.",
              },
              {
                title: "Работает в Telegram",
                text: "KYC проходит прямо в Telegram-боте без установки приложений. Быстро и удобно.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-neutral-900 border border-white/10 animate-fadeIn"
              >
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW KYC WORKS */}
      <section className="py-24 border-t border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-12 animate-slideUp">
            Как работает PassGuard KYC
          </h2>

          <div className="space-y-8">
            {[
              "Пользователь открывает KYC-ссылку и попадает в Telegram-бота.",
              "Отправляет фото документа.",
              "Записывает короткое видео лица.",
              "AI анализирует документ, лицо, живость и совпадение.",
              "Система возвращает статус: approved / rejected / manual_review.",
            ].map((step, idx) => (
              <div
                key={idx}
                className="flex gap-4 items-start animate-fadeIn"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="text-white/40 text-xl font-semibold">{idx + 1}</div>
                <div className="text-white/70 text-sm">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KYC USE CASES */}
      <section className="py-24 border-t border-white/10 bg-neutral-950">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-12 text-center animate-slideUp">
            Для кого подходит KYC PassGuard
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Финтех / Крипто", text: "Идентификация клиентов и защита от мошенничества." },
              { title: "Жилые комплексы", text: "Проверка резидентов, гостей и доступа на территорию." },
              { title: "Бизнес-центры", text: "Контроль подрядчиков и посетителей." },
              { title: "HR / Security", text: "Подтверждение личности сотрудников." },
              { title: "Маркетплейсы", text: "Проверка продавцов и курьеров." },
              { title: "Государственные структуры", text: "Проверка подлинности ID-документов." },
            ].map((x, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-black border border-white/10 animate-fadeIn"
              >
                <h3 className="text-lg font-semibold mb-2">{x.title}</h3>
                <p className="text-white/60 text-sm">{x.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR MODULE INTRO */}
      <section className="py-24 border-t border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-6 animate-slideUp">
            Access Control Module — QR Пропуска
          </h2>
          <p className="text-white/60 text-sm max-w-2xl mb-12 animate-fadeIn">
            Помимо KYC, PassGuard включает мощную систему управления доступом.
            QR-пропуска позволяют контролировать въезд автомобилей, гостей,
            подрядчиков и персонала — быстро, удобно и без бумажек.
          </p>
        </div>
      </section>

      {/* QR BLOCK — твой старый код */}
      {/** ВСТАВЛЯЮ СЮДА ТВОЙ QR-БЛОК БЕЗ ИЗМЕНЕНИЙ (адаптирован под стиль)**/}

      <section id="how" className="border-t border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6">Как работает система QR-пропусков</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-white/75">
            {[
              {
                step: "Шаг 1",
                title: "Админ создаёт пропуск",
                text: "Управляющий вводит данные гостя, авто и срок действия. Генерируется QR-код.",
              },
              {
                step: "Шаг 2",
                title: "Гость получает QR",
                text: "Гостю приходит QR как картинка или PDF. Достаточно показать охране.",
              },
              {
                step: "Шаг 3",
                title: "Охрана сканирует",
                text: "Сканер в браузере проверяет актуальность и принадлежность к объекту.",
              },
            ].map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-white/15 bg-black p-4">
                <p className="text-xs uppercase tracking-widest text-white/40">{item.step}</p>
                <p className="font-medium text-white mt-1 mb-2">{item.title}</p>
                <p className="text-xs text-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/10 bg-neutral-950">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold mb-4 animate-slideUp">Хотите подключить PassGuard?</h2>
          <p className="text-white/60 text-sm max-w-xl mx-auto animate-fadeIn">
            Обсудим интеграцию KYC или системы пропусков для вашего объекта.
          </p>

          <div className="flex justify-center gap-4 mt-8 animate-scaleIn">
            <a
              href="https://wa.me/994509990790"
              target="_blank"
              className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition"
            >
              WhatsApp
            </a>
            <a
              href="tel:+994509990790"
              className="px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition"
            >
              Позвонить
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} PassGuard. AI Identity & Access Platform.
      </footer>
    </main>
  );
}
