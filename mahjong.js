const MJ_SYMBOLS = ['🀄','🀅','🀆','🌸','🎋','🏮','🐉','🐯','🐢','🦊','💎','👑','🔥','❄️','⚡','🍀','🌙','☀️','🍒','🍉'];
const LEVEL_NAMES = ['Старт','Пирамида','Мост','Крест','Башни','Арена','Ромб','Лестница','Замок','Часы','Змейка','Щит','Храм','Лабиринт','Дракон'];

let currentMjLevel = 1, mjTiles = [], selectedTileId = null, mjCombo = 0, mjHelpUsed = 0;
let mjStars = loadMjStars();

function getMahjongLayout(lvl) {
    const coords = [];
    const addRect = (x0, y0, w, h, z) => { for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) coords.push({ x: x0 + x * 2, y: y0 + y * 2, z }); };
    const addPt = (x, y, z) => coords.push({ x, y, z });

    switch (lvl) {
        case 1: addRect(0, 0, 4, 4, 0); addRect(2, 2, 2, 2, 1); break;
        case 2: addRect(0, 0, 6, 4, 0); addRect(2, 2, 4, 2, 1); addRect(4, 2, 2, 2, 2); break;
        case 3: addRect(0, 0, 2, 4, 0); addRect(8, 0, 2, 4, 0); addRect(2, 2, 3, 2, 0); addRect(2, 2, 3, 2, 1); addRect(0, 2, 1, 2, 1); addRect(10, 2, 1, 2, 1); break;
        case 4: addRect(4, 0, 2, 6, 0); addRect(0, 4, 2, 2, 0); addRect(8, 4, 2, 2, 0); addRect(4, 2, 2, 4, 1); addRect(4, 4, 2, 2, 2); break;
        case 5: addRect(0, 0, 3, 4, 0); addRect(8, 0, 3, 4, 0); addRect(1, 2, 2, 2, 1); addRect(9, 2, 2, 2, 1); addRect(2, 2, 1, 2, 2); addRect(10, 2, 1, 2, 2); break;
        case 6: addRect(0, 0, 6, 1, 0); addRect(0, 8, 6, 1, 0); addRect(0, 2, 1, 3, 0); addRect(10, 2, 1, 3, 0); addRect(0, 0, 6, 1, 1); addRect(0, 8, 6, 1, 1); addRect(4, 4, 2, 1, 0); addRect(4, 4, 2, 1, 1); addRect(0, 4, 1, 1, 1); addRect(10, 4, 1, 1, 1); break;
        case 7: addRect(4, 0, 2, 1, 0); addRect(2, 2, 4, 1, 0); addRect(0, 4, 6, 2, 0); addRect(2, 8, 4, 1, 0); addRect(4, 10, 2, 1, 0); addRect(2, 4, 4, 2, 1); addRect(4, 4, 2, 1, 2); break;
        case 8: addRect(0, 0, 6, 2, 0); addRect(0, 4, 6, 2, 0); addRect(2, 0, 4, 2, 1); addRect(4, 4, 2, 2, 1); break;
        case 9: addRect(0, 0, 2, 2, 0); addRect(8, 0, 2, 2, 0); addRect(0, 6, 2, 2, 0); addRect(8, 6, 2, 2, 0); addRect(4, 2, 2, 3, 0); addRect(4, 2, 2, 3, 1); addRect(0, 0, 2, 1, 1); addRect(8, 0, 2, 1, 1); addRect(0, 6, 2, 1, 1); addRect(8, 6, 2, 1, 1); addRect(4, 4, 2, 1, 2); addRect(2, 4, 1, 1, 0); addRect(8, 4, 1, 1, 0); break;
        case 10: addRect(0, 0, 6, 1, 0); addRect(2, 2, 4, 1, 0); addRect(4, 4, 2, 2, 0); addRect(2, 8, 4, 1, 0); addRect(0, 10, 6, 1, 0); addRect(2, 0, 4, 1, 1); addRect(2, 10, 4, 1, 1); addRect(4, 4, 2, 2, 1); break;
        case 11: addRect(0, 0, 6, 1, 0); addRect(10, 2, 1, 2, 0); addRect(0, 4, 5, 1, 0); addRect(0, 6, 1, 2, 0); addRect(0, 8, 6, 1, 0); addRect(2, 0, 4, 1, 1); addRect(2, 4, 3, 1, 1); addRect(2, 8, 4, 1, 1); addRect(4, 0, 2, 1, 2); addRect(4, 8, 2, 1, 2); addPt(6, 4, 2); addPt(8, 4, 1); break;
        case 12: addRect(0, 0, 6, 3, 0); addRect(2, 6, 4, 2, 0); addRect(4, 10, 2, 1, 0); addRect(2, 2, 4, 2, 1); addRect(4, 6, 2, 2, 1); addRect(4, 2, 2, 1, 2); break;
        case 13: addRect(0, 0, 6, 4, 0); addRect(1, 1, 5, 3, 1); addRect(3, 2, 3, 2, 2); addPt(5, 3, 3); break;
        case 14: addRect(0, 0, 6, 1, 0); addRect(0, 4, 6, 1, 0); addRect(0, 8, 6, 1, 0); addRect(0, 2, 2, 1, 0); addRect(8, 6, 2, 1, 0); addRect(0, 0, 6, 1, 1); addRect(0, 4, 6, 1, 1); addRect(0, 8, 6, 1, 1); addRect(4, 4, 2, 1, 2); addRect(4, 0, 2, 1, 2); break;
        case 15: addRect(0, 2, 6, 4, 0); addRect(2, 0, 4, 1, 0); addRect(2, 10, 4, 1, 0); addRect(2, 2, 4, 4, 1); addRect(4, 4, 2, 2, 2); addRect(4, 4, 2, 1, 3); break;
    }
    if (coords.length % 2 !== 0) coords.pop();
    return coords;
}

