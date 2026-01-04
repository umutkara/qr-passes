// Загружаем переменные окружения из .env.bot
require('dotenv').config({ path: '.env.bot' });

const { Telegraf } = require('telegraf');

// ⚠️ ВСТАВЬ СЮДА СВОЙ ТОКЕН
const BOT_TOKEN = process.env.PASSGUARD_KYC_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('PASSGUARD_KYC_BOT_TOKEN is not set');
  process.exit(1);
}

// Базовый URL твоего бэкенда.
// ЛОКАЛЬНО: http://localhost:3000
// ПОСЛЕ ДЕПЛОЯ: https://ТВОЙ-ДОМЕН.vercel.app
const BASE_URL = process.env.PASSGUARD_BASE_URL || 'http://localhost:3000';

const bot = new Telegraf(BOT_TOKEN);

// Простая "память" между вопросами (для начала можно так)
const pendingRegistrations = new Map();

// /start — приветствие и регистрация
bot.start(async (ctx) => {
  const tgId = ctx.from.id;
  const username = ctx.from.username || '';

  await ctx.reply(
    `Привет, ${ctx.from.first_name || 'друг'}!\n\n` +
      `Я — PassGuard KYC бот.\n` +
      `Я помогу вашей компании получать API-ключ для KYC-проверок через Telegram.\n\n` +
      `Для начала давай зарегистрируем вашу компанию.\n\n` +
      `Напиши, пожалуйста, *название компании*.`,
    { parse_mode: 'Markdown' }
  );

  pendingRegistrations.set(tgId, {
    step: 'ask_name',
    data: {
      contact_telegram: username ? '@' + username : null,
    },
  });
});

// Общий обработчик сообщений (диалог регистрации)
bot.on('text', async (ctx) => {
  const tgId = ctx.from.id;
  const state = pendingRegistrations.get(tgId);

  // Если нет активной регистрации — игнорируем
  if (!state) {
    return;
  }

  const text = ctx.message.text?.trim() || '';

  if (state.step === 'ask_name') {
    state.data.name = text;
    state.step = 'ask_email';

    pendingRegistrations.set(tgId, state);

    await ctx.reply(
      'Окей. Теперь укажи рабочий email, на который будет зарегистрирован доступ (можно корпоративный).'
    );
    return;
  }

  if (state.step === 'ask_email') {
    state.data.contact_email = text;
    state.step = 'registering';
    pendingRegistrations.set(tgId, state);

    await ctx.reply('Регистрирую клиента в PassGuard KYC, подожди пару секунд...');

    try {
      const res = await fetch(`${BASE_URL}/api/kyc/clients/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.data.name,
          contact_email: state.data.contact_email,
          contact_telegram: state.data.contact_telegram,
          ton_wallet: null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('register error:', data);
        await ctx.reply(
          'Не удалось создать клиента. Сообщение от сервера:\n' +
            (data?.message || data?.error || 'Unknown error')
        );
      } else {
        await ctx.reply(
          '✅ Клиент успешно создан!\n\n' +
            `Название: *${state.data.name}*\n` +
            `Email: *${state.data.contact_email}*\n\n` +
            `Твой *API Key* (сохрани его в надёжном месте):\n` +
            `\`${data.api_key}\`\n\n` +
            `Этот ключ нужно передавать в запросах к PassGuard KYC.`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (e) {
      console.error('fetch error:', e);
      await ctx.reply('Произошла ошибка при запросе к серверу. Попробуй чуть позже.');
    } finally {
      pendingRegistrations.delete(tgId);
    }

    return;
  }
});

// /mykey — потом сделаем, когда добавим эндпоинт для поиска по Telegram
bot.command('mykey', async (ctx) => {
  await ctx.reply(
    'Эта команда будет показывать твой API-ключ, ' +
      'когда мы добавим поиск клиента по Telegram ID в бэкенде.'
  );
});

// Функция для запуска бота
async function startBot() {
  try {
    await bot.launch();
    console.log('PassGuard KYC bot started');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Запускаем бота
startBot();

// Чтобы бот корректно завершался на хостингах
process.once('SIGINT', () => {
  console.log('Stopping bot...');
  bot.stop('SIGINT');
  process.exit(0);
});
process.once('SIGTERM', () => {
  console.log('Stopping bot...');
  bot.stop('SIGTERM');
  process.exit(0);
});
