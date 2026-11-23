let mSize = 8, mCount = 10, mData = [], mGameOver = false, mPressTimer = null;
let mFirstClick = true, mSeconds = 0, mTimerInt = null;
const M_COLORS = ['', '#0284c7', '#16a34a', '#dc2626', '#4f46e5', '#d97706', '#0d9488', '#9333ea', '#0f172a'];

function stopMines() {
    if (mTimerInt) { clearInterval(mTimerInt); mTimerInt = null; }
    if (mPressTimer) { clearTimeout(mPressTimer); mPressTimer = null; }
    mGameOver = true;
}

function initMines() {
    if (mTimerInt) { clearInterval(mTimerInt); mTimerInt = null; }
    if (victoryFxTimer) { clearInterval(victoryFxTimer); victoryFxTimer = null; }
    document.getElementById('mines-result-overlay').classList.remove('active');

    const diff = document.getElementById('mines-difficulty').value.split('-');
    mSize = parseInt(diff[0]); mCount = parseInt(diff[1]);
    mFirstClick = true; mSeconds = 0; mGameOver = false;

    const grid = document.getElementById('grid'); grid.innerHTML = '';
    const cellPx = Math.min(38, Math.floor((window.innerWidth - 46) / mSize) - 4);
    grid.style.gridTemplateColumns = `repeat(${mSize}, ${cellPx}px)`;
    document.getElementById('m-count').innerText = mCount;
    document.getElementById('m-timer').innerText = '0';

    mData = Array(mSize * mSize).fill(0).map(() => ({ m: false, r: false, f: false, n: 0 }));

    mData.forEach((d, i) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.width = cellPx + 'px'; cell.style.height = cellPx + 'px';
        cell.style.fontSize = Math.max(12, Math.floor(cellPx * 0.52)) + 'px';

        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (mGameOver) return;
            mPressTimer = setTimeout(() => {
                if (!d.r) {
                    d.f = !d.f; cell.innerHTML = d.f ? '🚩' : '';
                    updateMinesFlagCounter(); sfxFlag();
                    const rect = cell.getBoundingClientRect();
                    spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12, ['#fbbf24', '#ef4444']);
                    doVibrate(50);
                }
                mPressTimer = null;
            }, 420);
        }, { passive: false });

        cell.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (mPressTimer) { clearTimeout(mPressTimer); mPressTimer = null; handleMinesMove(i); }
        }, { passive: false });

        cell.addEventListener('click', () => handleMinesMove(i));
        grid.appendChild(cell);
    });
}

function updateMinesFlagCounter() {
    document.getElementById('m-count').innerText = Math.max(0, mCount - mData.filter(x => x.f).length);
}

function placeMinesSafely(safeIdx) {
    const forbidden = new Set([safeIdx, ...getNeighbors(safeIdx)]);
    let candidates = [];
    for (let i = 0; i < mData.length; i++) if (!forbidden.has(i)) candidates.push(i);
    if (candidates.length < mCount) {
        candidates = [];
        for (let i = 0; i < mData.length; i++) if (i !== safeIdx) candidates.push(i);
    }
    candidates.sort(() => Math.random() - 0.5);
    for (let i = 0; i < mCount; i++) mData[candidates[i]].m = true;
    mData.forEach((d, i) => { if (!d.m) d.n = getNeighbors(i).filter(idx => mData[idx].m).length; });

    mTimerInt = setInterval(() => { mSeconds++; document.getElementById('m-timer').innerText = mSeconds; }, 1000);
}