function loadMjStars() {
    try { const raw = localStorage.getItem('mjStars'); if (raw) return JSON.parse(raw); } catch {}
    try { if (window.name && window.name.startsWith('MJ_STARS:')) return JSON.parse(window.name.slice(9)); } catch {}
    return {};
}
function saveMjStars(lvl, stars) {
    if (stars > (mjStars[lvl] || 0)) mjStars[lvl] = stars;
    const data = JSON.stringify(mjStars);
    try { localStorage.setItem('mjStars', data); } catch {}
    try { window.name = 'MJ_STARS:' + data; } catch {}
}
function calcEarnedStars() { return mjHelpUsed === 0 ? 3 : (mjHelpUsed <= 2 ? 2 : 1); }

function openMahjongLevels() {
    showScreen('mahjong-levels-screen');
    const grid = document.getElementById('levels-grid'); grid.innerHTML = '';
    const doneCount = Object.keys(mjStars).length;
    document.getElementById('mj-progress-text').innerText = `${doneCount} / 15`;
    document.getElementById('mj-progress-fill').style.width = `${(doneCount / 15) * 100}%`;

    for (let i = 1; i <= 15; i++) {
        const stars = mjStars[i] || 0, isDone = stars > 0;
        const card = document.createElement('div');
        card.className = 'level-card' + (isDone ? ' done' : '');
        const starsHtml = isDone ? '★'.repeat(stars) + `<span style="opacity:0.3">☆</span>`.repeat(3 - stars) : '★★★';
        card.innerHTML = `<div class="level-badge">✓ ПРОЙДЕНО</div><div class="level-num">${i}</div><div class="level-name">${LEVEL_NAMES[i - 1]}</div><div class="level-stars">${starsHtml}</div>`;
        card.onclick = () => { sfxClick(); startMahjongLevel(i); };
        grid.appendChild(card);
    }
}

function isTileFree(tile, list) {
    const active = list.filter(t => !t.removed && t.id !== tile.id);
    if (active.some(t => t.z === tile.z + 1 && Math.abs(t.x - tile.x) < 2 && Math.abs(t.y - tile.y) < 2)) return false;
    const blockedLeft = active.some(t => t.z === tile.z && t.x === tile.x - 2 && Math.abs(t.y - tile.y) < 2);
    const blockedRight = active.some(t => t.z === tile.z && t.x === tile.x + 2 && Math.abs(t.y - tile.y) < 2);
    return !blockedLeft || !blockedRight;
}

