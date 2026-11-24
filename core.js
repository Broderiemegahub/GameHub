// ==================== НАСТРОЙКИ БАЗЫ, КУРСА И АДМИНКИ ====================
const FIREBASE_URL = 'https://gamehubonline-7b970-default-rtdb.firebaseio.com';
const ADMIN_PIN = '7777';
const GEM_RATE_RUB = 10; // Курс валюты: 1 ₽ = 10 💎
const DONATE_URL = '';   // Сюда позже вставишь ссылку на Tribute / DonationAlerts

// ==================== СИСТЕМА ОБНОВЛЕНИЙ ====================
const APP_VERSION = '3.4';
const CHANGELOG = [
    `💱 Добавлен курс валюты (1 ₽ = ${GEM_RATE_RUB} 💎) и калькулятор кристаллов в Магазине`,
    '🛒 Магазин предметов: дорогие скины для Тетриса, темы Маджонга, значки в топ и бусты',
    '🎁 Ежедневный бонус кристаллов с растущей наградой за серию входов',
    '👑 В админке теперь можно выдать игроку любое точное число гемов или посчитать по курсу'
];

function initUpdateBadge() {
    const badge = document.getElementById('update-badge');
    if (!badge) return;
    let seen = null;
    try { seen = localStorage.getItem('gameHubSeenVersion'); } catch {}
    if (seen !== APP_VERSION) {
        badge.innerText = 'NEW ' + APP_VERSION;
        badge.classList.add('has-new');
    } else {
        badge.innerText = 'v' + APP_VERSION;
        badge.classList.remove('has-new');
    }
}

function openUpdateModal() {
    document.getElementById('update-modal-title').innerText = 'ОБНОВЛЕНИЕ v' + APP_VERSION;
    document.getElementById('changelog-list').innerHTML = CHANGELOG.map(item => `<li>${item}</li>`).join('');
    document.getElementById('update-modal').classList.add('active');
}

function closeUpdateModal() {
    document.getElementById('update-modal').classList.remove('active');
    try { localStorage.setItem('gameHubSeenVersion', APP_VERSION); } catch {}
    initUpdateBadge();
}

initUpdateBadge();

// ==================== TELEGRAM MINI APP И ПРОФИЛЬ ====================
const tgWebApp = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
if (tgWebApp) {
    tgWebApp.ready();
    tgWebApp.expand();
    if (tgWebApp.disableVerticalSwipes) tgWebApp.disableVerticalSwipes();
}

const rawTgUser = tgWebApp && tgWebApp.initDataUnsafe ? tgWebApp.initDataUnsafe.user : null;
const tgUser = {
    name: rawTgUser ? [rawTgUser.first_name, rawTgUser.last_name].filter(Boolean).join(' ') : 'Игрок',
    username: (rawTgUser && rawTgUser.username) ? '@' + rawTgUser.username : 'Telegram Player',
    photo: (rawTgUser && rawTgUser.photo_url) ? rawTgUser.photo_url : ''
};

