// ==================== ОНЛАЙН-ДУЭЛИ 1 НА 1 (SEEDED PVP + ОНЛАЙН-ШАХМАТЫ) ====================
let activeDuel = null;
let duelRng = null;
let currentDuelTab = 'incoming';
let cachedDuelPlayers = [];
let selectedDuelOpponent = null;
let selectedDuelGame = 'mines';
let selectedDuelBet = 50;
let lastNotifiedIncomingCount = 0;

function createSeededRng(seed) {
    let a = (Number(seed) || 123456) >>> 0;
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function getDuelGameLabel(game) {
    if (game === 'mines') return '💣 Сапёр';
    if (game === 'tetris') return '🧱 Тетрис';
    if (game === 'aim') return '🎯 Cyber Aim';
    if (game === 'chess') return '♟️ Шахматы';
    return game;
}

function formatDuelScore(game, score, failed = false) {
    if (game === 'mines') {
        return failed ? '💥 Подорвался' : `⏱ ${score}с`;
    }
    return `${score} pts`;
}

function updateDuelLiveBanner() {
    const banner = document.getElementById('duel-live-banner');
    if (!banner) return;
    if (activeDuel) {
        const oppName = activeDuel.role === 'creator' ? activeDuel.toName : activeDuel.fromName;
        const betText = activeDuel.bet > 0 ? ` • Банк: ${activeDuel.bet * 2} 💎` : ' • Тренировка';
        banner.innerText = `⚔️ ДУЭЛЬ vs ${oppName}${betText}`;
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }
}

function abortActiveDuel() {
    if (!activeDuel) return true;

    // Онлайн-шахматы поочерёдные: можно свободно выйти в меню и вернуться к ходу позже
    if (activeDuel.game === 'chess') {
        activeDuel = null;
        duelRng = null;
        updateDuelLiveBanner();
        return true;
    }

    const msg = activeDuel.role === 'creator'
        ? 'Выйти из дуэли? Вызов не будет отправлен (гемы не спишутся).'
        : 'Сдаться и выйти из дуэли? Ставка достанется сопернику!';
    if (!confirm(msg)) return false;

    const duelToForfeit = activeDuel;
    activeDuel = null;
    duelRng = null;
    updateDuelLiveBanner();

    if (duelToForfeit.role === 'opponent') {
        const worstScore = duelToForfeit.game === 'mines' ? 9999 : 0;
        resolveAcceptedDuelInCloud(duelToForfeit, worstScore, true);
    }
    return true;
}

function openDuels(tab = 'incoming') {
    if (isUserBanned) return;
    showScreen('duels-screen');
    switchDuelTab(tab, true);
}

function switchDuelTab(tab, silent = false) {
    if (!silent) sfxClick();
    currentDuelTab = tab;
    ['incoming', 'create', 'history'].forEach(t => {
        const el = document.getElementById('dueltab-' + t);
        if (el) el.classList.toggle('active', t === tab);
    });
    renderDuelsTab();
}

async function renderDuelsTab() {
    const bodyEl = document.getElementById('duels-body');
    if (!bodyEl) return;
    bodyEl.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px;">⏳ Синхронизация дуэлей...</div>`;

    if (currentDuelTab === 'create') {
        await renderCreateDuelForm(bodyEl);
    } else {
        await renderDuelsList(bodyEl, currentDuelTab);
    }
}

async function renderCreateDuelForm(container) {
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    let players = [];
    let bannedMap = {};

    if (baseUrl.startsWith('http')) {
        try {
            const ts = Date.now();
            const [pRes, bRes] = await Promise.all([
                fetch(`${baseUrl}/players.json?t=${ts}`, { cache: 'no-store' }),
                fetch(`${baseUrl}/banned.json?t=${ts}`, { cache: 'no-store' })
            ]);
            const pData = (await pRes.json()) || {};
            bannedMap = (await bRes.json()) || {};

            players = Object.entries(pData)
                .filter(([id, info]) => id !== myPlayerId && info && typeof info === 'object' && !(bannedMap[id] && bannedMap[id].banned))
                .map(([id, info]) => ({
                    id,
                    name: info.name || 'Игрок',
                    tag: info.tag || '',
                    gems: Number(info.gems) || 0,
                    badge: info.badge || '',
                    lastSeen: Number(info.lastSeen) || 0
                }))
                .sort((a, b) => b.lastSeen - a.lastSeen);
        } catch {}
    }

    cachedDuelPlayers = players;
    if (selectedDuelOpponent && !players.some(p => p.id === selectedDuelOpponent.id)) {
        selectedDuelOpponent = null;
    }

    const myGems = getGems();
    container.innerHTML = `
        <div class="duel-setup-card">
            <div class="duel-sec-title">1. ВЫБЕРИ ИГРУ</div>
            <div class="duel-chip-row" style="flex-wrap:wrap;">
                <button class="duel-chip ${selectedDuelGame === 'mines' ? 'active' : ''}" onclick="selectDuelGame('mines')">💣 Сапёр</button>
                <button class="duel-chip ${selectedDuelGame === 'tetris' ? 'active' : ''}" onclick="selectDuelGame('tetris')">🧱 Тетрис</button>
                <button class="duel-chip ${selectedDuelGame === 'aim' ? 'active' : ''}" onclick="selectDuelGame('aim')">🎯 Аим</button>
                <button class="duel-chip ${selectedDuelGame === 'chess' ? 'active' : ''}" onclick="selectDuelGame('chess')">♟️ Шахматы</button>
            </div>

            <div class="duel-sec-title">2. СТАВКА (У тебя: ${myGems} 💎)</div>
            <div class="duel-chip-row duel-bets-row">
                ${[0, 50, 100, 250, 500].map(b => `
                    <button class="duel-chip ${selectedDuelBet === b ? 'active' : ''}" onclick="selectDuelBet(${b})">${b === 0 ? '0 💎' : b + ' 💎'}</button>
                `).join('')}
            </div>

            <div class="duel-sec-title">3. ВЫБЕРИ СОПЕРНИКА</div>
            <input type="text" id="duel-player-search" class="duel-search-input" placeholder="🔍 Поиск по имени или @нику..." oninput="filterDuelOpponents()">
            <div id="duel-opponents-list" class="duel-opponents-list"></div>

            <button class="btn btn-duel" style="width:100%; margin-top:6px;" onclick="launchCreatedDuel()">
                ${selectedDuelGame === 'chess' ? '♟️ НАЧАТЬ ОНЛАЙН-ПАРТИЮ' : '⚔️ ИГРАТЬ И ОТПРАВИТЬ ВЫЗОВ'}
            </button>
        </div>
    `;

    filterDuelOpponents();
}

function selectDuelGame(game) {
    sfxClick();
    selectedDuelGame = game;
    renderDuelsTab();
}

function selectDuelBet(bet) {
    sfxClick();
    selectedDuelBet = bet;
    renderDuelsTab();
}

function selectDuelOpponent(id) {
    sfxPop();
    selectedDuelOpponent = cachedDuelPlayers.find(p => p.id === id) || null;
    filterDuelOpponents();
}

function filterDuelOpponents() {
    const listEl = document.getElementById('duel-opponents-list');
    if (!listEl) return;
    const q = (document.getElementById('duel-player-search')?.value || '').trim().toLowerCase();

    const filtered = cachedDuelPlayers.filter(p =>
        !q || p.name.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:14px; font-size:0.8rem;">Соперники не найдены</div>`;
        return;
    }

    const now = Date.now();
    listEl.innerHTML = filtered.map(p => {
        const isOnline = (now - p.lastSeen) < 3 * 60 * 1000;
        const isSel = selectedDuelOpponent && selectedDuelOpponent.id === p.id;
        const badgeHtml = p.badge ? ` <span class="lb-badge-tag">${p.badge}</span>` : '';
        return `
            <div class="duel-opponent-card ${isSel ? 'selected' : ''}" onclick="selectDuelOpponent('${p.id}')">
                <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                    <span class="online-dot ${isOnline ? 'on' : ''}"></span>
                    <div style="min-width:0;">
                        <div class="lb-name">${p.name}${badgeHtml}</div>
                        <div class="lb-tag">${p.tag} • 💎 ${p.gems}</div>
                    </div>
                </div>
                <div style="font-size:0.82rem; font-weight:900; color:${isSel ? '#fb7185' : '#64748b'};">
                    ${isSel ? '⚔️ ВЫБРАН' : 'Выбрать'}
                </div>
            </div>
        `;
    }).join('');
}

function launchCreatedDuel() {
    if (!selectedDuelOpponent) {
        sfxAlarm();
        doVibrate(100);
        spawnFloatText(window.innerWidth / 2, window.innerHeight / 2, '👆 Сначала выбери соперника!', '#ef4444');
        return;
    }
    if (getGems() < selectedDuelBet) {
        sfxAlarm();
        doVibrate(120);
        spawnFloatText(window.innerWidth / 2, window.innerHeight / 2, '💎 Не хватает гемов на ставку!', '#ef4444');
        return;
    }

    const seed = Math.floor(Math.random() * 899999) + 100000;
    activeDuel = {
        id: 'duel_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        role: 'creator',
        game: selectedDuelGame,
        bet: selectedDuelBet,
        seed: seed,
        fromId: myPlayerId,
        fromName: tgUser.name,
        fromTag: tgUser.username,
        toId: selectedDuelOpponent.id,
        toName: selectedDuelOpponent.name,
        toTag: selectedDuelOpponent.tag,
        myColor: 'w',
        isFirstMove: true
    };

    sfxVictory();
    doVibrate(40);
    startDuelGameplay();
}

function startDuelGameplay() {
    if (!activeDuel) return;
    duelRng = createSeededRng(activeDuel.seed);
    const game = activeDuel.game;

    document.getElementById('main-menu').style.display = 'none';
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');

    if (game === 'mines') {
        document.getElementById('mines-screen').style.display = 'flex';
        updateDuelLiveBanner();
        initMines();
    } else if (game === 'tetris') {
        document.getElementById('tetris-screen').style.display = 'flex';
        updateDuelLiveBanner();
        initTetris();
    } else if (game === 'aim') {
        document.getElementById('aim-screen').style.display = 'flex';
        updateDuelLiveBanner();
        initAim();
    } else if (game === 'chess') {
        document.getElementById('chess-screen').style.display = 'flex';
        if (typeof startNewOnlineChess === 'function') startNewOnlineChess(activeDuel);
    }
}

async function sendDuelTelegramNotification(toId, text) {
    if (!toId || !toId.startsWith('tg_')) return;
    let token = '';
    try { token = localStorage.getItem('gameHubBotToken') || ''; } catch {}
    if (!token) return;

    const chatId = toId.slice(3);
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });
    } catch {}
}