function showMinesResult(isWin) {
    const overlay = document.getElementById('mines-result-overlay');
    const card = document.getElementById('mines-result-card');
    const rays = document.getElementById('mines-rays');
    const retryBtn = document.getElementById('mines-res-retry');
    const shareBtn = document.getElementById('mines-res-share');

    if (isWin) {
        const isNewBest = updateRecord('mines', mSeconds);
        card.className = 'victory-card'; rays.className = 'victory-rays';
        document.getElementById('mines-res-icon').innerText = '🏆';
        document.getElementById('mines-res-title').innerText = isNewBest ? 'НОВЫЙ РЕКОРД!' : 'ПОБЕДА!';
        document.getElementById('mines-res-sub').innerText = `Поле ${mSize}x${mSize} полностью разминировано!`;
        document.getElementById('mines-res-badge').innerText = `⏱ ${mSeconds}с • 🏆 Лучшее: ${hubRecords.mines}с`;

        shareBtn.style.display = 'block';
        shareBtn.onclick = () => {
            sfxClick();
            shareGameScore(`💣 Я разминировал поле ${mSize}x${mSize} в Сапёре за ${mSeconds} сек (рекорд: ${hubRecords.mines}с)! Побей моё время в Game Hub!`);
        };

        retryBtn.className = 'btn btn-green'; retryBtn.innerText = '⚡ СЫГРАТЬ ЕЩЁ';

        sfxVictory(); triggerShake(true); doVibrate([80, 40, 80, 40, 180]);
        spawnConfettiCannon(true); spawnConfettiCannon(false);
        spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 70, null, 1.4);

        clearInterval(victoryFxTimer);
        victoryFxTimer = setInterval(() => {
            spawnBurst(50 + Math.random() * (window.innerWidth - 100), 80 + Math.random() * (window.innerHeight * 0.55), 24, null, 1.1);
        }, 650);
    } else {
        card.className = 'victory-card lose-card'; rays.className = 'lose-rays';
        document.getElementById('mines-res-icon').innerText = '💥';
        document.getElementById('mines-res-title').innerText = 'БАБАХ!';
        document.getElementById('mines-res-sub').innerText = 'Ты наткнулся на мину...';
        document.getElementById('mines-res-badge').innerText = `⏱ Продержался: ${mSeconds}с`;
        shareBtn.style.display = 'none';
        retryBtn.className = 'btn btn-red'; retryBtn.innerText = '🔄 ПОПРОБОВАТЬ СНОВА';
    }
    overlay.classList.add('active');
}

function closeMinesOverlayAndRestart() {
    if (victoryFxTimer) { clearInterval(victoryFxTimer); victoryFxTimer = null; }
    document.getElementById('mines-result-overlay').classList.remove('active');
    initMines();
}

function handleMinesMove(i) {
    const d = mData[i];
    if (!d || d.f || mGameOver) return;
    if (mFirstClick) { mFirstClick = false; placeMinesSafely(i); }

    const cell = document.getElementById('grid').children[i];
    const rect = cell.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;

    if (d.r) {
        let nb = getNeighbors(i);
        if (nb.filter(idx => mData[idx].f).length === d.n) {
            nb.forEach(idx => { if (!mData[idx].f && !mData[idx].r) handleMinesMove(idx); });
        }
        return;
    }
    if (d.m) {
        mGameOver = true; clearInterval(mTimerInt); mTimerInt = null;
        mData.forEach((item, idx) => { if (item.m) { const c = document.getElementById('grid').children[idx]; c.classList.add('mine'); c.innerHTML = '💣'; } });
        sfxExplosion(); spawnBurst(cx, cy, 45, ['#ef4444', '#f97316', '#fbbf24', '#ffffff'], 1.2);
        spawnFloatText(cx, cy, '💥 БУМ!', '#ef4444'); triggerShake(true); doVibrate(220);
        setTimeout(() => showMinesResult(false), 450);
    } else {
        revealMines(i); sfxPop(); spawnBurst(cx, cy, 8, ['#38bdf8', '#ffffff']); doVibrate(20);
        if (mData.every(item => item.m || item.r)) {
            mGameOver = true; clearInterval(mTimerInt); mTimerInt = null;
            setTimeout(() => showMinesResult(true), 250);
        }
    }
}

function revealMines(i) {
    if (mData[i].r || mData[i].f) return;
    mData[i].r = true;
    const cell = document.getElementById('grid').children[i];
    cell.classList.add('revealed');
    if (mData[i].n > 0) { cell.innerText = mData[i].n; cell.style.color = M_COLORS[mData[i].n]; }
    else { getNeighbors(i).forEach(idx => revealMines(idx)); }
}

function getNeighbors(idx) {
    const n = [], r = Math.floor(idx / mSize), c = idx % mSize;
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
        let nr = r + y, nc = c + x;
        if (nr >= 0 && nr < mSize && nc >= 0 && nc < mSize && !(x === 0 && y === 0)) n.push(nr * mSize + nc);
    }
    return n;
}