function startMahjongLevel(lvl) {
    currentMjLevel = lvl; selectedTileId = null; mjCombo = 0; mjHelpUsed = 0;
    showScreen('mahjong-game-screen');
    document.getElementById('mj-level-title').innerText = `Уровень ${lvl}: ${LEVEL_NAMES[lvl - 1]}`;

    const layout = getMahjongLayout(lvl);
    mjTiles = layout.map((p, idx) => ({ id: idx, x: p.x, y: p.y, z: p.z, sym: '', removed: false }));

    let temp = mjTiles.map(t => ({ ...t }));
    const pairsCount = mjTiles.length / 2, symPool = [];
    for (let i = 0; i < pairsCount; i++) symPool.push(MJ_SYMBOLS[i % MJ_SYMBOLS.length]);
    symPool.sort(() => Math.random() - 0.5);

    let symIdx = 0;
    while (temp.some(t => !t.removed)) {
        let free = temp.filter(t => !t.removed && isTileFree(t, temp));
        if (free.length < 2) free = temp.filter(t => !t.removed);
        free.sort(() => Math.random() - 0.5);
        const a = free[0], b = free[1], s = symPool[symIdx++];
        mjTiles[a.id].sym = s; mjTiles[b.id].sym = s;
        a.removed = true; b.removed = true;
    }
    renderMahjong();
}

function renderMahjong() {
    const stage = document.getElementById('mahjong-stage'); stage.innerHTML = '';
    const remaining = mjTiles.filter(t => !t.removed);
    document.getElementById('mj-left').innerText = remaining.length;

    const maxX = Math.max(...mjTiles.map(t => t.x)) + 2, maxY = Math.max(...mjTiles.map(t => t.y)) + 2;
    const availW = Math.min(window.innerWidth - 36, 400), availH = window.innerHeight - 220;
    const unit = Math.min(Math.floor(availW / maxX), Math.floor(availH / maxY), 28);
    const tileW = unit * 2 - 2, tileH = unit * 2 - 2;

    stage.style.width = (maxX * unit + 16) + 'px';
    stage.style.height = (maxY * unit + 16) + 'px';

    remaining.sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
    remaining.forEach(t => {
        const free = isTileFree(t, mjTiles);
        const el = document.createElement('div');
        el.className = 'mj-tile' + (free ? '' : ' blocked') + (selectedTileId === t.id ? ' selected' : '');
        el.dataset.id = t.id;
        el.style.width = tileW + 'px'; el.style.height = tileH + 'px';
        el.style.left = (8 + t.x * unit - t.z * 4) + 'px';
        el.style.top = (8 + t.y * unit - t.z * 4) + 'px';
        el.style.zIndex = t.z * 100 + t.y;
        el.style.fontSize = Math.floor(tileW * 0.58) + 'px';
        el.innerText = t.sym;
        el.onclick = (e) => onMahjongTileClick(t, e);
        stage.appendChild(el);
    });
}

function onMahjongTileClick(tile, e) {
    if (!isTileFree(tile, mjTiles)) { doVibrate(15); return; }
    if (selectedTileId === tile.id) { selectedTileId = null; sfxClick(); renderMahjong(); return; }
    if (selectedTileId === null) { selectedTileId = tile.id; sfxClick(); doVibrate(15); renderMahjong(); return; }

    const first = mjTiles.find(t => t.id === selectedTileId);
    if (first && first.sym === tile.sym) {
        const firstEl = document.querySelector(`.mj-tile[data-id="${first.id}"]`);
        if (firstEl) {
            const r1 = firstEl.getBoundingClientRect();
            spawnBurst(r1.left + r1.width / 2, r1.top + r1.height / 2, 18, ['#fbbf24', '#38bdf8', '#f472b6']);
        }
        spawnBurst(e.clientX, e.clientY, 18, ['#fbbf24', '#4ade80', '#ffffff']);
        mjCombo++; sfxMatch(mjCombo);
        const words = ['NICE!', 'BOOM!', 'COMBO x' + mjCombo + '!', '🔥 FIRE!'];
        spawnFloatText(e.clientX, e.clientY - 10, words[Math.min(mjCombo - 1, words.length - 1)], '#fbbf24');
        triggerShake(false);

        first.removed = true; tile.removed = true; selectedTileId = null;
        doVibrate(40); renderMahjong(); checkMahjongState();
    } else {
        mjCombo = 0; selectedTileId = tile.id; sfxClick(); doVibrate(15); renderMahjong();
    }
}