async function finishDuelAttempt(score, failed = false) {
    if (!activeDuel) return;
    const duel = activeDuel;
    activeDuel = null;
    duelRng = null;
    updateDuelLiveBanner();

    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    const overlay = document.getElementById('duel-result-overlay');
    const iconEl = document.getElementById('duel-res-icon');
    const titleEl = document.getElementById('duel-res-title');
    const subEl = document.getElementById('duel-res-sub');
    const badgeEl = document.getElementById('duel-res-badge');

    if (duel.role === 'creator') {
        if (duel.bet > 0) {
            if (getGems() < duel.bet) {
                alert('Недостаточно кристаллов для завершения ставки!');
                backToMenu();
                return;
            }
            addGems(-duel.bet);
        }

        const payload = {
            id: duel.id,
            game: duel.game,
            bet: duel.bet,
            seed: duel.seed,
            fromId: duel.fromId,
            fromName: duel.fromName,
            fromTag: duel.fromTag,
            toId: duel.toId,
            toName: duel.toName,
            toTag: duel.toTag,
            creatorScore: score,
            creatorFailed: !!failed,
            opponentScore: null,
            opponentFailed: false,
            status: 'pending',
            winnerId: null,
            payoutClaimed: false,
            createdAt: Date.now()
        };

        try {
            await fetch(`${baseUrl}/duels/${duel.id}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const betStr = duel.bet > 0 ? `\nСтавка: <b>${duel.bet} 💎</b> (банк ${duel.bet * 2} 💎)` : '';
            sendDuelTelegramNotification(
                duel.toId,
                `⚔️ <b>Новый вызов на дуэль!</b>\n\nИгрок <b>${duel.fromName}</b> (${duel.fromTag}) вызывает тебя в <b>${getDuelGameLabel(duel.game)}</b>!${betStr}\n\nЗаходи в Game Hub и прими вызов!`
            );
        } catch {}

        sfxVictory();
        iconEl.innerText = '📨';
        titleEl.innerText = 'ВЫЗОВ ОТПРАВЛЕН!';
        subEl.innerText = `Соперник: ${duel.toName} • Игра: ${getDuelGameLabel(duel.game)}`;
        badgeEl.innerText = `Твой результат: ${formatDuelScore(duel.game, score, failed)} • Ждём ответа!`;
        if (overlay) overlay.classList.add('active');
    } else {
        await resolveAcceptedDuelInCloud(duel, score, failed, true);
    }
}

async function resolveAcceptedDuelInCloud(duel, oppScore, oppFailed, showModal = false) {
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    let fresh = duel;
    try {
        const res = await fetch(`${baseUrl}/duels/${duel.id}.json?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data) fresh = data;
    } catch {}

    const cScore = Number(fresh.creatorScore) || 0;
    const cFailed = !!fresh.creatorFailed;
    const oScore = Number(oppScore) || 0;
    const oFailed = !!oppFailed;

    let winnerId = 'draw';
    if (fresh.game === 'mines') {
        if (cFailed && oFailed) winnerId = 'draw';
        else if (cFailed && !oFailed) winnerId = fresh.toId;
        else if (!cFailed && oFailed) winnerId = fresh.fromId;
        else if (oScore < cScore) winnerId = fresh.toId;
        else if (cScore < oScore) winnerId = fresh.fromId;
        else winnerId = 'draw';
    } else {
        if (oScore > cScore) winnerId = fresh.toId;
        else if (cScore > oScore) winnerId = fresh.fromId;
        else winnerId = 'draw';
    }

    const bank = (Number(fresh.bet) || 0) * 2;
    let payoutClaimed = false;

    if (winnerId === myPlayerId) {
        if (bank > 0) addGems(bank);
        payoutClaimed = true;
    } else if (winnerId === 'draw') {
        if (fresh.bet > 0) addGems(fresh.bet);
    }

    try {
        await fetch(`${baseUrl}/duels/${fresh.id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                opponentScore: oScore,
                opponentFailed: oFailed,
                status: 'finished',
                winnerId: winnerId,
                payoutClaimed: payoutClaimed,
                finishedAt: Date.now()
            })
        });
    } catch {}

    if (!showModal) return;

    const overlay = document.getElementById('duel-result-overlay');
    const iconEl = document.getElementById('duel-res-icon');
    const titleEl = document.getElementById('duel-res-title');
    const subEl = document.getElementById('duel-res-sub');
    const badgeEl = document.getElementById('duel-res-badge');

    const myResStr = formatDuelScore(fresh.game, oScore, oFailed);
    const oppResStr = formatDuelScore(fresh.game, cScore, cFailed);

    if (winnerId === myPlayerId) {
        sfxVictory();
        spawnConfettiCannon(true);
        spawnConfettiCannon(false);
        iconEl.innerText = '🏆';
        titleEl.innerText = 'ПОБЕДА В ДУЭЛИ!';
        subEl.innerText = `Ты: ${myResStr} vs ${fresh.fromName}: ${oppResStr}`;
        badgeEl.innerText = bank > 0 ? `💰 Забран банк: +${bank} 💎!` : '🔥 Чистая победа!';
    } else if (winnerId === 'draw') {
        sfxPop();
        iconEl.innerText = '🤝';
        titleEl.innerText = 'БОЕВАЯ НИЧЬЯ!';
        subEl.innerText = `Ты: ${myResStr} vs ${fresh.fromName}: ${oppResStr}`;
        badgeEl.innerText = fresh.bet > 0 ? `🔄 Ставка ${fresh.bet} 💎 возвращена` : 'Никто не уступил!';
    } else {
        sfxExplosion();
        iconEl.innerText = '💀';
        titleEl.innerText = 'ПОРАЖЕНИЕ';
        subEl.innerText = `Ты: ${myResStr} vs ${fresh.fromName}: ${oppResStr}`;
        badgeEl.innerText = fresh.bet > 0 ? `Банк ${bank} 💎 ушёл сопернику` : 'Возьми реванш!';
    }

    if (overlay) overlay.classList.add('active');
}

function closeDuelResultOverlay() {
    const overlay = document.getElementById('duel-result-overlay');
    if (overlay) overlay.classList.remove('active');
    openDuels('history');
}

async function acceptDuelChallenge(duelId) {
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    try {
        const res = await fetch(`${baseUrl}/duels/${duelId}.json?t=${Date.now()}`, { cache: 'no-store' });
        const duel = await res.json();
        if (!duel || duel.status !== 'pending') {
            alert('Этот вызов уже неактуален!');
            renderDuelsTab();
            return;
        }
        const bet = Number(duel.bet) || 0;
        if (getGems() < bet) {
            sfxAlarm();
            doVibrate(120);
            spawnFloatText(window.innerWidth / 2, window.innerHeight / 2, `💎 Нужно ${bet} 💎 для принятия!`, '#ef4444');
            return;
        }

        if (bet > 0) addGems(-bet);

        await fetch(`${baseUrl}/duels/${duelId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'accepted', acceptedAt: Date.now() })
        });

        activeDuel = {
            ...duel,
            role: 'opponent'
        };
        sfxVictory();
        doVibrate(40);
        startDuelGameplay();
    } catch {
        alert('Ошибка связи с базой!');
    }
}