function shareGameScore(text) {
    const appUrl = 'https://broderiemegahub.github.io/GameHub/';
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(text)}`;
    if (tgWebApp && tgWebApp.openTelegramLink) {
        tgWebApp.openTelegramLink(shareUrl);
    } else {
        window.open(shareUrl, '_blank');
    }
}

// ==================== ЭКОНОМИКА, ЕЖЕДНЕВНЫЙ БОНУС И МАГАЗИН ====================
const SHOP_CATALOG = [
    // Тетрис скины
    { id: 'tskin_default', cat: 'tetris', icon: '🟦', name: 'Классический неон', desc: 'Стандартная палитра блоков', price: 0, type: 'tetris_skin' },
    { id: 'tskin_gold',    cat: 'tetris', icon: '🟨', name: 'Золотые слитки',    desc: 'Роскошные золотые блоки с бликом', price: 450, type: 'tetris_skin' },
    { id: 'tskin_matrix',  cat: 'tetris', icon: '🟩', name: 'Код Матрицы',       desc: 'Кислотно-зелёный хакерский стиль', price: 700, type: 'tetris_skin' },
    { id: 'tskin_cyber',   cat: 'tetris', icon: '🟪', name: 'Киберпанк 2077',    desc: 'Неоново-розовые и бирюзовые блоки', price: 1000, type: 'tetris_skin' },
    { id: 'tskin_ice',     cat: 'tetris', icon: '❄️', name: 'Крио-лёд',          desc: 'Ледяные кристаллы с морозным оттенком', price: 1500, type: 'tetris_skin' },

    // Темы Маджонга
    { id: 'mj_default', cat: 'mahjong', icon: '🀄', name: 'Классика',             desc: 'Светлые традиционные кости', price: 0, type: 'mj_theme' },
    { id: 'mj_carbon',  cat: 'mahjong', icon: '⬛', name: 'Тёмный карбон',        desc: 'Строгие графитовые фишки с неоном', price: 500, type: 'mj_theme' },
    { id: 'mj_jade',    cat: 'mahjong', icon: '🟢', name: 'Императорский нефрит', desc: 'Изумрудные фишки с золотым кантом', price: 850, type: 'mj_theme' },
    { id: 'mj_royal',   cat: 'mahjong', icon: '🟥', name: 'Королевский рубин',    desc: 'Бордово-золотой премиум стиль', price: 1300, type: 'mj_theme' },

    // Значки и подсветка в топе
    { id: 'badge_none',   cat: 'profile', icon: '👤', name: 'Без значка',      desc: 'Обычное отображение имени', price: 0, type: 'badge', badgeText: '' },
    { id: 'badge_fire',   cat: 'profile', icon: '🔥', name: 'Значок Огонёк',   desc: 'Добавляет 🔥 рядом с ником в топе', price: 250, type: 'badge', badgeText: '🔥' },
    { id: 'badge_crown',  cat: 'profile', icon: '👑', name: 'Значок Корона',   desc: 'Королевский статус 👑 в рейтинге', price: 800, type: 'badge', badgeText: '👑' },
    { id: 'glow_gold',    cat: 'profile', icon: '🌟', name: 'Золотая аура',    desc: 'Твоя строчка в топе светится золотом', price: 1200, type: 'lb_glow' },
    { id: 'badge_vip',    cat: 'profile', icon: '💎', name: 'Тег [VIP]',       desc: 'Эксклюзивный тег [VIP] у твоего имени', price: 2500, type: 'badge', badgeText: 'VIP' },
    { id: 'glow_rainbow', cat: 'profile', icon: '🌈', name: 'Неоновый градиент',desc: 'Яркая переливающаяся рамка в топе', price: 3500, type: 'lb_glow' },
    { id: 'badge_dragon', cat: 'profile', icon: '🐉', name: 'Значок Легенда',  desc: 'Редкий значок 🐉 для топ-игроков', price: 5000, type: 'badge', badgeText: '🐉' },
    { id: 'glow_default', cat: 'profile', icon: '▫️', name: 'Обычная рамка',   desc: 'Стандартная карточка в топе', price: 0, type: 'lb_glow' },

    // Бусты Зомби-лабы
    { id: 'boost_zx2',     cat: 'boosts', icon: '⚡', name: 'Мутаген ×2 (15 мин)', desc: 'Удваивает клик и автодоход в Лабе', price: 120, type: 'consumable' },
    { id: 'z_autoflask',   cat: 'boosts', icon: '🤖', name: 'Дрон-сборщик колб',   desc: 'Навсегда: сам ловит Золотые колбы', price: 1800, type: 'permanent' },
    { id: 'z_gem_drill',   cat: 'boosts', icon: '⛏️', name: 'Кристальный бур',     desc: 'Навсегда: +5 💎 вместо +2 💎 за колбу', price: 2500, type: 'permanent' }
];

let ecoState = loadEcoState();
let currentShopTab = 'tetris';

function loadEcoState() {
    const def = {
        gems: 0,
        claimedIssuedGems: 0,
        owned: ['tskin_default', 'mj_default', 'badge_none', 'glow_default'],
        equipped: {
            tetris_skin: 'tskin_default',
            mj_theme: 'mj_default',
            badge: 'badge_none',
            lb_glow: 'glow_default'
        },
        dailyLastDay: '',
        dailyStreak: 0,
        zBoostUntil: 0
    };
    try {
        const raw = localStorage.getItem('gameHubEconomy');
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                ...def,
                ...parsed,
                owned: Array.isArray(parsed.owned) ? Array.from(new Set([...def.owned, ...parsed.owned])) : def.owned,
                equipped: { ...def.equipped, ...(parsed.equipped || {}) }
            };
        }
    } catch {}
    return def;
}

function saveEcoState() {
    try { localStorage.setItem('gameHubEconomy', JSON.stringify(ecoState)); } catch {}
    updateGemsUI();
    applyMahjongTheme();
}

function getGems() {
    return Math.floor(Math.max(0, ecoState.gems || 0));
}

function addGems(amount, reason = '') {
    const add = Math.floor(amount);
    if (add === 0) return;
    ecoState.gems = Math.max(0, getGems() + add);
    saveEcoState();
    syncGemsToCloud();
    if (reason) {
        const sign = add > 0 ? `+${add}` : `${add}`;
        spawnFloatText(window.innerWidth / 2, window.innerHeight / 2 - 40, `${sign} 💎 (${reason})`, add > 0 ? '#e879f9' : '#ef4444');
    }
}

function hasShopItem(id) {
    return ecoState.owned.includes(id);
}

function getZLabBoostRemaining() {
    return Math.max(0, (ecoState.zBoostUntil || 0) - Date.now());
}

function getTetrisColors() {
    const skin = ecoState.equipped.tetris_skin || 'tskin_default';
    if (skin === 'tskin_gold')   return [null, '#fde047', '#facc15', '#eab308', '#fbbf24', '#f59e0b', '#fef08a', '#d97706'];
    if (skin === 'tskin_matrix') return [null, '#4ade80', '#22c55e', '#16a34a', '#86efac', '#15803d', '#bbf7d0', '#10b981'];
    if (skin === 'tskin_cyber')  return [null, '#f472b6', '#e879f9', '#38bdf8', '#c084fc', '#fb7185', '#22d3ee', '#a855f7'];
    if (skin === 'tskin_ice')    return [null, '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#a5f3fc', '#cffafe', '#0284c7'];
    return [null, '#38bdf8', '#fbbf24', '#a855f7', '#4ade80', '#ef4444', '#3b82f6', '#f97316'];
}

function getEquippedBadgeText() {
    const id = ecoState.equipped.badge || 'badge_none';
    const item = SHOP_CATALOG.find(x => x.id === id);
    return item ? (item.badgeText || '') : '';
}

function getEquippedLbStyle() {
    const id = ecoState.equipped.lb_glow || 'glow_default';
    if (id === 'glow_gold') return 'gold';
    if (id === 'glow_rainbow') return 'rainbow';
    return '';
}

function applyMahjongTheme() {
    const theme = ecoState.equipped.mj_theme || 'mj_default';
    document.body.classList.remove('mj-theme-carbon', 'mj-theme-jade', 'mj-theme-royal');
    if (theme === 'mj_carbon') document.body.classList.add('mj-theme-carbon');
    else if (theme === 'mj_jade') document.body.classList.add('mj-theme-jade');
    else if (theme === 'mj_royal') document.body.classList.add('mj-theme-royal');
}
applyMahjongTheme();

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDailyRewardAmount() {
    const streak = (ecoState.dailyStreak || 0) + 1;
    return Math.min(100, 25 + (streak - 1) * 15);
}

function updateDailyBonusUI() {
    const btn = document.getElementById('daily-bonus-btn');
    if (!btn) return;
    const today = getTodayKey();
    if (ecoState.dailyLastDay === today) {
        btn.innerText = '✅ Бонус взят';
        btn.classList.add('claimed');
    } else {
        btn.innerText = `🎁 +${getDailyRewardAmount()} 💎`;
        btn.classList.remove('claimed');
    }
}

function claimDailyBonus() {
    const today = getTodayKey();
    if (ecoState.dailyLastDay === today) {
        sfxClick();
        spawnFloatText(window.innerWidth / 2, 110, '⏳ Возвращайся завтра за новым бонусом!', '#94a3b8');
        return;
    }

    const yesterday = new Date(Date.now() - 86400000);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    ecoState.dailyStreak = (ecoState.dailyLastDay === yKey) ? (ecoState.dailyStreak || 0) + 1 : 1;
    ecoState.dailyLastDay = today;

    const reward = Math.min(100, 25 + (ecoState.dailyStreak - 1) * 15);
    ecoState.gems = getGems() + reward;
    saveEcoState();
    syncGemsToCloud();
    updateDailyBonusUI();

    sfxVictory();
    doVibrate([50, 30, 90]);
    spawnConfettiCannon(true);
    spawnConfettiCannon(false);
    spawnFloatText(window.innerWidth / 2, 130, `🎁 ДЕНЬ ${ecoState.dailyStreak}: +${reward} 💎!`, '#fbbf24');
}

function updateGemsUI() {
    const val = getGems();
    const mEl = document.getElementById('menu-gems-val');
    const sEl = document.getElementById('shop-gems-val');
    if (mEl) mEl.innerText = val;
    if (sEl) sEl.innerText = val;
    updateDailyBonusUI();
}

function openShop(tab = 'tetris') {
    if (isUserBanned) return;
    showScreen('shop-screen');
    updateGemsUI();
    switchShopTab(tab, true);
}

function switchShopTab(tab, silent = false) {
    if (!silent) sfxClick();
    currentShopTab = tab;
    ['tetris', 'mahjong', 'profile', 'boosts', 'topup'].forEach(t => {
        const el = document.getElementById('shoptab-' + t);
        if (el) el.classList.toggle('active', t === tab);
    });
    renderShopItems();
}

function updateRateCalc() {
    const inp = document.getElementById('rate-rub-input');
    const out = document.getElementById('rate-gems-output');
    if (!inp || !out) return;
    const rub = Math.max(0, Math.floor(Number(inp.value) || 0));
    out.innerText = `= ${rub * GEM_RATE_RUB} 💎`;
}

function setRatePreset(rub) {
    sfxClick();
    const inp = document.getElementById('rate-rub-input');
    if (inp) {
        inp.value = rub;
        updateRateCalc();
    }
}

function copyPlayerTagForTopup() {
    sfxPop();
    const ident = (rawTgUser && rawTgUser.username) ? '@' + rawTgUser.username : myPlayerId;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ident).catch(() => {});
    }
    spawnFloatText(window.innerWidth / 2, window.innerHeight / 2, `📋 Скопировано: ${ident}`, '#4ade80');
}

function renderShopItems() {
    const listEl = document.getElementById('shop-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (currentShopTab === 'topup') {
        const ident = (rawTgUser && rawTgUser.username) ? '@' + rawTgUser.username : myPlayerId;
        const donateBtnHtml = DONATE_URL
            ? `<button class="btn btn-green" style="width:100%;" onclick="sfxClick(); window.open('${DONATE_URL}', '_blank')">💳 ПЕРЕЙТИ К ОПЛАТЕ</button>`
            : `<div style="font-size:0.74rem; color:#94a3b8; text-align:center; line-height:1.35;">Чтобы пополнить баланс по курсу, переведи нужную сумму администратору и укажи свой ник — гемы придут автоматически.</div>`;

        listEl.innerHTML = `
            <div class="rate-card">
                <div class="rate-banner">💱 КУРС: 1 ₽ = ${GEM_RATE_RUB} 💎</div>
                <div style="font-size:0.78rem; color:#cbd5e1; text-align:center;">Введи сумму, чтобы посчитать гемы:</div>
                <div class="rate-calc-row">
                    <input type="number" id="rate-rub-input" class="rate-input" value="100" min="1" oninput="updateRateCalc()">
                    <span style="font-weight:900; color:#94a3b8;">₽</span>
                    <div id="rate-gems-output" class="rate-result">= ${100 * GEM_RATE_RUB} 💎</div>
                </div>
                <div class="rate-presets">
                    <button class="rate-preset-btn" onclick="setRatePreset(50)">50 ₽</button>
                    <button class="rate-preset-btn" onclick="setRatePreset(100)">100 ₽</button>
                    <button class="rate-preset-btn" onclick="setRatePreset(250)">250 ₽</button>
                    <button class="rate-preset-btn" onclick="setRatePreset(500)">500 ₽</button>
                </div>
                <div class="rate-id-box">
                    <span>Твой ник для зачисления: <b style="color:#fff;">${ident}</b></span>
                    <button class="btn btn-xs" style="border-color:var(--accent);" onclick="copyPlayerTagForTopup()">📋</button>
                </div>
                ${donateBtnHtml}
            </div>
        `;
        return;
    }

    const items = SHOP_CATALOG.filter(x => x.cat === currentShopTab);
    const gems = getGems();

    items.forEach(item => {
        const isOwned = ecoState.owned.includes(item.id);
        const isEquippable = ['tetris_skin', 'mj_theme', 'badge', 'lb_glow'].includes(item.type);
        const isEquipped = isEquippable && ecoState.equipped[item.type] === item.id;

        const card = document.createElement('div');
        card.className = 'shop-card' + (isEquipped ? ' equipped' : isOwned ? ' owned' : '');

        let btnText = `💎 ${item.price}`;
        let btnClass = 'shop-buy-btn';

        if (item.type === 'consumable') {
            if (gems < item.price) btnClass += ' cant-afford';
            if (item.id === 'boost_zx2' && getZLabBoostRemaining() > 0) {
                const minsLeft = Math.ceil(getZLabBoostRemaining() / 60000);
                btnText = `⚡ +15м (${minsLeft}м)`;
            }
        } else if (isEquipped) {
            btnText = '✅ Надето';
            btnClass += ' is-equipped';
        } else if (isOwned) {
            btnText = item.type === 'permanent' ? '✅ Куплено' : 'Надеть';
            btnClass += ' can-equip';
        } else if (gems < item.price) {
            btnClass += ' cant-afford';
        }

        card.innerHTML = `
            <div class="shop-item-left">
                <div class="shop-item-icon">${item.icon}</div>
                <div style="min-width:0;">
                    <div class="shop-item-title">${item.name}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                </div>
            </div>
            <button class="${btnClass}" onclick="buyOrEquipShopItem('${item.id}')">${btnText}</button>
        `;
        listEl.appendChild(card);
    });
}

function buyOrEquipShopItem(id) {
    const item = SHOP_CATALOG.find(x => x.id === id);
    if (!item) return;

    const isOwned = ecoState.owned.includes(item.id);
    const isEquippable = ['tetris_skin', 'mj_theme', 'badge', 'lb_glow'].includes(item.type);

    if (isOwned && item.type !== 'consumable') {
        if (isEquippable) {
            ecoState.equipped[item.type] = item.id;
            saveEcoState();
            sfxPop();
            doVibrate(20);
            renderShopItems();
            if (item.type === 'badge' || item.type === 'lb_glow') {
                syncExistingRecords();
            }
        }
        return;
    }

    if (getGems() < item.price) {
        sfxAlarm();
        doVibrate(120);
        spawnFloatText(window.innerWidth / 2, window.innerHeight / 2, '💎 Не хватает кристаллов!', '#ef4444');
        return;
    }

    ecoState.gems = getGems() - item.price;

    if (item.type === 'consumable') {
        if (item.id === 'boost_zx2') {
            const base = Math.max(Date.now(), ecoState.zBoostUntil || 0);
            ecoState.zBoostUntil = base + 15 * 60 * 1000;
        }
    } else {
        ecoState.owned.push(item.id);
        if (isEquippable) {
            ecoState.equipped[item.type] = item.id;
        }
    }

    saveEcoState();
    syncGemsToCloud();
    if (item.type === 'badge' || item.type === 'lb_glow') {
        syncExistingRecords();
    }

    sfxVictory();
    doVibrate([40, 30, 80]);
    spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 30, ['#e879f9', '#fbbf24', '#4ade80']);
    renderShopItems();
}

function initTgProfile() {
    const nameEl = document.getElementById('tg-user-name');
    const tagEl = document.getElementById('tg-user-tag');
    const avatarEl = document.getElementById('tg-avatar');
    if (!nameEl || !avatarEl) return;

    const badge = getEquippedBadgeText();
    nameEl.innerHTML = badge ? `${tgUser.name} <span class="lb-badge-tag">${badge}</span>` : tgUser.name;
    tagEl.innerText = tgUser.username;

    const initial = (tgUser.name.trim()[0] || '👤').toUpperCase();
    if (tgUser.photo) {
        const img = document.createElement('img');
        img.src = tgUser.photo;
        img.onerror = () => { avatarEl.innerHTML = initial; };
        avatarEl.innerHTML = '';
        avatarEl.appendChild(img);
    } else {
        avatarEl.innerText = initial;
    }
    updateGemsUI();
}
initTgProfile();

// ==================== РЕГИСТРАЦИЯ ИГРОКА, СИНХРОНИЗАЦИЯ ГЕМОВ И БАН ====================
function getPlayerId() {
    if (rawTgUser && rawTgUser.id) return 'tg_' + rawTgUser.id;
    let fallbackId = null;
    try { fallbackId = localStorage.getItem('gameHubGuestId'); } catch {}
    if (!fallbackId) {
        fallbackId = 'guest_' + Math.random().toString(36).slice(2, 10);
        try { localStorage.setItem('gameHubGuestId', fallbackId); } catch {}
    }
    return fallbackId;
}

const myPlayerId = getPlayerId();
let isUserBanned = false;
let isBanSyncing = false;

async function syncGemsToCloud() {
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) return;
    try {
        const res = await fetch(`${baseUrl}/players/${myPlayerId}.json?t=${Date.now()}`, { cache: 'no-store' });
        const existing = (res.ok ? await res.json() : null) || {};
        const cloudIssued = Number(existing.issuedGems) || 0;

        // Проверяем, не начислил ли админ новые гемы в облаке
        if (cloudIssued !== (ecoState.claimedIssuedGems || 0)) {
            const diff = cloudIssued - (ecoState.claimedIssuedGems || 0);
            ecoState.gems = Math.max(0, getGems() + diff);
            ecoState.claimedIssuedGems = cloudIssued;
            saveEcoState();
            if (diff > 0) {
                sfxVictory();
                spawnFloatText(window.innerWidth / 2, 120, `💎 Зачислено +${diff} 💎!`, '#4ade80');
            }
        }

        await fetch(`${baseUrl}/players/${myPlayerId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: tgUser.name,
                tag: tgUser.username,
                gems: getGems(),
                issuedGems: cloudIssued,
                badge: getEquippedBadgeText(),
                lbStyle: getEquippedLbStyle(),
                lastSeen: Date.now()
            })
        });
    } catch {}
}
syncGemsToCloud();