function findAvailablePair() {
    const free = mjTiles.filter(t => !t.removed && isTileFree(t, mjTiles));
    for (let i = 0; i < free.length; i++)
        for (let j = i + 1; j < free.length; j++)
            if (free[i].sym === free[j].sym) return [free[i], free[j]];
    return null;
}

function showMahjongVictory(earnedStars) {
    const overlay = document.getElementById('mj-victory-overlay');
    const isLast = currentMjLevel >= 15;
    document.getElementById('victory-sub').innerText = `Уровень ${currentMjLevel}: ${LEVEL_NAMES[currentMjLevel - 1]}`;
    document.getElementById('victory-aura').innerText = isLast
        ? '👑 ВСЕ 15 УРОВНЕЙ ПРОЙДЕНЫ! +9999 AURA'
        : `🔥 +${currentMjLevel * earnedStars * 200} AURA • ${earnedStars}/3 ⭐`;

    overlay.querySelectorAll('.v-star').forEach((el, idx) => { el.innerText = '⭐'; el.classList.toggle('unearned', idx >= earnedStars); });
    document.getElementById('victory-next-btn').style.display = isLast ? 'none' : 'block';
        document.getElementById('mj-victory-share').onclick = () => {
        sfxClick();
        shareGameScore(`🀄 Я прошёл ${currentMjLevel}-й уровень «${LEVEL_NAMES[currentMjLevel - 1]}» в Маджонге на ${earnedStars}/3 ⭐ в Game Hub!`);
    };
    overlay.classList.add('active');

    sfxVictory(); triggerShake(true); doVibrate([80, 40, 80, 40, 180]);
    spawnConfettiCannon(true); spawnConfettiCannon(false);
    spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 70, null, 1.4);

    const hypeWords = ['🔥 MEGA WIN!', '⚡ INSANE!', '💎 GG EZ!', '🎉 +1000 AURA!', '👑 LEGEND!', '🚀 HYPER!'];
    const hypeColors = ['#fbbf24', '#4ade80', '#38bdf8', '#f472b6', '#a855f7'];
    let wave = 0;

    clearInterval(victoryFxTimer);
    victoryFxTimer = setInterval(() => {
        wave++;
        const rx = 50 + Math.random() * (window.innerWidth - 100), ry = 80 + Math.random() * (window.innerHeight * 0.55);
        spawnBurst(rx, ry, 28, null, 1.15);
        spawnFloatText(rx, ry, hypeWords[wave % hypeWords.length], hypeColors[wave % hypeColors.length]);
        if (wave % 2 === 0) { spawnConfettiCannon(wave % 4 === 0); triggerShake(false); }
    }, 550);
}

function goNextMahjongLevel() {
    clearInterval(victoryFxTimer); victoryFxTimer = null;
    document.getElementById('mj-victory-overlay').classList.remove('active');
    if (currentMjLevel < 15) startMahjongLevel(currentMjLevel + 1);
    else openMahjongLevels();
}

function closeVictoryAndOpenLevels() {
    clearInterval(victoryFxTimer); victoryFxTimer = null;
    document.getElementById('mj-victory-overlay').classList.remove('active');
    openMahjongLevels();
}

function checkMahjongState() {
    if (mjTiles.filter(t => !t.removed).length === 0) {
        const earned = calcEarnedStars();
        saveMjStars(currentMjLevel, earned);
        showMahjongVictory(earned);
        return;
    }
    if (!findAvailablePair()) setTimeout(() => { alert('Ходов больше нет! Перемешиваем фишки.'); mjShuffle(true); }, 200);
}

function mjHint() {
    const pair = findAvailablePair();
    if (!pair) { mjShuffle(true); return; }
    mjHelpUsed++; sfxFlag();
    document.querySelectorAll('.mj-tile').forEach(el => {
        const id = parseInt(el.dataset.id);
        if (id === pair[0].id || id === pair[1].id) el.classList.add('hint');
    });
    doVibrate(25);
}

function mjShuffle(isAuto = false) {
    if (!isAuto) mjHelpUsed++;
    const active = mjTiles.filter(t => !t.removed);
    const syms = active.map(t => t.sym).sort(() => Math.random() - 0.5);
    active.forEach((t, i) => t.sym = syms[i]);
    selectedTileId = null; mjCombo = 0; sfxShuffle();
    spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 30);
    triggerShake(false); doVibrate(35); renderMahjong();
}
