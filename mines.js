// ==================== САПЁР (ОБЫЧНЫЙ РЕЖИМ И ДУЭЛИ ПО SEED) ====================
let mSize = 8, mTotalMines = 10;
let mBoard = [], mRevealed = [], mFlagged = [];
let mFirstClick = true, mGameOver = false, mTimer = 0, mTimerInt = null;

function stopMines() {
    if (mTimerInt) { clearInterval(mTimerInt); mTimerInt = null; }
}

function initMines() {
    stopMines();
    document.getElementById('mines-result-overlay').classList.remove('active');

    const isDuel = typeof activeDuel !== 'undefined' && activeDuel && activeDuel.game === 'mines';
    if (isDuel) {
        mSize = 8;
        mTotalMines = 10;
    } else {
        const diff = (document.getElementById('mines-difficulty')?.value || '8-10').split('-');
        mSize = parseInt(diff[0], 10) || 8;
        mTotalMines = parseInt(diff[1], 10) || 10;
    }

    mBoard = Array.from({ length: mSize }, () => Array(mSize).fill(0));
    mRevealed = Array.from({ length: mSize }, () => Array(mSize).fill(false));
    mFlagged = Array.from({ length: mSize }, () => Array(mSize).fill(false));
    mFirstClick = true;
    mGameOver = false;
    mTimer = 0;

    document.getElementById('m-count').innerText = mTotalMines;
    document.getElementById('m-timer').innerText = '0';

    let safeCell = null;
    if (isDuel && typeof duelRng === 'function') {
        const sr = Math.floor(duelRng() * (mSize - 2)) + 1;
        const sc = Math.floor(duelRng() * (mSize - 2)) + 1;
        safeCell = { r: sr, c: sc };
        placeMinesWithRng(sr, sc, duelRng);
        mFirstClick = false;
    }

    renderMinesGrid(safeCell);
}

function placeMinesWithRng(safeR, safeC, rngFn) {
    let placed = 0;
    while (placed < mTotalMines) {
        const r = Math.floor(rngFn() * mSize);
        const c = Math.floor(rngFn() * mSize);
        if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
        if (mBoard[r][c] === -1) continue;
        mBoard[r][c] = -1;
        placed++;
    }

    for (let r = 0; r < mSize; r++) {
        for (let c = 0; c < mSize; c++) {
            if (mBoard[r][c] === -1) continue;
            let cnt = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < mSize && nc >= 0 && nc < mSize && mBoard[nr][nc] === -1) cnt++;
                }
            }
            mBoard[r][c] = cnt;
        }
    }
}

function renderMinesGrid(safeCell = null) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    const cellSize = mSize === 12 ? 25 : mSize === 10 ? 30 : 36;
    grid.style.gridTemplateColumns = `repeat(${mSize}, ${cellSize}px)`;

    for (let r = 0; r < mSize; r++) {
        for (let c = 0; c < mSize; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `mcell-${r}-${c}`;
            cell.style.width = cellSize + 'px';
            cell.style.height = cellSize + 'px';
            if (safeCell && safeCell.r === r && safeCell.c === c) {
                cell.classList.add('duel-safe-cell');
            }

            let pressTimer = null;
            let longPressed = false;

            cell.addEventListener('pointerdown', (e) => {
                if (e.button === 2) {
                    toggleMineFlag(r, c);
                    return;
                }
                longPressed = false;
                pressTimer = setTimeout(() => {
                    longPressed = true;
                    toggleMineFlag(r, c);
                }, 360);
            });

            cell.addEventListener('pointerup', () => {
                clearTimeout(pressTimer);
                if (!longPressed) handleMineClick(r, c);
            });

            cell.addEventListener('pointerleave', () => clearTimeout(pressTimer));
            grid.appendChild(cell);
        }
    }
}

function startMinesTimer() {
    if (mTimerInt) return;
    mTimerInt = setInterval(() => {
        mTimer++;
        document.getElementById('m-timer').innerText = mTimer;
    }, 1000);
}

function toggleMineFlag(r, c) {
    if (mGameOver || mRevealed[r][c]) return;
    mFlagged[r][c] = !mFlagged[r][c];
    sfxFlag();
    doVibrate(25);

    const el = document.getElementById(`mcell-${r}-${c}`);
    el.innerText = mFlagged[r][c] ? '🚩' : '';
    el.classList.toggle('flagged', mFlagged[r][c]);

    let flags = 0;
    mFlagged.forEach(row => row.forEach(f => { if (f) flags++; }));
    document.getElementById('m-count').innerText = Math.max(0, mTotalMines - flags);
}