function getLocalBan() {
    try {
        const raw = localStorage.getItem('gameHubBanned');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function setLocalBan(data) {
    try {
        if (data) localStorage.setItem('gameHubBanned', JSON.stringify(data));
        else localStorage.removeItem('gameHubBanned');
    } catch {}
}

function triggerLocalBanScreen(reason) {
    isUserBanned = true;
    if (typeof stopAllGames === 'function') stopAllGames();

    const menu = document.getElementById('main-menu');
    if (menu) menu.style.display = 'none';
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');

    const reasonEl = document.getElementById('ban-reason-badge');
    if (reasonEl && reason) reasonEl.innerText = 'Причина: ' + reason;

    const overlay = document.getElementById('ban-overlay');
    if (overlay) {
        const card = overlay.querySelector('.victory-card');
        if (card && !document.getElementById('ban-retry-btn')) {
            const btn = document.createElement('button');
            btn.id = 'ban-retry-btn';
            btn.className = 'btn btn-sm';
            btn.style.marginTop = '12px';
            btn.style.width = '100%';
            btn.innerText = '🔄 Проверить статус';
            btn.onclick = () => checkBanStatus(true);
            card.appendChild(btn);
        }
        overlay.style.zIndex = '99999';
        overlay.style.display = 'flex';
        overlay.classList.add('active');
    }
}

function clearLocalBanScreen() {
    const wasBanned = isUserBanned || !!getLocalBan();
    isUserBanned = false;
    setLocalBan(null);
    setAdminFails(0);

    const overlay = document.getElementById('ban-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
    }

    if (wasBanned) {
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
        const menu = document.getElementById('main-menu');
        if (menu) menu.style.display = 'flex';
        syncGemsToCloud();
        syncExistingRecords();
    }
}

async function banCurrentPlayer(reason) {
    setLocalBan({ banned: true, reason: reason });
    triggerLocalBanScreen(reason);

    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) return;

    isBanSyncing = true;
    try {
        await Promise.all([
            fetch(`${baseUrl}/banned/${myPlayerId}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banned: true, name: tgUser.name, tag: tgUser.username, reason: reason, date: Date.now() })
            }),
            fetch(`${baseUrl}/leaderboard/mines/${myPlayerId}.json`, { method: 'DELETE' }),
            fetch(`${baseUrl}/leaderboard/tetris/${myPlayerId}.json`, { method: 'DELETE' }),
            fetch(`${baseUrl}/leaderboard/zlab/${myPlayerId}.json`, { method: 'DELETE' })
        ]);
    } catch {}
    isBanSyncing = false;
}

const initialLocalBan = getLocalBan();
if (initialLocalBan && initialLocalBan.banned) {
    triggerLocalBanScreen(initialLocalBan.reason || 'Использование читов / автокликера');
}

async function checkBanStatus(manual = false) {
    if (isBanSyncing) return;
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) return;

    const btn = document.getElementById('ban-retry-btn');
    if (manual && btn) btn.innerText = '⏳ Проверяем базу...';

    try {
        const res = await fetch(`${baseUrl}/banned/${myPlayerId}.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const banInfo = await res.json();

        if (banInfo && banInfo.banned) {
            const reason = banInfo.reason || 'Использование читов / автокликера';
            setLocalBan({ banned: true, reason: reason });
            triggerLocalBanScreen(reason);
            if (manual && btn) btn.innerText = '⛔ Бан подтверждён';
        } else {
            clearLocalBanScreen();
            syncGemsToCloud();
        }
    } catch {
        if (manual && btn) btn.innerText = '⚠️ Нет связи с базой (включи VPN)';
    }
}
checkBanStatus();
setInterval(checkBanStatus, 10000);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkBanStatus();
});

// ==================== НАГРАДЫ ЗА ПОБЕДЫ В САПЁРЕ И МАДЖОНГЕ ====================
function setupVictoryObservers() {
    const minesOverlay = document.getElementById('mines-result-overlay');
    if (minesOverlay) {
        new MutationObserver(() => {
            if (minesOverlay.classList.contains('active')) {
                const titleEl = document.getElementById('mines-res-title');
                const badgeEl = document.getElementById('mines-res-badge');
                if (titleEl && titleEl.innerText.includes('ПОБЕДА')) {
                    const diff = document.getElementById('mines-difficulty')?.value || '8-10';
                    const reward = diff === '12-25' ? 35 : diff === '10-16' ? 20 : 10;
                    addGems(reward);
                    if (badgeEl && !badgeEl.innerText.includes('💎')) {
                        badgeEl.innerText += ` • +${reward} 💎`;
                    }
                }
            }
        }).observe(minesOverlay, { attributes: true, attributeFilter: ['class'] });
    }

    const mjOverlay = document.getElementById('mj-victory-overlay');
    if (mjOverlay) {
        new MutationObserver(() => {
            if (mjOverlay.classList.contains('active')) {
                const auraEl = document.getElementById('victory-aura');
                addGems(15);
                if (auraEl && !auraEl.innerText.includes('💎')) {
                    auraEl.innerText += ' • +15 💎';
                }
            }
        }).observe(mjOverlay, { attributes: true, attributeFilter: ['class'] });
    }
}
setupVictoryObservers();

// ==================== РЕКОРДЫ И ОБЛАЧНАЯ ТАБЛИЦА ЛИДЕРОВ ====================
let hubRecords = loadHubRecords();
let currentLbTab = 'mines';

function loadHubRecords() {
    let data = { mines: null, tetris: 0, zlab: 0 };
    try {
        const raw = localStorage.getItem('gameHubRecords');
        if (raw) data = { ...data, ...JSON.parse(raw) };
    } catch {}
    try {
        const zSave = JSON.parse(localStorage.getItem('zombieLabSave') || 'null');
        if (zSave && zSave.total > data.zlab) data.zlab = Math.floor(zSave.total);
    } catch {}
    return data;
}

function saveHubRecords() {
    try { localStorage.setItem('gameHubRecords', JSON.stringify(hubRecords)); } catch {}
}

function pushScoreToCloud(game, val) {
    if (isUserBanned) return;
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) return;

    fetch(`${baseUrl}/leaderboard/${game}/${myPlayerId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: tgUser.name,
            tag: tgUser.username,
            val: val,
            badge: getEquippedBadgeText(),
            lbStyle: getEquippedLbStyle(),
            updatedAt: Date.now()
        })
    }).catch(() => {});
}

function syncExistingRecords() {
    if (isUserBanned) return;
    initTgProfile();
    if (hubRecords.mines !== null && hubRecords.mines > 0) pushScoreToCloud('mines', hubRecords.mines);
    if (hubRecords.tetris > 0) pushScoreToCloud('tetris', hubRecords.tetris);
    if (hubRecords.zlab > 0) pushScoreToCloud('zlab', hubRecords.zlab);
}
setTimeout(syncExistingRecords, 2000);

function updateRecord(game, val) {
    if (isUserBanned) return false;
    if (game === 'mines') {
        if (val > 0 && (hubRecords.mines === null || val < hubRecords.mines)) {
            hubRecords.mines = val; saveHubRecords(); pushScoreToCloud('mines', val); return true;
        }
    } else if (game === 'tetris') {
        if (val > hubRecords.tetris) {
            hubRecords.tetris = val; saveHubRecords(); pushScoreToCloud('tetris', val); return true;
        }
    } else if (game === 'zlab') {
        if (val > hubRecords.zlab) {
            hubRecords.zlab = Math.floor(val); saveHubRecords(); pushScoreToCloud('zlab', hubRecords.zlab); return true;
        }
    }
    return false;
}

function formatCompact(n) {
    n = Math.floor(Math.max(0, n));
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
}

function openLeaderboard(tab = 'mines') {
    if (isUserBanned) return;
    showScreen('leaderboard-screen');
    switchLbTab(tab, true);
}

async function switchLbTab(tab, silent = false) {
    if (!silent) sfxClick();
    currentLbTab = tab;
    ['mines', 'tetris', 'zlab'].forEach(t => {
        document.getElementById('lbtab-' + t).classList.toggle('active', t === tab);
    });

    const listEl = document.getElementById('lb-list');
    const summaryEl = document.getElementById('lb-my-summary');
    const shareBtn = document.getElementById('lb-share-btn');

    listEl.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px; font-size:0.9rem;">⏳ Загружаем топ игроков...</div>`;

    let list = [];
    let bannedMap = {};
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');

    if (baseUrl.startsWith('http')) {
        try {
            const ts = Date.now();
            const [resScores, resBanned] = await Promise.all([
                fetch(`${baseUrl}/leaderboard/${tab}.json?t=${ts}`, { cache: 'no-store' }),
                fetch(`${baseUrl}/banned.json?t=${ts}`, { cache: 'no-store' })
            ]);
            const rawData = await resScores.json();
            const rawBanned = await resBanned.json();
            if (rawBanned && typeof rawBanned === 'object') bannedMap = rawBanned;

            if (rawData && typeof rawData === 'object') {
                list = Object.entries(rawData)
                    .filter(([id]) => !(bannedMap[id] && bannedMap[id].banned))
                    .map(([id, item]) => ({
                        id,
                        name: item.name || 'Игрок',
                        tag: item.tag || '',
                        val: Number(item.val) || 0,
                        badge: item.badge || '',
                        lbStyle: item.lbStyle || '',
                        isMe: id === myPlayerId
                    }));
            }
        } catch {}
    }

    const myVal = hubRecords[tab];
    const hasScore = !isUserBanned && (tab === 'mines' ? (myVal !== null && myVal > 0) : (myVal > 0));
    if (hasScore && !list.some(x => x.isMe)) {
        list.push({
            id: myPlayerId,
            name: tgUser.name,
            tag: tgUser.username,
            val: myVal,
            badge: getEquippedBadgeText(),
            lbStyle: getEquippedLbStyle(),
            isMe: true
        });
    }

    if (tab === 'mines') list.sort((a, b) => a.val - b.val);
    else list.sort((a, b) => b.val - a.val);

    list = list.slice(0, 20);

    const meEntry = list.find(x => x.isMe);
    if (meEntry) {
        const myRank = list.indexOf(meEntry) + 1;
        const valText = tab === 'mines' ? `${meEntry.val} сек`
                      : tab === 'tetris' ? `${meEntry.val} очков`
                      : `${formatCompact(meEntry.val)} 🧪`;
        summaryEl.innerHTML = `<span>Твоё место: #${myRank}</span><span>Рекорд: ${valText}</span>`;

        const shareText = tab === 'mines' ? `💣 Мой рекорд в Сапёре (Game Hub) — ${meEntry.val} сек (#${myRank} в топе)! Попробуй побить!`
                        : tab === 'tetris' ? `🧱 Мой рекорд в Тетрисе (Game Hub) — ${meEntry.val} очков (#${myRank} в топе)! Сможешь больше?`
                        : `🧪 Я нафармил ${formatCompact(meEntry.val)} мутагена в Зомби-Лабе (#${myRank} в топе)! Залетай!`;
        shareBtn.onclick = () => { sfxClick(); shareGameScore(shareText); };
    } else {
        summaryEl.innerHTML = `<span>Ты ещё не в топе</span><span>Сыграй катку!</span>`;
        shareBtn.onclick = () => { sfxClick(); shareGameScore('🎮 Залетай в Game Hub — тут Сапёр, Тетрис, Маджонг и Зомби-Лаба!'); };
    }

    listEl.innerHTML = '';
    if (list.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px; font-size:0.88rem;">Пока пусто — стань первым в этом режиме!</div>`;
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    list.forEach((item, idx) => {
        const row = document.createElement('div');
        const glowClass = item.lbStyle === 'gold' ? ' lb-glow-gold' : item.lbStyle === 'rainbow' ? ' lb-glow-rainbow' : '';
        row.className = 'lb-row' + (item.isMe ? ' is-me' : '') + glowClass;
        const rankStr = medals[idx] || `#${idx + 1}`;
        const scoreStr = tab === 'mines' ? `⏱ ${item.val}с`
                       : tab === 'tetris' ? `${item.val} pts`
                       : `🧪 ${formatCompact(item.val)}`;
        const badgeHtml = item.badge ? ` <span class="lb-badge-tag">${item.badge}</span>` : '';
        const displayName = (item.isMe ? `${item.name} (Вы)` : item.name) + badgeHtml;
        row.innerHTML = `<div class="lb-left"><div class="lb-rank">${rankStr}</div><div style="min-width:0;"><div class="lb-name">${displayName}</div><div class="lb-tag">${item.tag}</div></div></div><div class="lb-score">${scoreStr}</div>`;
        listEl.appendChild(row);
    });
}

// ==================== АДМИН-ПАНЕЛЬ (БАН, СБРОС И ВЫДАЧА ГЕМОВ ПО КУРСУ) ====================
function isAdminAuthed() {
    try { return localStorage.getItem('gameHubAdminPin') === ADMIN_PIN; } catch { return false; }
}
function getAdminFails() {
    try { return parseInt(localStorage.getItem('gameHubAdminFails') || '0', 10) || 0; } catch { return 0; }
}
function setAdminFails(cnt) {
    try { localStorage.setItem('gameHubAdminFails', String(cnt)); } catch {}
}

function openAdminPanel() {
    if (isUserBanned) {
        triggerLocalBanScreen((getLocalBan() && getLocalBan().reason) || 'Доступ заблокирован');
        return;
    }

    if (!isAdminAuthed()) {
        const entered = prompt('Код доступа:');
        if (entered === null) return;

        if (entered.trim() !== ADMIN_PIN) {
            const fails = getAdminFails() + 1;
            setAdminFails(fails);
            sfxExplosion();
            doVibrate(200);

            if (fails >= 3) {
                banCurrentPlayer('Попытка взлома админ-панели (3 неверных кода)');
                return;
            }
            alert(`Неверный код! Осталось попыток: ${3 - fails}`);
            return;
        }

        setAdminFails(0);
        try { localStorage.setItem('gameHubAdminPin', ADMIN_PIN); } catch {}
    }

    sfxClick();
    showScreen('admin-screen');
    document.getElementById('admin-my-id').innerText = `Твой ID: ${myPlayerId} • Курс: 1₽ = ${GEM_RATE_RUB}💎`;
    renderAdminList();
}

async function renderAdminList() {
    const listEl = document.getElementById('admin-players-list');
    listEl.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px;">⏳ Загружаем базу игроков...</div>`;

    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    try {
        const ts = Date.now();
        const [playersRes, lbRes, banRes] = await Promise.all([
            fetch(`${baseUrl}/players.json?t=${ts}`, { cache: 'no-store' }),
            fetch(`${baseUrl}/leaderboard.json?t=${ts}`, { cache: 'no-store' }),
            fetch(`${baseUrl}/banned.json?t=${ts}`, { cache: 'no-store' })
        ]);
        const playersData = (await playersRes.json()) || {};
        const lbData = (await lbRes.json()) || {};
        const banData = (await banRes.json()) || {};

        const playersMap = {};

        Object.entries(playersData).forEach(([id, info]) => {
            if (info && typeof info === 'object') {
                playersMap[id] = { id, name: info.name || 'Игрок', tag: info.tag || '', gems: info.gems || 0, mines: null, tetris: 0, zlab: 0, banned: false };
            }
        });

        ['mines', 'tetris', 'zlab'].forEach(game => {
            const gObj = lbData[game] || {};
            Object.entries(gObj).forEach(([id, info]) => {
                if (!playersMap[id]) {
                    playersMap[id] = { id, name: info.name || 'Игрок', tag: info.tag || '', gems: 0, mines: null, tetris: 0, zlab: 0, banned: false };
                }
                playersMap[id][game] = info.val;
                if (info.name) playersMap[id].name = info.name;
                if (info.tag) playersMap[id].tag = info.tag;
            });
        });

        Object.entries(banData).forEach(([id, info]) => {
            if (info && info.banned) {
                if (!playersMap[id]) {
                    playersMap[id] = { id, name: info.name || 'Забаненный', tag: info.tag || '', gems: 0, mines: null, tetris: 0, zlab: 0, banned: true };
                } else {
                    playersMap[id].banned = true;
                    if (info.name) playersMap[id].name = info.name;
                    if (info.tag) playersMap[id].tag = info.tag;
                }
            }
        });

        const players = Object.values(playersMap);
        listEl.innerHTML = '';

        if (players.length === 0) {
            listEl.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px;">Игроков в базе пока нет.</div>`;
            return;
        }

        players.forEach(p => {
            const card = document.createElement('div');
            card.className = 'admin-card' + (p.banned ? ' is-banned' : '');
            const safeName = p.name.replace(/'/g, '');
            const safeTag = p.tag.replace(/'/g, '');
            card.innerHTML = `
                <div class="admin-card-top">
                    <div style="min-width:0;">
                        <div class="lb-name">${p.name} ${p.banned ? '⛔' : ''}</div>
                        <div class="lb-tag">${p.tag} • ${p.id}</div>
                    </div>
                    <div style="font-size:0.78rem; color:#f5d0fe; font-weight:900;">💎 ${p.gems || 0}</div>
                </div>
                <div class="admin-scores">
                    <span>💣 ${p.mines ? p.mines + 'с' : '—'}</span>
                    <span>🧱 ${p.tetris || 0}</span>
                    <span>🧪 ${formatCompact(p.zlab || 0)}</span>
                </div>
                <div class="admin-actions" style="grid-template-columns: 1fr 1fr 1fr;">
                    <button class="btn btn-xs" style="border-color:#e879f9; color:#f5d0fe;" onclick="adminGiveGemsPrompt('${p.id}', '${safeName}')">💎 Гемы</button>
                    <button class="btn btn-xs" style="border-color:#fbbf24; color:#fbbf24;" onclick="adminResetPlayer('${p.id}', '${safeName}')">🔄 Сброс</button>
                    <button class="btn btn-xs ${p.banned ? 'btn-green' : 'btn-red'}" onclick="adminToggleBan('${p.id}', '${safeName}', '${safeTag}', ${p.banned})">
                        ${p.banned ? '✅ Разбан' : '🚫 Бан'}
                    </button>
                </div>
            `;
            listEl.appendChild(card);
        });
    } catch {
        listEl.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Ошибка загрузки базы</div>`;
    }
}

async function adminGiveGemsPrompt(playerId, name) {
    const raw = prompt(
        `Сколько выдать игроку ${name}?\n` +
        `• Введи число гемов (напр. 500)\n` +
        `• Или сумму в рублях с буквой р (напр. 75р = ${75 * GEM_RATE_RUB} 💎)\n` +
        `• С минусом для списания (напр. -100)`
    );
    if (raw === null) return;

    const clean = raw.trim().toLowerCase().replace(/\s+/g, '');
    if (!clean) return;

    let amount = 0;
    if (clean.endsWith('р') || clean.endsWith('p') || clean.endsWith('rub')) {
        const rub = parseFloat(clean.replace(/[рprub]/g, ''));
        if (isNaN(rub) || rub === 0) {
            alert('Неверная сумма!');
            return;
        }
        amount = Math.round(rub * GEM_RATE_RUB);
    } else {
        amount = Math.round(Number(clean));
        if (isNaN(amount) || amount === 0) {
            alert('Введи корректное число!');
            return;
        }
    }

    const actionWord = amount > 0 ? `Выдать +${amount} 💎` : `Списать ${amount} 💎`;
    if (!confirm(`${actionWord} игроку ${name}?`)) return;

    sfxClick();
    if (playerId === myPlayerId) {
        addGems(amount, amount > 0 ? 'Админ-выдача' : 'Списание');
        renderAdminList();
        return;
    }

    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    try {
        const res = await fetch(`${baseUrl}/players/${playerId}.json?t=${Date.now()}`, { cache: 'no-store' });
        const info = (await res.json()) || {};
        const nextIssued = (Number(info.issuedGems) || 0) + amount;
        const nextGems = Math.max(0, (Number(info.gems) || 0) + amount);

        await fetch(`${baseUrl}/players/${playerId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...info,
                gems: nextGems,
                issuedGems: nextIssued,
                lastSeen: Date.now()
            })
        });
        sfxVictory();
        renderAdminList();
    } catch {
        alert('Ошибка связи с базой!');
    }
}

async function adminResetPlayer(playerId, name) {
    if (!confirm(`Обнулить все рекорды игрока ${name}?`)) return;
    sfxClick();
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    await Promise.all([
        fetch(`${baseUrl}/leaderboard/mines/${playerId}.json`, { method: 'DELETE' }),
        fetch(`${baseUrl}/leaderboard/tetris/${playerId}.json`, { method: 'DELETE' }),
        fetch(`${baseUrl}/leaderboard/zlab/${playerId}.json`, { method: 'DELETE' })
    ]).catch(() => {});

    if (playerId === myPlayerId) {
        hubRecords = { mines: null, tetris: 0, zlab: 0 };
        saveHubRecords();
    }
    sfxPop();
    renderAdminList();
}

async function adminToggleBan(playerId, name, tag, currentlyBanned) {
    const actionText = currentlyBanned ? `Разбанить игрока ${name}?` : `Забанить ${name} и удалить его очки?`;
    if (!confirm(actionText)) return;
    sfxClick();
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');

    if (currentlyBanned) {
        await Promise.all([
            fetch(`${baseUrl}/banned/${playerId}.json`, { method: 'DELETE' }),
            fetch(`${baseUrl}/players/${playerId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, tag, lastSeen: Date.now() })
            })
        ]).catch(() => {});
        if (playerId === myPlayerId) clearLocalBanScreen();
    } else {
        await Promise.all([
            fetch(`${baseUrl}/banned/${playerId}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banned: true, name, tag, reason: 'Читы / Автокликер', date: Date.now() })
            }),
            fetch(`${baseUrl}/players/${playerId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, tag, lastSeen: Date.now() })
            }),
            fetch(`${baseUrl}/leaderboard/mines/${playerId}.json`, { method: 'DELETE' }),
            fetch(`${baseUrl}/leaderboard/tetris/${playerId}.json`, { method: 'DELETE' }),
            fetch(`${baseUrl}/leaderboard/zlab/${playerId}.json`, { method: 'DELETE' })
        ]).catch(() => {});
    }
    sfxExplosion();
    renderAdminList();
}

// ==================== ЕДИНЫЕ НАСТРОЙКИ ====================
function openSettings(tab = 'style') {
    if (isUserBanned) return;
    showScreen('settings-screen');
    renderTrackList();
    document.getElementById('bgm-vol').value = Math.round(audioPrefs.bgmVol * 100);
    document.getElementById('sfx-vol').value = Math.round(audioPrefs.sfxVol * 100);
    document.getElementById('bgm-vol-val').innerText = Math.round(audioPrefs.bgmVol * 100) + '%';
    document.getElementById('sfx-vol-val').innerText = Math.round(audioPrefs.sfxVol * 100) + '%';
    switchSettingsTab(tab, true);
}

function switchSettingsTab(tab, silent = false) {
    if (!silent) sfxClick();
    ['style', 'music', 'games'].forEach(t => {
        document.getElementById('stab-' + t).classList.toggle('active', t === tab);
        document.getElementById('pane-' + t).classList.toggle('active', t === tab);
    });
}

// ==================== АУДИО ДВИЖОК ====================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null, masterComp = null, delayNode = null;
let bgmTimer = null, bgmStep = 0;

const customAudioEl = new Audio();
customAudioEl.loop = true;
let customAudioUrl = null;
let customAudioName = 'music.mp3 или файл с телефона';

const customFileInput = document.createElement('input');
customFileInput.type = 'file';
customFileInput.accept = 'audio/*';
customFileInput.style.display = 'none';
document.body.appendChild(customFileInput);

customFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    customAudioUrl = URL.createObjectURL(file);
    customAudioName = file.name;
    audioPrefs.track = 'custom';
    saveAudioPrefs();
    startBgm();
    renderTrackList();
});

const MUSIC_TRACKS = [
    { id: 'mc_sweden',   title: '🟩 Minecraft — Sweden',       desc: 'C418 • Мягкое атмосферное пианино' },
    { id: 'mc_wethands', title: '🟦 Minecraft — Wet Hands',    desc: 'C418 • Ностальгическая мелодия' },
    { id: 'roblox_chill',title: '🟥 Roblox — Classic Lobby',   desc: 'Ламповый чилл из старого лобби' },
    { id: 'space',       title: '🌌 Interstellar Vibe',        desc: 'Космическое арпеджио и эхо' },
    { id: 'custom',      title: '🎧 Свой MP3 трек',            desc: customAudioName },
    { id: 'none',        title: '🔇 Без музыки',               desc: 'Только звуковые эффекты' }
];

let audioPrefs = loadAudioPrefs();

function loadAudioPrefs() {
    try {
        const raw = localStorage.getItem('gameHubAudio');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (!MUSIC_TRACKS.some(t => t.id === parsed.track)) parsed.track = 'mc_sweden';
            return parsed;
        }
    } catch {}
    return { track: 'mc_sweden', bgmVol: 0.45, sfxVol: 0.75 };
}
function saveAudioPrefs() {
    try { localStorage.setItem('gameHubAudio', JSON.stringify(audioPrefs)); } catch {}
}

function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new AudioCtx();
        masterComp = audioCtx.createDynamicsCompressor();
        masterComp.threshold.value = -14;
        masterComp.knee.value = 14;
        masterComp.ratio.value = 5;
        masterComp.attack.value = 0.005;
        masterComp.release.value = 0.18;
        masterComp.connect(audioCtx.destination);

        delayNode = audioCtx.createDelay(1.0);
        delayNode.delayTime.value = 0.28;
        const fb = audioCtx.createGain();
        fb.gain.value = 0.36;
        const lp = audioCtx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1900;

        delayNode.connect(lp);
        lp.connect(fb);
        fb.connect(delayNode);
        lp.connect(masterComp);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, dur, type = 'sine', vol = 0.2, slideTo = null) {
    if (!audioCtx || vol <= 0.001) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain); gain.connect(masterComp);
    osc.start(now); osc.stop(now + dur + 0.02);
}

function playNoise(dur, vol = 0.15, filterFreq = 1000, filterType = 'highpass') {
    if (!audioCtx || vol <= 0.001) return;
    const bufferSize = Math.floor(audioCtx.sampleRate * dur);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type = filterType; filter.frequency.value = filterFreq;
    const gain = audioCtx.createGain(), now = audioCtx.currentTime;
    gain.gain.setValueAtTime(vol, now); gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter); filter.connect(gain); gain.connect(masterComp); noise.start(now);
}

function playWarmPiano(freq, dur = 0.8, vol = 0.25, echo = true) {
    if (!audioCtx || vol <= 0.001 || !freq) return;
    const now = audioCtx.currentTime;
    const oscMain = audioCtx.createOscillator(), oscSub = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter(), gain = audioCtx.createGain();

    oscMain.type = 'triangle'; oscMain.frequency.setValueAtTime(freq, now);
    oscSub.type = 'sine'; oscSub.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + dur);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    oscMain.connect(filter); oscSub.connect(filter);
    filter.connect(gain); gain.connect(masterComp);

    if (echo && delayNode) {
        const send = audioCtx.createGain();
        send.gain.value = 0.38;
        gain.connect(send); send.connect(delayNode);
    }
    oscMain.start(now); oscSub.start(now);
    oscMain.stop(now + dur + 0.04); oscSub.stop(now + dur + 0.04);
}

function sfxClick() { ensureAudio(); playTone(520, 0.06, 'triangle', 0.16 * audioPrefs.sfxVol, 780); }
function sfxPop() { ensureAudio(); playTone(360, 0.08, 'sine', 0.18 * audioPrefs.sfxVol, 620); }
function sfxFlag() { ensureAudio(); playTone(680, 0.07, 'square', 0.1 * audioPrefs.sfxVol, 920); }
function sfxMatch(combo = 1) {
    ensureAudio();
    const base = 440 * Math.pow(1.06, Math.min(combo, 12));
    playTone(base, 0.12, 'triangle', 0.22 * audioPrefs.sfxVol);
    setTimeout(() => playTone(base * 1.25, 0.16, 'sine', 0.22 * audioPrefs.sfxVol), 65);
}
function sfxExplosion() {
    ensureAudio();
    playTone(130, 0.45, 'sawtooth', 0.35 * audioPrefs.sfxVol, 28);
    playNoise(0.4, 0.32 * audioPrefs.sfxVol, 180);
}
function sfxLineClear(lines = 1) {
    ensureAudio();
    const notes = lines > 1 ? [523, 659, 784, 1046] : [440, 554, 659];
    notes.forEach((n, idx) => setTimeout(() => playTone(n, 0.15, 'square', 0.14 * audioPrefs.sfxVol), idx * 55));
}
function sfxVictory() {
    ensureAudio();
    [523.25, 659.25, 783.99, 1046.5].forEach((n, idx) =>
        setTimeout(() => playTone(n, idx === 3 ? 0.45 : 0.16, 'triangle', 0.24 * audioPrefs.sfxVol), idx * 95)
    );
}
function sfxShuffle() {
    ensureAudio();
    [300, 420, 560, 480].forEach((n, idx) => setTimeout(() => playTone(n, 0.07, 'sine', 0.14 * audioPrefs.sfxVol), idx * 40));
}
function sfxAlarm() {
    ensureAudio();
    playTone(880, 0.16, 'sawtooth', 0.18 * audioPrefs.sfxVol, 440);
    setTimeout(() => playTone(880, 0.16, 'sawtooth', 0.18 * audioPrefs.sfxVol, 440), 200);
}

function startBgm() {
    stopBgm();
    if (audioPrefs.track === 'none' || audioPrefs.bgmVol <= 0.01) return;

    if (audioPrefs.track === 'custom') {
        customAudioEl.volume = Math.min(1, audioPrefs.bgmVol);
        customAudioEl.src = customAudioUrl || 'music.mp3';
        customAudioEl.play().catch(() => customFileInput.click());
        return;
    }

    ensureAudio();
    bgmStep = 0;
    const bpmMap = { mc_sweden: 76, mc_wethands: 84, roblox_chill: 108, space: 105 };
    const stepMs = (60000 / (bpmMap[audioPrefs.track] || 90)) / 2;

    bgmTimer = setInterval(() => {
        if (!audioCtx || audioCtx.state !== 'running') return;
        const v = audioPrefs.bgmVol;
        const s = bgmStep % 32;

        if (audioPrefs.track === 'mc_sweden') {
            const mel = [369.99,440.00,554.37,659.25,587.33,0,440.00,0, 369.99,440.00,587.33,554.37,440.00,0,369.99,0, 392.00,493.88,587.33,739.99,659.25,0,587.33,0, 329.63,440.00,554.37,659.25,554.37,0,440.00,0];
            const bass = [146.83,0,0,0,220.00,0,0,0, 123.47,0,0,0,185.00,0,0,0, 98.00,0,0,0,146.83,0,0,0, 110.00,0,0,0,164.81,0,0,0];
            if (mel[s]) playWarmPiano(mel[s], 1.15, v * 0.30, true);
            if (bass[s]) playWarmPiano(bass[s], 1.6, v * 0.28, false);
        } else if (audioPrefs.track === 'mc_wethands') {
            const mel = [440.00,554.37,659.25,739.99,659.25,554.37,493.88,554.37, 587.33,739.99,880.00,830.61,739.99,659.25,554.37,493.88, 440.00,554.37,659.25,880.00,830.61,659.25,554.37,493.88, 369.99,440.00,554.37,659.25,554.37,493.88,440.00,0];
            const bass = [110.00,0,164.81,0,110.00,0,164.81,0, 146.83,0,220.00,0,146.83,0,220.00,0, 92.50,0,138.59,0,92.50,0,138.59,0, 164.81,0,246.94,0,164.81,0,246.94,0];
            if (mel[s]) playWarmPiano(mel[s], 0.9, v * 0.28, true);
            if (bass[s]) playWarmPiano(bass[s], 1.1, v * 0.24, false);
        } else if (audioPrefs.track === 'roblox_chill') {
            const chords = [[349.23,440.00,523.25,659.25],[329.63,392.00,493.88,587.33],[293.66,349.23,440.00,523.25],[261.63,329.63,392.00,493.88]];
            const bar = Math.floor(s / 8), stepInBar = s % 8;
            if (stepInBar === 0 || stepInBar === 3 || stepInBar === 6) chords[bar].forEach(note => playWarmPiano(note, 0.55, v * 0.14, true));
            const bassLine = [174.61,0,0,261.63,164.81,0,0,246.94,146.83,0,0,220.00,130.81,0,0,196.00];
            const bNote = bassLine[Math.floor(s / 2)];
            if (s % 2 === 0 && bNote) playTone(bNote, 0.35, 'sine', v * 0.32);
            if (stepInBar % 2 === 0) playNoise(0.03, v * 0.08, 6000, 'highpass');
        } else if (audioPrefs.track === 'space') {
            const s16 = bgmStep % 16;
            const arp = [220.00,329.63,440.00,523.25,659.25,523.25,440.00,329.63, 174.61,261.63,349.23,440.00,523.25,440.00,349.23,261.63];
            playWarmPiano(arp[s16], 0.65, v * 0.28, true);
            if (s16 % 8 === 0) playWarmPiano(s16 === 0 ? 110.00 : 87.31, 1.4, v * 0.32, false);
        }
        bgmStep++;
    }, stepMs);
}

function stopBgm() {
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    customAudioEl.pause();
}

function renderTrackList() {
    const list = document.getElementById('track-list'); list.innerHTML = '';
    MUSIC_TRACKS.forEach(tr => {
        const isAct = audioPrefs.track === tr.id;
        const desc = tr.id === 'custom' ? customAudioName : tr.desc;
        const el = document.createElement('div');
        el.className = 'track-card' + (isAct ? ' active' : '');
        el.innerHTML = `<div class="track-info"><div class="track-title">${tr.title}</div><div class="track-desc">${desc}</div></div><div class="track-status">${isAct ? '🔊' : '▶️'}</div>`;
        el.onclick = () => {
            if (tr.id === 'custom' && isAct) { customFileInput.click(); return; }
            audioPrefs.track = tr.id; saveAudioPrefs(); sfxClick(); startBgm(); renderTrackList();
        };
        list.appendChild(el);
    });
}
function updateAudioSettings() {
    const bv = parseInt(document.getElementById('bgm-vol').value), sv = parseInt(document.getElementById('sfx-vol').value);
    audioPrefs.bgmVol = bv / 100; audioPrefs.sfxVol = sv / 100;
    document.getElementById('bgm-vol-val').innerText = bv + '%';
    document.getElementById('sfx-vol-val').innerText = sv + '%';
    customAudioEl.volume = Math.min(1, audioPrefs.bgmVol);
    saveAudioPrefs();
    if (bv === 0) stopBgm(); else if (!bgmTimer && customAudioEl.paused && audioPrefs.track !== 'none') startBgm();
}

let audioUnlocked = false;
window.addEventListener('pointerdown', (e) => {
    spawnBurst(e.clientX, e.clientY, 10);
    if (!audioUnlocked) {
        audioUnlocked = true; ensureAudio();
        if (audioPrefs.track !== 'none') startBgm();
    }
});

// ==================== АНИМАЦИИ И ЖИВОЙ ФОН ====================
const bgCanvas = document.getElementById('bg-canvas'), bgCtx = bgCanvas.getContext('2d');
const fxCanvas = document.getElementById('fx-canvas'), fxCtx = fxCanvas.getContext('2d');
let particles = [], floatTexts = [], bgOrbs = [], bgStars = [], gridOffset = 0, victoryFxTimer = null;
let currentStyleMode = 'neon';

function isMinimalMode() { return currentStyleMode === 'minimal'; }

function resizeCanvases() {
    bgCanvas.width = fxCanvas.width = window.innerWidth;
    bgCanvas.height = fxCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvases);
resizeCanvases();

for (let i = 0; i < 18; i++) bgOrbs.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, r: 18 + Math.random() * 45, vx: (Math.random() - 0.5) * 1.4, vy: (Math.random() - 0.5) * 1.4, hue: Math.random() * 360 });
for (let i = 0; i < 70; i++) bgStars.push({ x: (Math.random() - 0.5) * window.innerWidth, y: (Math.random() - 0.5) * window.innerHeight, z: Math.random() * 800 + 100 });

function getAdhdMode() {
    if (isMinimalMode()) return 'off';
    return document.getElementById('adhd-level').value;
}
function spawnBurst(x, y, count = 16, colors = null, power = 1) {
    if (getAdhdMode() === 'off') return;
    const palette = colors || ['#38bdf8', '#f472b6', '#fbbf24', '#4ade80', '#a855f7', '#ffffff'];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2, speed = (2 + Math.random() * 6.5) * power;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5 * power, size: (3 + Math.random() * 5.5) * Math.min(power, 1.4), color: palette[Math.floor(Math.random() * palette.length)], alpha: 1, decay: 0.016 + Math.random() * 0.02, shape: Math.random() > 0.35 ? 'square' : 'circle', rot: Math.random() * Math.PI });
    }
}
function spawnConfettiCannon(fromLeft) {
    if (getAdhdMode() === 'off') return;
    const x = fromLeft ? 10 : window.innerWidth - 10, y = window.innerHeight - 20;
    const palette = ['#fbbf24', '#4ade80', '#38bdf8', '#f472b6', '#a855f7', '#ffffff', '#fb7185'];
    for (let i = 0; i < 34; i++) {
        const spread = fromLeft ? (-Math.PI / 2.2) + (Math.random() - 0.3) * 0.75 : (-Math.PI / 1.8) - (Math.random() - 0.3) * 0.75;
        const speed = 9 + Math.random() * 9;
        particles.push({ x, y, vx: Math.cos(spread) * speed, vy: Math.sin(spread) * speed, size: 5 + Math.random() * 7, color: palette[Math.floor(Math.random() * palette.length)], alpha: 1, decay: 0.011 + Math.random() * 0.012, shape: 'square', rot: Math.random() * Math.PI });
    }
}
function spawnFloatText(x, y, text, color = '#fbbf24') {
    if (getAdhdMode() === 'off') return;
    floatTexts.push({ x, y, text, color, alpha: 1, vy: -2.1 });
}
function triggerShake(big = false) {
    if (getAdhdMode() !== 'max') return;
    const cls = big ? 'shake-lg' : 'shake-sm';
    document.body.classList.remove('shake-sm', 'shake-lg');
    void document.body.offsetWidth;
    document.body.classList.add(cls);
}

function renderLoop() {
    if (!isMinimalMode()) {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        const bgEffect = document.getElementById('bg-effect-select').value;
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

        if (bgEffect === 'orbs') {
            bgOrbs.forEach(o => {
                o.x += o.vx; o.y += o.vy; o.hue = (o.hue + 0.4) % 360;
                if (o.x < -60) o.x = bgCanvas.width + 60; if (o.x > bgCanvas.width + 60) o.x = -60;
                if (o.y < -60) o.y = bgCanvas.height + 60; if (o.y > bgCanvas.height + 60) o.y = -60;
                const grad = bgCtx.createRadialGradient(o.x, o.y, 2, o.x, o.y, o.r);
                grad.addColorStop(0, `hsla(${o.hue}, 90%, 65%, 0.28)`); grad.addColorStop(1, 'transparent');
                bgCtx.fillStyle = grad; bgCtx.beginPath(); bgCtx.arc(o.x, o.y, o.r, 0, Math.PI * 2); bgCtx.fill();
            });
        } else if (bgEffect === 'stars') {
            const cx = bgCanvas.width / 2, cy = bgCanvas.height / 2;
            bgCtx.fillStyle = accent || '#38bdf8';
            bgStars.forEach(s => {
                s.z -= 4;
                if (s.z <= 10) { s.x = (Math.random() - 0.5) * bgCanvas.width; s.y = (Math.random() - 0.5) * bgCanvas.height; s.z = 800; }
                const k = 250 / s.z, px = cx + s.x * k, py = cy + s.y * k, sz = Math.max(1, (1 - s.z / 800) * 4);
                bgCtx.globalAlpha = 1 - s.z / 800; bgCtx.fillRect(px, py, sz, sz);
            });
            bgCtx.globalAlpha = 1;
        } else if (bgEffect === 'grid') {
            gridOffset = (gridOffset + 0.8) % 40;
            bgCtx.strokeStyle = accent || '#38bdf8'; bgCtx.globalAlpha = 0.14; bgCtx.lineWidth = 1;
            for (let x = 0; x < bgCanvas.width; x += 40) { bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, bgCanvas.height); bgCtx.stroke(); }
            for (let y = gridOffset; y < bgCanvas.height; y += 40) { bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(bgCanvas.width, y); bgCtx.stroke(); }
            bgCtx.globalAlpha = 1;
        }

        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= p.decay; p.rot += 0.14;
            if (p.alpha <= 0) { particles.splice(i, 1); continue; }
            fxCtx.save(); fxCtx.globalAlpha = p.alpha; fxCtx.fillStyle = p.color;
            fxCtx.translate(p.x, p.y); fxCtx.rotate(p.rot);
            if (p.shape === 'circle') { fxCtx.beginPath(); fxCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2); fxCtx.fill(); }
            else { fxCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7); }
            fxCtx.restore();
        }
        for (let i = floatTexts.length - 1; i >= 0; i--) {
            const ft = floatTexts[i];
            ft.y += ft.vy; ft.alpha -= 0.02;
            if (ft.alpha <= 0) { floatTexts.splice(i, 1); continue; }
            fxCtx.save(); fxCtx.globalAlpha = ft.alpha; fxCtx.font = '900 22px Segoe UI, sans-serif';
            fxCtx.textAlign = 'center'; fxCtx.fillStyle = ft.color; fxCtx.shadowColor = ft.color; fxCtx.shadowBlur = 12;
            fxCtx.fillText(ft.text, ft.x, ft.y); fxCtx.restore();
        }
    }
    requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

// ==================== СТИЛЬ И КАСТОМИЗАЦИЯ ====================
function setStyleMode(mode, silent = false) {
    currentStyleMode = mode === 'minimal' ? 'minimal' : 'neon';
    document.body.classList.toggle('minimal-mode', currentStyleMode === 'minimal');
    document.getElementById('style-neon').classList.toggle('active', currentStyleMode === 'neon');
    document.getElementById('style-minimal').classList.toggle('active', currentStyleMode === 'minimal');
    document.getElementById('neon-only-settings').style.display = currentStyleMode === 'minimal' ? 'none' : 'block';
    if (currentStyleMode === 'minimal') {
        particles = []; floatTexts = [];
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    }
    if (!silent) { sfxClick(); saveLobbyPrefs(); }
}

function applyPreset(bg, accent) {
    document.getElementById('bg-picker').value = bg;
    document.getElementById('accent-picker').value = accent;
    updateLobbyColors(); sfxPop();
    spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 28, [accent, '#ffffff', '#fbbf24']);
    doVibrate(30);
}
function updateLobbyColors() {
    const bg = document.getElementById('bg-picker').value, accent = document.getElementById('accent-picker').value;
    document.documentElement.style.setProperty('--bg', bg);
    document.documentElement.style.setProperty('--accent', accent);
    saveLobbyPrefs();
}
function saveLobbyPrefs() {
    try {
        localStorage.setItem('gameHubLobby', JSON.stringify({
            styleMode: currentStyleMode,
            bg: document.getElementById('bg-picker').value,
            accent: document.getElementById('accent-picker').value,
            bgEffect: document.getElementById('bg-effect-select').value,
            adhd: document.getElementById('adhd-level').value
        }));
    } catch {}
}
function loadLobbyPrefs() {
    try {
        const saved = JSON.parse(localStorage.getItem('gameHubLobby') || 'null');
        if (!saved) return;
        document.getElementById('bg-picker').value = saved.bg || '#0f172a';
        document.getElementById('accent-picker').value = saved.accent || '#38bdf8';
        document.getElementById('bg-effect-select').value = saved.bgEffect || 'orbs';
        document.getElementById('adhd-level').value = saved.adhd || 'max';
        document.documentElement.style.setProperty('--bg', saved.bg || '#0f172a');
        document.documentElement.style.setProperty('--accent', saved.accent || '#38bdf8');
        setStyleMode(saved.styleMode || 'neon', true);
    } catch {}
}
loadLobbyPrefs();

// ==================== НАВИГАЦИЯ ====================
function stopAllGames() {
    if (victoryFxTimer) { clearInterval(victoryFxTimer); victoryFxTimer = null; }
    document.getElementById('mj-victory-overlay').classList.remove('active');
    document.getElementById('mines-result-overlay').classList.remove('active');
    document.getElementById('tetris-result-overlay').classList.remove('active');
    if (typeof stopMines === 'function') stopMines();
    if (typeof stopTetris === 'function') stopTetris();
    if (typeof stopZombieLab === 'function') stopZombieLab();
}
function showScreen(id) {
    if (isUserBanned) return;
    stopAllGames();
    document.getElementById('main-menu').style.display = 'none';
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
}
function backToMenu() {
    if (isUserBanned) return;
    stopAllGames();
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById('main-menu').style.display = 'flex';
    updateGemsUI();
}
function doVibrate(ms) {
    if (document.getElementById('vibrate-on').checked && navigator.vibrate) navigator.vibrate(ms);
}
window.oncontextmenu = (e) => { e.preventDefault(); return false; };
// === КОНЕЦ ФАЙЛА CORE.JS ===
