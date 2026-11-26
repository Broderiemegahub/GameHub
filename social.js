// ==================== СИСТЕМА БАНА, РЕКОРДЫ И АДМИН-ПАНЕЛЬ ====================
function getLocalBan() {
    migrateLegacyKey('gameHubBanned');
    try {
        const raw = localStorage.getItem(userKey('gameHubBanned'));
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function setLocalBan(data) {
    try {
        if (data) localStorage.setItem(userKey('gameHubBanned'), JSON.stringify(data));
        else localStorage.removeItem(userKey('gameHubBanned'));
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
            fetch(`${baseUrl}/leaderboard/zlab/${myPlayerId}.json`, { method: 'DELETE' }),
            fetch(`${baseUrl}/leaderboard/aim/${myPlayerId}.json`, { method: 'DELETE' })
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
            if (typeof pullCloudSave === 'function') await pullCloudSave();
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

// ==================== РЕКОРДЫ И ОБЛАЧНАЯ ТАБЛИЦА ЛИДЕРОВ ====================
let hubRecords = loadHubRecords();
let currentLbTab = 'mines';

function loadHubRecords() {
    migrateLegacyKey('gameHubRecords');
    let data = { mines: null, tetris: 0, zlab: 0, aim: 0 };
    try {
        const raw = localStorage.getItem(userKey('gameHubRecords'));
        if (raw) data = { ...data, ...JSON.parse(raw) };
    } catch {}
    try {
        const zSave = JSON.parse(localStorage.getItem(userKey('zombieLabSave')) || 'null');
        if (zSave && zSave.total > data.zlab) data.zlab = Math.floor(zSave.total);
    } catch {}
    return data;
}

function applyRemoteRecords(remoteRecs) {
    hubRecords = {
        mines: remoteRecs.mines ?? null,
        tetris: Number(remoteRecs.tetris) || 0,
        zlab: Number(remoteRecs.zlab) || 0,
        aim: Number(remoteRecs.aim) || 0
    };
    try { localStorage.setItem(userKey('gameHubRecords'), JSON.stringify(hubRecords)); } catch {}
}

function saveHubRecords() {
    try { localStorage.setItem(userKey('gameHubRecords'), JSON.stringify(hubRecords)); } catch {}
    scheduleCloudSave();
}

function pushScoreToCloud(game, val) {
    if (isUserBanned) return;
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) return;

    const vip = typeof isVipUser === 'function' && isVipUser();

    fetch(`${baseUrl}/leaderboard/${game}/${myPlayerId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: tgUser.name,
            tag: tgUser.username,
            val: val,
            isVip: vip,
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
    if (hubRecords.aim > 0) pushScoreToCloud('aim', hubRecords.aim);
}
setTimeout(syncExistingRecords, 2500);

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
    } else if (game === 'aim') {
        if (val > (hubRecords.aim || 0)) {
            hubRecords.aim = Math.floor(val); saveHubRecords(); pushScoreToCloud('aim', hubRecords.aim); return true;
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
    ['mines', 'tetris', 'zlab', 'aim'].forEach(t => {
        const el = document.getElementById('lbtab-' + t);
        if (el) el.classList.toggle('active', t === tab);
    });

    const listEl = document.getElementById('lb-list');
    const summaryEl = document.getElementById('lb-my-summary');
    const shareBtn = document.getElementById('lb-share-btn');

    listEl.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px; font-size:0.9rem;">⏳ Загружаем топ игроков...</div>`;

    let list = [];
    let bannedMap = {};
    let playersMap = {};
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');

    if (baseUrl.startsWith('http')) {
        try {
            const ts = Date.now();
            const [resScores, resBanned, resPlayers] = await Promise.all([
                fetch(`${baseUrl}/leaderboard/${tab}.json?t=${ts}`, { cache: 'no-store' }),
                fetch(`${baseUrl}/banned.json?t=${ts}`, { cache: 'no-store' }),
                fetch(`${baseUrl}/players.json?t=${ts}`, { cache: 'no-store' })
            ]);
            const rawData = await resScores.json();
            const rawBanned = await resBanned.json();
            const rawPlayers = await resPlayers.json();
            if (rawBanned && typeof rawBanned === 'object') bannedMap = rawBanned;
            if (rawPlayers && typeof rawPlayers === 'object') playersMap = rawPlayers;

            if (rawData && typeof rawData === 'object') {
                list = Object.entries(rawData)
                    .filter(([id]) => !(bannedMap[id] && bannedMap[id].banned))
                    .map(([id, item]) => {
                        const pInfo = playersMap[id] || {};
                        const pVipUntil = Number(pInfo.vipUntil) || 0;
                        const activeVip = Boolean(item.isVip || pVipUntil === -1 || pVipUntil > Date.now() || (id === myPlayerId && typeof isVipUser === 'function' && isVipUser()));
                        return {
                            id,
                            name: item.name || 'Игрок',
                            tag: item.tag || '',
                            val: Number(item.val) || 0,
                            isVip: activeVip,
                            badge: item.badge || '',
                            lbStyle: item.lbStyle || '',
                            isMe: id === myPlayerId
                        };
                    });
            }
        } catch {}
    }

    const myVal = hubRecords[tab] || 0;
    const hasScore = !isUserBanned && (tab === 'mines' ? (hubRecords.mines !== null && hubRecords.mines > 0) : (myVal > 0));
    if (hasScore && !list.some(x => x.isMe)) {
        list.push({
            id: myPlayerId,
            name: tgUser.name,
            tag: tgUser.username,
            val: myVal,
            isVip: typeof isVipUser === 'function' && isVipUser(),
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
                      : tab === 'aim' ? `${meEntry.val} pts`
                      : `${formatCompact(meEntry.val)} 🧪`;
        summaryEl.innerHTML = `<span>Твоё место: #${myRank}</span><span>Рекорд: ${valText}</span>`;

        const shareText = tab === 'mines' ? `💣 Мой рекорд в Сапёре (Game Hub) — ${meEntry.val} сек (#${myRank} в топе)! Попробуй побить!`
                        : tab === 'tetris' ? `🧱 Мой рекорд в Тетрисе (Game Hub) — ${meEntry.val} очков (#${myRank} в топе)! Сможешь больше?`
                        : tab === 'aim' ? `🎯 Мой рекорд в Cyber Aim (Game Hub) — ${meEntry.val} очков (#${myRank} в топе)! Попробуй перестрелять!`
                        : `🧪 Я нафармил ${formatCompact(meEntry.val)} мутагена в Зомби-Лабе (#${myRank} в топе)! Залетай!`;
        shareBtn.onclick = () => { sfxClick(); shareGameScore(shareText); };
    } else {
        summaryEl.innerHTML = `<span>Ты ещё не в топе</span><span>Сыграй катку!</span>`;
        shareBtn.onclick = () => { sfxClick(); shareGameScore('🎮 Залетай в Game Hub — тут Сапёр, Тетрис, Маджонг, Зомби-Лаба и Cyber Aim!'); };
    }

    listEl.innerHTML = '';
    if (list.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px; font-size:0.88rem;">Пока пусто — стань первым в этом режиме!</div>`;
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    list.forEach((item, idx) => {
        const row = document.createElement('div');
        const effectiveStyle = item.lbStyle || (item.isVip ? 'gold' : '');
        const glowClass = effectiveStyle === 'gold' ? ' lb-glow-gold' : effectiveStyle === 'rainbow' ? ' lb-glow-rainbow' : '';
        row.className = 'lb-row' + (item.isMe ? ' is-me' : '') + glowClass;
        const rankStr = medals[idx] || `#${idx + 1}`;
        const scoreStr = tab === 'mines' ? `⏱ ${item.val}с`
                       : tab === 'tetris' ? `${item.val} pts`
                       : tab === 'aim' ? `🎯 ${item.val}`
                       : `🧪 ${formatCompact(item.val)}`;
        const vipBadgeHtml = item.isVip ? ` <span class="lb-badge-tag" style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0f172a;font-weight:900;">👑 VIP</span>` : '';
        const badgeHtml = item.badge ? ` <span class="lb-badge-tag">${item.badge}</span>` : '';
        const displayName = (item.isMe ? `${item.name} (Вы)` : item.name) + vipBadgeHtml + badgeHtml;
        row.innerHTML = `<div class="lb-left"><div class="lb-rank">${rankStr}</div><div style="min-width:0;"><div class="lb-name">${displayName}</div><div class="lb-tag">${item.tag}</div></div></div><div class="lb-score">${scoreStr}</div>`;
        listEl.appendChild(row);
    });
}

// ==================== АДМИН-ПАНЕЛЬ ====================
function isAdminAuthed() {
    migrateLegacyKey('gameHubAdminPin');
    try { return localStorage.getItem(userKey('gameHubAdminPin')) === ADMIN_PIN; } catch { return false; }
}
function getAdminFails() {
    try { return parseInt(localStorage.getItem(userKey('gameHubAdminFails')) || '0', 10) || 0; } catch { return 0; }
}
function setAdminFails(cnt) {
    try { localStorage.setItem(userKey('gameHubAdminFails'), String(cnt)); } catch {}
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
        try { localStorage.setItem(userKey('gameHubAdminPin'), ADMIN_PIN); } catch {}
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
                playersMap[id] = { id, name: info.name || 'Игрок', tag: info.tag || '', gems: info.gems || 0, vipUntil: Number(info.vipUntil) || 0, mines: null, tetris: 0, zlab: 0, aim: 0, banned: false };
            }
        });

        ['mines', 'tetris', 'zlab', 'aim'].forEach(game => {
            const gObj = lbData[game] || {};
            Object.entries(gObj).forEach(([id, info]) => {
                if (!playersMap[id]) {
                    playersMap[id] = { id, name: info.name || 'Игрок', tag: info.tag || '', gems: 0, vipUntil: 0, mines: null, tetris: 0, zlab: 0, aim: 0, banned: false };
                }
                playersMap[id][game] = info.val;
                if (info.name) playersMap[id].name = info.name;
                if (info.tag) playersMap[id].tag = info.tag;
            });
        });

        Object.entries(banData).forEach(([id, info]) => {
            if (info && info.banned) {
                if (!playersMap[id]) {
                    playersMap[id] = { id, name: info.name || 'Забаненный', tag: info.tag || '', gems: 0, vipUntil: 0, mines: null, tetris: 0, zlab: 0, aim: 0, banned: true };
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
            const hasVip = p.vipUntil === -1 || p.vipUntil > Date.now();
            const vipLabel = p.vipUntil === -1 ? '👑 VIP ∞' : (hasVip ? '👑 VIP' : '');

            card.innerHTML = `
                <div class="admin-card-top">
                    <div style="min-width:0;">
                        <div class="lb-name">${p.name} ${vipLabel ? `<span style="color:#fbbf24;">${vipLabel}</span>` : ''} ${p.banned ? '⛔' : ''}</div>
                        <div class="lb-tag">${p.tag} • ${p.id}</div>
                    </div>
                    <div style="font-size:0.78rem; color:#f5d0fe; font-weight:900;">💎 ${p.gems || 0}</div>
                </div>
                <div class="admin-scores">
                    <span>💣 ${p.mines ? p.mines + 'с' : '—'}</span>
                    <span>🧱 ${p.tetris || 0}</span>
                    <span>🧪 ${formatCompact(p.zlab || 0)}</span>
                    <span>🎯 ${p.aim || 0}</span>
                </div>
                <div class="admin-actions" style="grid-template-columns: 1fr 1fr; gap: 6px;">
                    <button class="btn btn-xs" style="border-color:#e879f9; color:#f5d0fe;" onclick="adminGiveGemsPrompt('${p.id}', '${safeName}')">💎 Гемы</button>
                    <button class="btn btn-xs" style="border-color:#fbbf24; color:#fbbf24;" onclick="adminManageVip('${p.id}', '${safeName}', ${p.vipUntil})">${hasVip ? '👑 Снять / Продлить VIP' : '👑 Выдать VIP'}</button>
                    <button class="btn btn-xs" style="border-color:#94a3b8; color:#cbd5e1;" onclick="adminResetPlayer('${p.id}', '${safeName}')">🔄 Сброс</button>
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

async function sendTelegramDirect(playerId, htmlText) {
    if (!playerId.startsWith('tg_')) return;

    let token = '';
    try { token = localStorage.getItem('gameHubBotToken') || ''; } catch {}
    if (!token) {
        const entered = prompt(
            'Вставь токен бота от @BotFather для отправки уведомлений\n' +
            '(он сохранится только на твоём телефоне):'
        );
        if (!entered) return;
        token = entered.trim();
        try { localStorage.setItem('gameHubBotToken', token); } catch {}
    }

    const chatId = playerId.slice(3);
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: htmlText,
                parse_mode: 'HTML'
            })
        });
        const data = await res.json();
        if (!data.ok && data.error_code === 401) {
            try { localStorage.removeItem('gameHubBotToken'); } catch {}
            alert('Неверный токен бота! При следующем действии введи правильный.');
        }
    } catch {}
}

async function sendGemNotification(playerId, amount, newBalance) {
    const text = amount > 0
        ? `💎 <b>Пополнение баланса!</b>\n\nЗачислено: <b>+${amount} 💎</b>\nТекущий баланс: <b>${newBalance} 💎</b>`
        : `💎 <b>Изменение баланса</b>\n\nСписано: <b>${amount} 💎</b>\nТекущий баланс: <b>${newBalance} 💎</b>`;
    await sendTelegramDirect(playerId, text);
}

async function adminManageVip(playerId, name, currentVipUntil) {
    const hasVip = currentVipUntil === -1 || currentVipUntil > Date.now();
    const currentLabel = currentVipUntil === -1 ? 'НАВСЕГДА' : (hasVip ? 'активен' : 'нет');
    const raw = prompt(
        `Управление VIP для ${name} (сейчас: ${currentLabel}):\n` +
        `• 7 — VIP на 7 дней\n` +
        `• 30 — VIP на 30 дней\n` +
        `• 0 — VIP НАВСЕГДА\n` +
        (hasVip ? `• -1 — Снять VIP` : '')
    );
    if (raw === null) return;
    const choice = Number(raw.trim());
    if (isNaN(choice)) {
        alert('Введи корректное число!');
        return;
    }

    let nextVipUntil = 0;
    let notifyMsg = '';
    if (choice === -1) {
        nextVipUntil = 0;
        notifyMsg = `👑 <b>VIP-статус отключён</b>\n\nДействие VIP-привилегий для твоего аккаунта завершено.`;
    } else if (choice === 0) {
        nextVipUntil = -1;
        notifyMsg = `👑 <b>VIP-статус активирован НАВСЕГДА!</b>\n\nТеперь тебе доступны ×${VIP_GEM_MULT} гемов за игры, двойной ежедневный бонус, все темы, музыка и корона в топе!`;
    } else if (choice > 0) {
        if (currentVipUntil === -1) {
            alert('У игрока уже активирован вечный VIP! Сначала введи -1, если хочешь его снять.');
            return;
        }
        const days = Math.round(choice);
        const base = Math.max(Date.now(), currentVipUntil > 0 ? currentVipUntil : 0);
        nextVipUntil = base + days * 86400000;
        notifyMsg = `👑 <b>VIP-статус активирован на ${days} дн.!</b>\n\nТеперь тебе доступны ×${VIP_GEM_MULT} гемов за игры, двойной ежедневный бонус, все темы, музыка и корона в топе!`;
    } else {
        return;
    }

    sfxClick();
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    try {
        await fetch(`${baseUrl}/players/${playerId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vipUntil: nextVipUntil,
                isVip: nextVipUntil === -1 || nextVipUntil > Date.now(),
                lastSeen: Date.now()
            })
        });

        if (playerId === myPlayerId && typeof setVipUntil === 'function') {
            setVipUntil(nextVipUntil);
            syncExistingRecords();
        }

        sfxVictory();
        await sendTelegramDirect(playerId, notifyMsg);
        renderAdminList();
    } catch {
        alert('Ошибка связи с базой!');
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
        await sendGemNotification(playerId, amount, getGems());
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
        await sendGemNotification(playerId, amount, nextGems);
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
        fetch(`${baseUrl}/leaderboard/zlab/${playerId}.json`, { method: 'DELETE' }),
        fetch(`${baseUrl}/leaderboard/aim/${playerId}.json`, { method: 'DELETE' })
    ]).catch(() => {});

    if (playerId === myPlayerId) {
        hubRecords = { mines: null, tetris: 0, zlab: 0, aim: 0 };
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
            fetch(`${baseUrl}/leaderboard/zlab/${playerId}.json`, { method: 'DELETE' }),
            fetch(`${baseUrl}/leaderboard/aim/${playerId}.json`, { method: 'DELETE' })
        ]).catch(() => {});
    }
    sfxExplosion();
    renderAdminList();
}
