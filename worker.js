const GAME_URL = 'https://broderiemegahub.github.io/GameHub/';
const FIREBASE_URL = 'https://gamehubonline-7b970-default-rtdb.firebaseio.com';
const GEM_RATE_RUB = 10;

export default {
  async fetch(request, env) {
    if (request.method === 'POST') {
      try {
        const update = await request.json();
        await handleUpdate(update, env.BOT_TOKEN);
      } catch (e) {
        console.error(e);
      }
      return new Response('OK', { status: 200 });
    }
    return new Response('Game Hub Bot is running 24/7!', { status: 200 });
  }
};

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatCompact(n) {
  n = Math.floor(Math.max(0, Number(n) || 0));
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

async function tgApi(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🎮 ЗАПУСТИТЬ GAME HUB', web_app: { url: GAME_URL } }],
      [
        { text: '💎 Мой профиль', callback_data: 'profile' },
        { text: '🏆 Топ игроков', callback_data: 'top_tetris' }
      ],
      [
        { text: '⚔️ Дуэли и режимы', callback_data: 'modes' },
        { text: '💱 Курс гемов', callback_data: 'rates' }
      ]
    ]
  };
}

function getWelcomeText(firstName) {
  return (
    `👋 Привет, <b>${escHtml(firstName)}</b>!\n\n` +
    `Добро пожаловать в <b>GAME HUB</b> — игровой центр прямо внутри Telegram:\n\n` +
    `💣 <b>Сапёр</b> — классика на скорость со скинами поля\n` +
    `🧱 <b>Тетрис</b> — неоновые блоки, свайпы и комбо\n` +
    `🀄 <b>Маджонг</b> — 15 уровней на внимательность\n` +
    `🧪 <b>Зомби-Лаба</b> — кликер с эволюцией и мутагеном\n` +
    `🎯 <b>Cyber Aim</b> — тренажёр реакции за 30 секунд\n` +
    `⚔️ <b>Дуэли 1 на 1</b> — честные баттлы на 💎 с общим Seed\n\n` +
    `Жми кнопку ниже, забирай ежедневный бонус и залетай в топ!`
  );
}

async function handleUpdate(update, token) {
  if (!token) return;

  // 1. Обработка текстовых команд (/start, /profile, /top)
  if (update.message && update.message.text) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const firstName = msg.from?.first_name || 'Игрок';

    if (text.startsWith('/start')) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: getWelcomeText(firstName),
        parse_mode: 'HTML',
        reply_markup: getMainMenuKeyboard()
      });
      return;
    }

    if (text === '/profile') {
      const profileText = await buildProfileText(msg.from);
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: profileText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Открыть игру', web_app: { url: GAME_URL } }],
            [{ text: '⬅ В главное меню', callback_data: 'back_start' }]
          ]
        }
      });
      return;
    }

    if (text === '/top') {
      const topText = await buildLeaderboardText('tetris');
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: topText,
        parse_mode: 'HTML',
        reply_markup: getTopKeyboard('tetris')
      });
      return;
    }
  }

  // 2. Обработка нажатий на inline-кнопки
  if (update.callback_query) {
    const cb = update.callback_query;
    const data = cb.data;
    const chatId = cb.message.chat.id;
    const messageId = cb.message.message_id;
    const firstName = cb.from?.first_name || 'Игрок';

    await tgApi(token, 'answerCallbackQuery', { callback_query_id: cb.id });

    if (data === 'back_start') {
      await tgApi(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: getWelcomeText(firstName),
        parse_mode: 'HTML',
        reply_markup: getMainMenuKeyboard()
      });
      return;
    }

    if (data === 'profile') {
      const profileText = await buildProfileText(cb.from);
      await tgApi(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: profileText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Обновить данные', callback_data: 'profile' }],
            [{ text: '🎮 Открыть Game Hub', web_app: { url: GAME_URL } }],
            [{ text: '⬅ Назад', callback_data: 'back_start' }]
          ]
        }
      });
      return;
    }

    if (data.startsWith('top_')) {
      const game = data.replace('top_', '');
      const topText = await buildLeaderboardText(game);
      await tgApi(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: topText,
        parse_mode: 'HTML',
        reply_markup: getTopKeyboard(game)
      });
      return;
    }

    if (data === 'modes') {
      const modesText =
        `⚔️ <b>КАК РАБОТАЮТ ДУЭЛИ И РЕЖИМЫ</b>\n\n` +
        `1. Заходи в раздел <b>⚔️ ДУЭЛИ</b> внутри игры.\n` +
        `2. Выбирай любого соперника из списка, игру и ставку в <b>💎</b>.\n` +
        `3. Обоим игрокам выпадает <b>абсолютно одинаковое поле</b> (единый Seed) — решает только твой скилл!\n` +
        `4. Победитель забирает <b>весь банк (×2)</b> автоматически.`;

      await tgApi(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: modesText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⚔️ Перейти к дуэлям', web_app: { url: GAME_URL } }],
            [{ text: '⬅ Назад', callback_data: 'back_start' }]
          ]
        }
      });
      return;
    }

    if (data === 'rates') {
      const rateText =
        `💎 <b>КРИСТАЛЛЫ И КАСТОМИЗАЦИЯ</b>\n\n` +
        `Зарабатывать гемы можно бесплатно:\n` +
        `• 🎁 Ежедневный бонус (до <b>100 💎</b> в день)\n` +
        `• 🏆 Победы в Сапёре, Тетрисе, Маджонге и Cyber Aim\n` +
        `• 🧪 Золотые колбы и новые стадии в Зомби-Лабе\n` +
        `• ⚔️ Победы в дуэлях против других игроков\n\n` +
        `💱 Актуальный курс пополнения: <b>1 ₽ = ${GEM_RATE_RUB} 💎</b>\n` +
        `Твой ID для зачисления: <code>tg_${cb.from.id}</code>`;

      await tgApi(token, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: rateText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Открыть Магазин', web_app: { url: GAME_URL } }],
            [{ text: '⬅ Назад', callback_data: 'back_start' }]
          ]
        }
      });
    }
  }
}

