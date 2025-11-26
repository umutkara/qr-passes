import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Верхнее меню */}
      <header className="border-b border-white/10 sticky top-0 z-20 bg-black/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-xs font-bold text-black shadow-[0_0_20px_rgba(16,185,129,0.7)]">
              QR
            </div>
            <span className="text-sm sm:text-base font-semibold tracking-wide">
              PassGuard
            </span>
          </div>

          <nav className="hidden sm:flex items-center gap-6 text-sm text-white/70">
            <a href="#how" className="hover:text-white transition">
              Как это работает
            </a>
            <a href="#forwhom" className="hover:text-white transition">
              Для кого
            </a>
            <a href="#features" className="hover:text-white transition">
              Возможности
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm text-white/80 hover:text-white transition"
            >
              Войти в кабинет
            </Link>
            <a
              href="https://wa.me/994509990790"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex text-xs sm:text-sm rounded-full border border-white/30 px-4 py-1.5 hover:bg-white hover:text-black transition font-medium"
            >
              Оформить заявку
            </a>
          </div>
        </div>
      </header>

      {/* HERO-блок */}
      <section className="relative overflow-hidden">
        {/* мягкие “ауроры” */}
        <div className="pointer-events-none absolute -top-40 -right-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-32 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 pt-14 pb-16 sm:pt-20 sm:pb-24 flex flex-col lg:flex-row items-center gap-10">
          {/* Текст слева */}
          <div className="w-full lg:w-1/2 space-y-6 relative z-10">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
              Цифровые пропуска для объектов
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight">
              Управляйте доступом на территорию
              <span className="block text-white/70">
                так же просто, как отправить QR-код.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-white/70 max-w-xl">
              PassGuard — система QR-пропусков для жилых комплексов, бизнес-центров,
              складов и частных территорий. Вы выдаёте гостевые и постоянные пропуска,
              контролируете въезд автомобилей и проход людей — без бумажек и путаницы.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/login"
                className="inline-flex justify-center items-center rounded-full bg-white text-black px-6 py-2.5 text-sm font-semibold hover:bg-zinc-200 transition"
              >
                Войти в кабинет
              </Link>

              <a
                href="https://wa.me/994509990790"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center items-center rounded-full border border-emerald-400/80 px-6 py-2.5 text-sm font-medium text-emerald-200 hover:bg-emerald-400 hover:text-black transition"
              >
                Оформить заявку в WhatsApp
              </a>

              <a
                href="tel:+994509990790"
                className="inline-flex justify-center items-center rounded-full border border-white/30 px-6 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 transition"
              >
                Позвонить
              </a>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-white/60 pt-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                Гостю не нужно устанавливать приложение
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400" />
                Охрана работает через веб-сканер
              </div>
            </div>
          </div>

          {/* Макет интерфейса справа */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative z-10">
            <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-zinc-900/80 to-black border border-white/15 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold">Панель охраны</p>
                  <p className="text-[10px] text-white/50">
                    Сканирование QR-пропусков в реальном времени
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/50">
                  Онлайн
                </span>
              </div>

              <div className="rounded-2xl bg-black/70 border border-white/10 p-3 mb-3">
                <p className="text-[11px] text-white/70 mb-2">
                  Наведите камеру на QR-код гостя или автомобиля. Система проверит пропуск
                  и покажет можно ли пропускать.
                </p>
                <div className="aspect-video rounded-xl bg-zinc-900 flex items-center justify-center text-[10px] text-white/40 border border-dashed border-white/15">
                  Окно камеры / сканера
                </div>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Гость: Nigar A.</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/40">
                    Пропуск подтверждён
                  </span>
                </div>
                <div className="flex items-center justify-between text-white/45">
                  <span>Авто: 10-AB-123</span>
                  <span>Действует до 22:00 сегодня</span>
                </div>
              </div>

              <div className="mt-3 border-t border-white/10 pt-3 text-[10px] text-white/45">
                PassGuard можно интегрировать с вашей охраной, постами и шлагбаумами.
                QR-коды проверяются на действительность и принадлежность к объекту.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Блок: Как это работает */}
      <section id="how" className="border-t border-white/10 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6">
            Как работает PassGuard
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-white/75">
            {[
              {
                step: 'Шаг 1',
                title: 'Админ создаёт пропуск',
                text: 'В личном кабинете управляющий вводит ФИО гостя, номер авто и срок действия. Система генерирует уникальный QR-код.',
              },
              {
                step: 'Шаг 2',
                title: 'Гость получает QR',
                text: 'QR отправляется гостю как картинка или PDF в мессенджере или по e-mail. Гостю достаточно показать код на телефоне или распечатке.',
              },
              {
                step: 'Шаг 3',
                title: 'Охрана сканирует',
                text: 'На посту охраны открывается страница сканера. При сканировании система проверяет срок действия, статус и принадлежность к объекту.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-white/15 bg-black/40 p-4 overflow-hidden"
              >
                <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-emerald-400/80 via-cyan-400/60 to-transparent" />
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                  {item.step}
                </p>
                <p className="font-medium text-white mt-1 mb-2">
                  {item.title}
                </p>
                <p className="text-xs text-white/70">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Блок: Для кого */}
      <section id="forwhom" className="border-t border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6">
            Для каких объектов это подходит
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-white/80">
            {/* Каждая карточка с “линией” сверху и внутри */}
            <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-900/80 to-black p-4">
              <div className="h-0.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-transparent mb-3" />
              <p className="font-medium mb-1">Жилые комплексы</p>
              <p className="text-xs text-white/60 mb-3">
                Гости, курьеры, сервисные службы, арендаторы.
              </p>
              <ul className="text-xs text-white/70 space-y-1 border-t border-white/10 pt-3">
                <li className="flex items-center gap-2">
                  <span className="h-px w-4 bg-emerald-400" />
                  Гостевые пропуска
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-px w-4 bg-emerald-400" />
                  Авто жильцов и резидентов
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-px w-4 bg-emerald-400" />
                  Разграничение доступа по зонам
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-900/80 to-black p-4">
              <div className="h-0.5 w-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-transparent mb-3" />
              <p className="font-medium mb-1">Бизнес-центры и офисы</p>
              <p className="text-xs text-white/60 mb-3">
                Подрядчики, посетители, разовые встречи.
              </p>
              <ul className="text-xs text-white/70 space-y-1 border-t border-white/10 pt-3">
                <li className="flex items-center gap-2">
                  <span className="h-px w-4 bg-cyan-400" />
                  Временные пропуска на день/слот
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-px w-4 bg-cyan-400" />
                  Доступ в общие и закрытые зоны
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-px w-4 bg-cyan-400" />
                  История посещений
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-900/80 to-black p-4">
              <div className="h-0.5 w-full bg-gradient-to-r from-purple-400 via-cyan-400 to-transparent mb-3" />
              <p className="font-medium mb-1">Склады и частные территории</p>
              <p className="text-xs text-white/60 mb-3">
                Въезд транспорта и грузов.
              </p>
              <ul className="text-xs text-white/70 space-y-1 border-t border-white/10 pt-3">
                <li className="flex items-center gap-2">
                  <span className="h-px w-4 bg-purple-400" />
                  Пропуска для грузовых авто
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-px w-4 bg-purple-400" />
                  Ограничение по времени/датам
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-px w-4 bg-purple-400" />
                  Совместная работа с охраной и шлагбаумами
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Блок: Возможности */}
      <section id="features" className="border-t border-white/10 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6">
            Основные возможности системы
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-white/80">
            <div className="rounded-2xl border border-white/15 bg-black/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-0.5 bg-gradient-to-b from-emerald-400 via-cyan-400 to-transparent" />
                <p className="font-medium">Админ-панель для управляющей компании</p>
              </div>
              <ul className="text-xs text-white/70 space-y-1 border-t border-white/10 pt-3">
                <li>Создание и управление пропусками</li>
                <li>Отмена, активация, отметка как использованный</li>
                <li>Фильтрация по статусам и типам пропусков</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-0.5 bg-gradient-to-b from-cyan-400 via-emerald-400 to-transparent" />
                <p className="font-medium">Панель охраны</p>
              </div>
              <ul className="text-xs text-white/70 space-y-1 border-t border-white/10 pt-3">
                <li>Сканирование QR прямо из браузера</li>
                <li>Моментальная проверка статуса пропуска</li>
                <li>Ограничение пропусков по объекту (чужие не проходят)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Блок: Заявка / контакты */}
      <section
        id="request"
        className="border-t border-white/10 bg-gradient-to-t from-zinc-950 to-black"
      >
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="rounded-3xl border border-white/20 bg-black/60 px-6 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
                Подключение
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold">
                Хотите протестировать PassGuard на своём объекте?
              </h2>
              <p className="text-sm text-white/70 max-w-xl">
                Напишите в WhatsApp или позвоните. Обсудим формат работы для вашего ЖК,
                бизнес-центра или территории, и подготовим демо-доступ.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <a
                href="https://wa.me/994509990790"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center items-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black px-6 py-2.5 font-semibold hover:from-emerald-300 hover:to-cyan-300 transition"
              >
                Написать в WhatsApp
              </a>
              <a
                href="tel:+994509990790"
                className="inline-flex justify-center items-center rounded-full border border-white/40 px-6 py-2.5 font-medium text-white/85 hover:bg-white/10 transition"
              >
                Позвонить: +994 50 999 07 90
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="border-t border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/50">
          <span>© {new Date().getFullYear()} PassGuard. Все права защищены.</span>
          <span>Сервис цифровых QR-пропусков для объектов в Азербайджане.</span>
        </div>
      </footer>
    </main>
  );
}