function handleMineClick(r, c) {
    if (mGameOver || mFlagged[r][c] || mRevealed[r][c]) return;

    const safeEl = document.getElementById(`mcell-${r}-${c}`);
    if (safeEl) safeEl.classList.remove('duel-safe-cell');

    if (mFirstClick) {
        mFirstClick = false;
        placeMinesWithRng(r, c, Math.random);
    }

    startMinesTimer();

    if (mBoard[r][c] === -1) {
        mGameOver = true;
        stopMines();
        sfxExplosion();
        triggerShake(true);
        doVibrate([120, 50, 120]);
        revealAllMines(r, c);

        if (typeof activeDuel !== 'undefined' && activeDuel && activeDuel.game === 'mines') {
            setTimeout(() => finishDuelAttempt(9999, true), 500);
            return;
        }

        document.getElementById('mines-res-icon').innerText = '💥';
        document.getElementById('mines-res-title').innerText = 'БУМ!';
        document.getElementById('mines-res-sub').innerText = 'Ты наткнулся на мину!';
        document.getElementById('mines-res-badge').innerText = `⏱ Продержался: ${mTimer}с`;
        document.getElementById('mines-res-share').style.display = 'none';
        document.getElementById('mines-result-card').classList.add('lose-card');
        document.getElementById('mines-rays').className = 'lose-rays';
        setTimeout(() => document.getElementById('mines-result-overlay').classList.add('active'), 350);
        return;
    }

    revealMineCell(r, c);
    sfxPop();
    doVibrate(12);
    checkMinesWin();
}

function revealMineCell(r, c) {
    if (r < 0 || r >= mSize || c < 0 || c >= mSize) return;
    if (mRevealed[r][c] || mFlagged[r][c]) return;

    mRevealed[r][c] = true;
    const el = document.getElementById(`mcell-${r}-${c}`);
    el.classList.add('revealed');
    el.classList.remove('duel-safe-cell');

    const val = mBoard[r][c];
    if (val > 0) {
        el.innerText = val;
        el.classList.add('n' + val);
    } else if (val === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr !== 0 || dc !== 0) revealMineCell(r + dr, c + dc);
            }
        }
    }
}

function revealAllMines(hitR, hitC) {
    for (let r = 0; r < mSize; r++) {
        for (let c = 0; c < mSize; c++) {
            if (mBoard[r][c] === -1) {
                const el = document.getElementById(`mcell-${r}-${c}`);
                el.classList.add('revealed', 'mine');
                el.innerText = (r === hitR && c === hitC) ? '💥' : '💣';
            }
        }
    }
}

function checkMinesWin() {
    let safeOpened = 0;
    for (let r = 0; r < mSize; r++) {
        for (let c = 0; c < mSize; c++) {
            if (mBoard[r][c] !== -1 && mRevealed[r][c]) safeOpened++;
        }
    }

    if (safeOpened === mSize * mSize - mTotalMines) {
        mGameOver = true;
        stopMines();
        sfxVictory();
        doVibrate([60, 40, 120]);
        spawnConfettiCannon(true);
        spawnConfettiCannon(false);

        const finalTime = Math.max(1, mTimer);
        if (typeof activeDuel !== 'undefined' && activeDuel && activeDuel.game === 'mines') {
            setTimeout(() => finishDuelAttempt(finalTime, false), 450);
            return;
        }

        const isNewBest = updateRecord('mines', finalTime);
        document.getElementById('mines-res-icon').innerText = '🏆';
        document.getElementById('mines-res-title').innerText = 'ПОБЕДА!';
        document.getElementById('mines-res-sub').innerText = 'Все мины обезврежены!';
        document.getElementById('mines-res-badge').innerText = isNewBest
            ? `🔥 НОВЫЙ РЕКОРД: ${finalTime}с!`
            : `⏱ Время: ${finalTime}с (Рекорд: ${hubRecords.mines}с)`;
        const shareBtn = document.getElementById('mines-res-share');
        shareBtn.style.display = 'block';
        shareBtn.onclick = () => {
            sfxClick();
            shareGameScore(`💣 Я разминировал поле в Сапёре за ${finalTime} сек (мой рекорд: ${hubRecords.mines} сек) в Game Hub!`);
        };
        document.getElementById('mines-result-card').classList.remove('lose-card');
        document.getElementById('mines-rays').className = 'victory-rays';
        setTimeout(() => document.getElementById('mines-result-overlay').classList.add('active'), 300);
    }
}

function closeMinesOverlayAndRestart() {
    document.getElementById('mines-result-overlay').classList.remove('active');
    initMines();
}