async function buildProfileText(user) {
  const playerId = `tg_${user.id}`;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Игрок';

  try {
    const [pRes, mRes, tRes, zRes, aRes] = await Promise.all([
      fetch(`${FIREBASE_URL}/players/${playerId}.json`),
      fetch(`${FIREBASE_URL}/leaderboard/mines/${playerId}.json`),
      fetch(`${FIREBASE_URL}/leaderboard/tetris/${playerId}.json`),
      fetch(`${FIREBASE_URL}/leaderboard/zlab/${playerId}.json`),
      fetch(`${FIREBASE_URL}/leaderboard/aim/${playerId}.json`)
    ]);

    const player = (await pRes.json()) || {};
    const mines = await mRes.json();
    const tetris = await tRes.json();
    const zlab = await zRes.json();
    const aim = await aRes.json();

    const gems = Number(player.gems) || 0;
    const badge = player.badge ? ` [${escHtml(player.badge)}]` : '';

    return (
      `👤 <b>ПРОФИЛЬ ИГРОКА</b>\n\n` +
      `Ник: <b>${escHtml(fullName)}</b>${badge}\n` +
      `ID: <code>${playerId}</code>\n` +
      `Баланс: <b>${gems} 💎</b>\n\n` +
      `📊 <b>Личные рекорды:</b>\n` +
      `• 💣 Сапёр: <b>${mines?.val ? mines.val + ' сек' : '—'}</b>\n` +
      `• 🧱 Тетрис: <b>${tetris?.val ? tetris.val + ' pts' : '—'}</b>\n` +
      `• 🧪 Зомби-Лаба: <b>${zlab?.val ? formatCompact(zlab.val) : '—'}</b>\n` +
      `• 🎯 Cyber Aim: <b>${aim?.val ? aim.val + ' pts' : '—'}</b>`
    );
  } catch {
    return `⚠️ Не удалось загрузить профиль из базы. Попробуй через пару секунд!`;
  }
}

function getTopKeyboard(activeGame) {
  const tabs = [
    { id: 'mines', label: '💣 Сапёр' },
    { id: 'tetris', label: '🧱 Тетрис' },
    { id: 'zlab', label: '🧪 Лаба' },
    { id: 'aim', label: '🎯 Аим' }
  ];

  return {
    inline_keyboard: [
      tabs.map(t => ({
        text: t.id === activeGame ? `• ${t.label} •` : t.label,
        callback_data: `top_${t.id}`
      })),
      [{ text: '🎮 Побить рекорд', web_app: { url: GAME_URL } }],
      [{ text: '⬅ В главное меню', callback_data: 'back_start' }]
    ]
  };
}

async function buildLeaderboardText(game) {
  const titles = {
    mines: '💣 ТОП САПЁРА (по времени)',
    tetris: '🧱 ТОП ТЕТРИСА',
    zlab: '🧪 ТОП ЗОМБИ-ЛАБЫ',
    aim: '🎯 ТОП CYBER AIM'
  };

  try {
    const [lbRes, banRes] = await Promise.all([
      fetch(`${FIREBASE_URL}/leaderboard/${game}.json`),
      fetch(`${FIREBASE_URL}/banned.json`)
    ]);
    const raw = (await lbRes.json()) || {};
    const banned = (await banRes.json()) || {};

    let list = Object.entries(raw)
      .filter(([id]) => !(banned[id] && banned[id].banned))
      .map(([id, item]) => ({
        name: item.name || 'Игрок',
        badge: item.badge ? ` ${item.badge}` : '',
        val: Number(item.val) || 0
      }));

    if (game === 'mines') list.sort((a, b) => a.val - b.val);
    else list.sort((a, b) => b.val - a.val);

    list = list.slice(0, 7);

    if (list.length === 0) {
      return `🏆 <b>${titles[game]}</b>\n\nПока пусто — стань первым!`;
    }

    const medals = ['🥇', '🥈', '🥉', '4.', '5.', '6.', '7.'];
    const rows = list.map((item, i) => {
      const scoreStr =
        game === 'mines' ? `${item.val}с` :
        game === 'zlab' ? `${formatCompact(item.val)} 🧪` :
        `${item.val} pts`;
      return `${medals[i]} <b>${escHtml(item.name)}</b>${escHtml(item.badge)} — <code>${scoreStr}</code>`;
    });

    return `🏆 <b>${titles[game]}</b>\n\n${rows.join('\n')}`;
  } catch {
    return `⚠️ Ошибка загрузки таблицы лидеров.`;
  }
}
