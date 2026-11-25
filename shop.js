// ==================== ЭКОНОМИКА, ЕЖЕДНЕВНЫЙ БОНУС И МАГАЗИН ====================
const SHOP_CATALOG = [
    // Сапёр: темы поля и метки флагов
    { id: 'mskin_default', cat: 'mines', icon: '💣', name: 'Классический кибер',     desc: 'Стандартные тёмные клетки поля', price: 0, type: 'mines_theme' },
    { id: 'mskin_matrix',  cat: 'mines', icon: '🟩', name: 'Хакерский терминал',     desc: 'Изумрудные клетки в стиле Матрицы', price: 500, type: 'mines_theme' },
    { id: 'mskin_gold',    cat: 'mines', icon: '🟨', name: 'Золотой бункер',         desc: 'Роскошные золотые плитки с бликом', price: 900, type: 'mines_theme' },
    { id: 'mskin_magma',   cat: 'mines', icon: '🌋', name: 'Вулканический обсидиан', desc: 'Тёмный камень с огненной обводкой', price: 1400, type: 'mines_theme' },
    { id: 'mflag_default', cat: 'mines', icon: '🚩', name: 'Красный флаг',           desc: 'Классический флажок 🚩 для мин', price: 0, type: 'mines_flag', flagIcon: '🚩' },
    { id: 'mflag_skull',   cat: 'mines', icon: '☠️', name: 'Метка Череп',            desc: 'Ставит ☠️ вместо обычного флага', price: 400, type: 'mines_flag', flagIcon: '☠️' },
    { id: 'mflag_radio',   cat: 'mines', icon: '☢️', name: 'Знак Радиации',          desc: 'Метка биоугрозы ☢️ на опасных клетках', price: 750, type: 'mines_flag', flagIcon: '☢️' },
    { id: 'mflag_crown',   cat: 'mines', icon: '👑', name: 'Королевская метка',      desc: 'Отмечает мины золотой короной 👑', price: 1200, type: 'mines_flag', flagIcon: '👑' },

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
let currentShopTab = 'mines';
let isManualGemSyncing = false;

function getDefaultEcoState() {
    return {
        gems: 0,
        claimedIssuedGems: 0,
        owned: ['mskin_default', 'mflag_default', 'tskin_default', 'mj_default', 'badge_none', 'glow_default'],
        equipped: {
            mines_theme: 'mskin_default',
            mines_flag: 'mflag_default',
            tetris_skin: 'tskin_default',
            mj_theme: 'mj_default',
            badge: 'badge_none',
            lb_glow: 'glow_default'
        },
        dailyLastDay: '',
        dailyStreak: 0,
        zBoostUntil: 0
    };
}

function loadEcoState() {
    migrateLegacyKey('gameHubEconomy');
    const def = getDefaultEcoState();
    try {
        const raw = localStorage.getItem(userKey('gameHubEconomy'));
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

function applyRemoteEcoState(remoteEco) {
    const def = getDefaultEcoState();
    ecoState = {
        ...def,
        ...remoteEco,
        owned: Array.isArray(remoteEco.owned) ? Array.from(new Set([...def.owned, ...remoteEco.owned])) : def.owned,
        equipped: { ...def.equipped, ...(remoteEco.equipped || {}) }
    };
    try { localStorage.setItem(userKey('gameHubEconomy'), JSON.stringify(ecoState)); } catch {}
    initTgProfile();
    updateGemsUI();
    applyMahjongTheme();
    applyMinesTheme();
}

function saveEcoState() {
    try { localStorage.setItem(userKey('gameHubEconomy'), JSON.stringify(ecoState)); } catch {}
    updateGemsUI();
    applyMahjongTheme();
    applyMinesTheme();
    scheduleCloudSave();
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

function getMinesFlagIcon() {
    const id = ecoState.equipped.mines_flag || 'mflag_default';
    const item = SHOP_CATALOG.find(x => x.id === id);
    return item ? (item.flagIcon || '🚩') : '🚩';
}

function applyMinesTheme() {
    const theme = ecoState.equipped.mines_theme || 'mskin_default';
    document.body.classList.remove('mines-theme-matrix', 'mines-theme-gold', 'mines-theme-magma');
    if (theme === 'mskin_matrix') document.body.classList.add('mines-theme-matrix');
    else if (theme === 'mskin_gold') document.body.classList.add('mines-theme-gold');
    else if (theme === 'mskin_magma') document.body.classList.add('mines-theme-magma');

    const flagHeader = document.getElementById('m-flag-icon');
    if (flagHeader) flagHeader.innerText = getMinesFlagIcon();
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

function openShop(tab = 'mines') {
    if (isUserBanned) return;
    if (typeof activeDuel !== 'undefined' && activeDuel) {
        if (!abortActiveDuel()) return;
    }
    if (tab === 'topup' && !TOPUP_ENABLED) tab = 'mines';
    showScreen('shop-screen');
    updateGemsUI();
    const topupTab = document.getElementById('shoptab-topup');
    if (topupTab) {
        topupTab.innerText = TOPUP_ENABLED ? '💎 Курс' : '🔒 Курс';
        topupTab.style.opacity = TOPUP_ENABLED ? '1' : '0.45';
    }
    switchShopTab(tab, true);
}

function switchShopTab(tab, silent = false) {
    if (tab === 'topup' && !TOPUP_ENABLED) {
        if (!silent) {
            sfxClick();
            doVibrate(30);
            spawnFloatText(window.innerWidth / 2, 130, '🔒 Пополнение скоро откроется!', '#94a3b8');
        }
        return;
    }
    if (!silent) sfxClick();
    currentShopTab = tab;
    ['mines', 'tetris', 'mahjong', 'profile', 'boosts', 'topup'].forEach(t => {
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

    if (currentShopTab === 'topup' && TOPUP_ENABLED) {
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
        const isEquippable = ['mines_theme', 'mines_flag', 'tetris_skin', 'mj_theme', 'badge', 'lb_glow'].includes(item.type);
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
    const isEquippable = ['mines_theme', 'mines_flag', 'tetris_skin', 'mj_theme', 'badge', 'lb_glow'].includes(item.type);

    if (isOwned && item.type !== 'consumable') {
        if (isEquippable) {
            ecoState.equipped[item.type] = item.id;
            saveEcoState();
            sfxPop();
            doVibrate(20);
            renderShopItems();
            if ((item.type === 'badge' || item.type === 'lb_glow') && typeof syncExistingRecords === 'function') {
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
    if ((item.type === 'badge' || item.type === 'lb_glow') && typeof syncExistingRecords === 'function') {
        syncExistingRecords();
    }

    sfxVictory();
    doVibrate([40, 30, 80]);
    spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 30, ['#e879f9', '#fbbf24', '#4ade80']);
    renderShopItems();
}

async function manualSyncGems() {
    if (isUserBanned || isManualGemSyncing) return;
    isManualGemSyncing = true;
    sfxClick();
    doVibrate(20);
    spawnFloatText(window.innerWidth / 2, 105, '⏳ Проверяем баланс...', '#38bdf8');
    await syncGemsToCloud(true);
    isManualGemSyncing = false;
}

async function syncGemsToCloud(isManual = false) {
    if (!cloudSyncReady && !isManual) return;
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) return;
    try {
        const res = await fetch(`${baseUrl}/players/${myPlayerId}.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const existing = (await res.json()) || {};
        const cloudIssued = Number(existing.issuedGems) || 0;

        if (cloudIssued !== (ecoState.claimedIssuedGems || 0)) {
            const diff = cloudIssued - (ecoState.claimedIssuedGems || 0);
            ecoState.gems = Math.max(0, getGems() + diff);
            ecoState.claimedIssuedGems = cloudIssued;
            saveEcoState();
            if (diff > 0) {
                sfxVictory();
                doVibrate([40, 30, 80]);
                spawnFloatText(window.innerWidth / 2, 120, `💎 Зачислено +${diff} 💎!`, '#4ade80');
            } else if (isManual) {
                spawnFloatText(window.innerWidth / 2, 120, '✅ Баланс обновлён', '#4ade80');
            }
        } else if (isManual) {
            sfxPop();
            spawnFloatText(window.innerWidth / 2, 120, '✅ Баланс обновлён', '#4ade80');
        }

        cloudSyncReady = true;

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
    } catch {
        if (isManual) {
            sfxAlarm();
            doVibrate(140);
            spawnFloatText(window.innerWidth / 2, 120, '⚠️ Нет связи с базой (включи VPN)', '#ef4444');
        }
    }
}

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

applyMahjongTheme();
applyMinesTheme();
initTgProfile();
setupVictoryObservers();