async function declineDuelChallenge(duelId) {
    if (!confirm('Отклонить вызов?')) return;
    sfxClick();
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    try {
        await fetch(`${baseUrl}/duels/${duelId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'declined', payoutClaimed: false, finishedAt: Date.now() })
        });
        renderDuelsTab();
        syncDuelsAndPayouts();
    } catch {}
}

async function renderDuelsList(container, mode) {
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) return;

    try {
        const res = await fetch(`${baseUrl}/duels.json?t=${Date.now()}`, { cache: 'no-store' });
        const raw = (await res.json()) || {};
        const all = Object.values(raw).filter(d => d && typeof d === 'object');

        let filtered = [];
        if (mode === 'incoming') {
            filtered = all
                .filter(d =>
                    (d.toId === myPlayerId && d.status === 'pending') ||
                    (d.game === 'chess' && d.status === 'chess_active' && (d.fromId === myPlayerId || d.toId === myPlayerId))
                )
                .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
        } else {
            filtered = all
                .filter(d => (d.fromId === myPlayerId || d.toId === myPlayerId) && d.status !== 'chess_active')
                .sort((a, b) => (b.finishedAt || b.createdAt || 0) - (a.finishedAt || a.createdAt || 0))
                .slice(0, 25);
        }

        if (filtered.length === 0) {
            container.innerHTML = mode === 'incoming'
                ? `<div style="text-align:center; color:#94a3b8; padding:24px; font-size:0.88rem;">Активных вызовов и шахматных партий нет.<br><br><button class="btn btn-sm btn-duel" onclick="switchDuelTab('create')">🎯 Бросить вызов первым</button></div>`
                : `<div style="text-align:center; color:#94a3b8; padding:24px; font-size:0.88rem;">История дуэлей пуста.</div>`;
            return;
        }

        container.innerHTML = '';
        filtered.forEach(d => {
            const card = document.createElement('div');
            const betLabel = d.bet > 0 ? `💎 ${d.bet} (банк ${d.bet * 2})` : 'Бесплатно';

            // Активная пошаговая партия в Онлайн-Шахматы
            if (d.game === 'chess' && d.status === 'chess_active') {
                const iAmCreator = d.fromId === myPlayerId;
                const oppName = iAmCreator ? d.toName : d.fromName;
                const isMyTurn = d.currentTurnId === myPlayerId;
                const canDecline = !iAmCreator && !d.acceptedByOpponent;

                card.className = 'duel-card' + (isMyTurn ? ' is-incoming' : '');
                card.innerHTML = `
                    <div class="duel-card-top">
                        <div>
                            <div class="lb-name">♟️ vs ${oppName}</div>
                            <div class="lb-tag">Ход #${d.moveCount || 1} • ${isMyTurn ? '<b style="color:#4ade80;">🟢 ТВОЙ ХОД!</b>' : '<span style="color:#94a3b8;">⏳ Ждём соперника</span>'}</div>
                        </div>
                        <div class="duel-bet-pill">${betLabel}</div>
                    </div>
                    <div class="duel-card-actions">
                        <button class="btn btn-xs ${isMyTurn ? 'btn-green' : ''}" onclick="openOnlineChessMatch('${d.id}')">
                            ${isMyTurn ? '♟️ Сделать ход' : '👁️ Открыть доску'}
                        </button>
                        ${canDecline ? `<button class="btn btn-xs btn-red" onclick="declineDuelChallenge('${d.id}')">✖ Отклонить</button>` : ''}
                    </div>
                `;
                container.appendChild(card);
                return;
            }

            const isIncoming = d.toId === myPlayerId && d.status === 'pending';
            card.className = 'duel-card' + (isIncoming ? ' is-incoming' : '');

            if (isIncoming) {
                card.innerHTML = `
                    <div class="duel-card-top">
                        <div>
                            <div class="lb-name">⚔️ ${d.fromName}</div>
                            <div class="lb-tag">${d.fromTag} • ${getDuelGameLabel(d.game)}</div>
                        </div>
                        <div class="duel-bet-pill">${betLabel}</div>
                    </div>
                    <div class="duel-card-actions">
                        <button class="btn btn-xs btn-green" onclick="acceptDuelChallenge('${d.id}')">⚔️ Принять</button>
                        <button class="btn btn-xs btn-red" onclick="declineDuelChallenge('${d.id}')">✖ Отклонить</button>
                    </div>
                `;
            } else {
                const iAmCreator = d.fromId === myPlayerId;
                const oppName = iAmCreator ? d.toName : d.fromName;
                const isChess = d.game === 'chess';
                const myScore = isChess ? '' : (iAmCreator ? formatDuelScore(d.game, d.creatorScore, d.creatorFailed) : formatDuelScore(d.game, d.opponentScore, d.opponentFailed));
                const oppScore = isChess ? '' : (iAmCreator ? formatDuelScore(d.game, d.opponentScore, d.opponentFailed) : formatDuelScore(d.game, d.creatorScore, d.creatorFailed));
                const scoreSuffix = isChess ? '' : ` • ${myScore} vs ${oppScore}`;

                let statusHtml = '';
                if (d.status === 'pending') {
                    statusHtml = `<span style="color:#fbbf24;">⏳ Ждём соперника (твой счёт: ${myScore})</span>`;
                } else if (d.status === 'accepted') {
                    statusHtml = `<span style="color:#38bdf8;">🎮 Соперник в игре...</span>`;
                } else if (d.status === 'declined') {
                    statusHtml = `<span style="color:#94a3b8;">✖ Вызов отклонён (возврат)</span>`;
                } else if (d.status === 'finished') {
                    if (d.winnerId === myPlayerId) {
                        statusHtml = `<span style="color:#4ade80;">🏆 Победа (+${d.bet * 2} 💎)${scoreSuffix}</span>`;
                    } else if (d.winnerId === 'draw') {
                        statusHtml = `<span style="color:#cbd5e1;">🤝 Ничья${scoreSuffix}</span>`;
                    } else {
                        statusHtml = `<span style="color:#ef4444;">💀 Поражение${scoreSuffix}</span>`;
                    }
                }

                card.innerHTML = `
                    <div class="duel-card-top">
                        <div>
                            <div class="lb-name">vs ${oppName}</div>
                            <div class="lb-tag">${getDuelGameLabel(d.game)} • ${betLabel}</div>
                        </div>
                    </div>
                    <div style="font-size:0.76rem; font-weight:800; margin-top:4px;">${statusHtml}</div>
                `;
            }
            container.appendChild(card);
        });
    } catch {
        container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Ошибка загрузки дуэлей</div>`;
    }
}

// Фоновая проверка входящих вызовов, очередей хода в шахматах и автовыплат
async function syncDuelsAndPayouts() {
    if (isUserBanned) return;
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) return;

    try {
        const res = await fetch(`${baseUrl}/duels.json?t=${Date.now()}`, { cache: 'no-store' });
        const raw = (await res.json()) || {};
        const all = Object.values(raw).filter(d => d && typeof d === 'object');

        // 1. Входящие вызовы + онлайн-шахматы, где сейчас твой ход
        const incoming = all.filter(d =>
            (d.toId === myPlayerId && d.status === 'pending') ||
            (d.game === 'chess' && d.status === 'chess_active' && d.currentTurnId === myPlayerId)
        );
        const badgeEl = document.getElementById('duels-incoming-badge');
        const menuBanner = document.getElementById('menu-duel-banner');

        if (badgeEl) {
            if (incoming.length > 0) {
                badgeEl.innerText = incoming.length;
                badgeEl.style.display = 'inline-block';
            } else {
                badgeEl.style.display = 'none';
            }
        }

        if (menuBanner) {
            if (incoming.length > 0) {
                const first = incoming[0];
                if (first.game === 'chess' && first.status === 'chess_active') {
                    const oppName = first.fromId === myPlayerId ? first.toName : first.fromName;
                    menuBanner.innerHTML = `♟️ Твой ход в онлайн-шахматах против <b>${oppName}</b>!`;
                } else {
                    menuBanner.innerHTML = `⚔️ <b>${first.fromName}</b> вызывает тебя (${getDuelGameLabel(first.game)}${first.bet > 0 ? ` • ${first.bet} 💎` : ''})!`;
                }
                menuBanner.style.display = 'block';
                if (incoming.length > lastNotifiedIncomingCount) {
                    sfxFlag();
                }
            } else {
                menuBanner.style.display = 'none';
            }
        }
        lastNotifiedIncomingCount = incoming.length;

        // 2. Автовыплата побед / ничьих / отказов (для создателя дуэли ИЛИ победителя сдачи в шахматах)
        for (const d of all) {
            if (d.payoutClaimed) continue;

            const isWinnerClaim = d.status === 'finished' && d.winnerId === myPlayerId && (d.fromId === myPlayerId || d.game === 'chess');
            const isCreatorRefund = d.fromId === myPlayerId && ((d.status === 'finished' && d.winnerId === 'draw') || d.status === 'declined');

            if (isWinnerClaim) {
                await fetch(`${baseUrl}/duels/${d.id}.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payoutClaimed: true })
                });
                const winBank = (Number(d.bet) || 0) * 2;
                const oppName = d.fromId === myPlayerId ? d.toName : d.fromName;
                if (winBank > 0) {
                    addGems(winBank);
                    sfxVictory();
                    spawnConfettiCannon(true);
                    spawnConfettiCannon(false);
                    spawnFloatText(window.innerWidth / 2, 130, `🏆 ПОБЕДА vs ${oppName}: +${winBank} 💎!`, '#4ade80');
                }
            } else if (isCreatorRefund) {
                await fetch(`${baseUrl}/duels/${d.id}.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payoutClaimed: true })
                });
                const refund = Number(d.bet) || 0;
                if (refund > 0) {
                    addGems(refund);
                    spawnFloatText(window.innerWidth / 2, 130, `🔄 Возврат ставки ${refund} 💎 (${d.toName})`, '#94a3b8');
                }
            }
        }
    } catch {}
}

setTimeout(syncDuelsAndPayouts, 1500);
setInterval(syncDuelsAndPayouts, 10000);
