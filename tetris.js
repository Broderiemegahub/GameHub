const tCanvas = document.getElementById('tetris-canvas');
const tCtx = tCanvas.getContext('2d');
const tNextCanvas = document.getElementById('tetris-next');
const tNextCtx = tNextCanvas ? tNextCanvas.getContext('2d') : null;

let tBoard = [], tPiece = null, tNextId = null, tScore = 0, tInt = null, tBusy = false;
const T_SHAPES = [
    null,
    [[1,1,1,1]],
    [[2,2],[2,2]],
    [[0,3,0],[3,3,3]],
    [[0,4,4],[4,4,0]],
    [[5,5,0],[0,5,5]],
    [[6,0,0],[6,6,6]],
    [[0,0,7],[7,7,7]]
];

function getActiveTColors() {
    return (typeof getTetrisColors === 'function')
        ? getTetrisColors()
        : [null, '#38bdf8', '#fbbf24', '#a855f7', '#4ade80', '#ef4444', '#3b82f6', '#f97316'];
}

function stopTetris() {
    if (tInt) { clearInterval(tInt); tInt = null; }
}

function initTetris() {
    clearInterval(tInt);
    tBusy = false;
    document.getElementById('tetris-result-overlay').classList.remove('active');
    tScore = 0;
    tBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
    document.getElementById('tetris-score').innerText = '0';

    const speed = parseInt(document.getElementById('tetris-speed').value);
    tNextId = Math.floor(Math.random() * 7) + 1;
    spawnT();
    drawT();
    tInt = setInterval(stepT, speed);
}

function spawnT() {
    const id = tNextId || (Math.floor(Math.random() * 7) + 1);
    tNextId = Math.floor(Math.random() * 7) + 1;
    drawNextT();

    const shape = T_SHAPES[id].map(r => [...r]);
    tPiece = {
        s: shape,
        x: Math.floor((10 - shape[0].length) / 2),
        y: 0,
        c: id
    };

    if (collAt(tPiece.s, tPiece.x, tPiece.y)) {
        clearInterval(tInt);
        tInt = null;
        sfxExplosion();
        triggerShake(true);
        doVibrate([100, 50, 100]);

        const isNewBest = updateRecord('tetris', tScore);
        const earnedGems = tScore >= 50 ? Math.max(2, Math.floor(tScore / 50)) : 0;
        if (earnedGems > 0 && typeof addGems === 'function') addGems(earnedGems);

        document.getElementById('tetris-res-sub').innerText = earnedGems > 0
            ? `Твой счёт: ${tScore} (+${earnedGems} 💎)`
            : `Твой счёт: ${tScore}`;
        document.getElementById('tetris-res-badge').innerText = isNewBest
            ? `🔥 НОВЫЙ РЕКОРД: ${hubRecords.tetris}!`
            : `🏆 Лучший рекорд: ${hubRecords.tetris}`;
        document.getElementById('tetris-res-share').onclick = () => {
            sfxClick();
            shareGameScore(`🧱 Я набрал ${tScore} очков в Тетрисе (мой рекорд: ${hubRecords.tetris}) в Game Hub! Сможешь больше?`);
        };
        setTimeout(() => document.getElementById('tetris-result-overlay').classList.add('active'), 250);
    }
}

function closeTetrisOverlayAndRestart() {
    document.getElementById('tetris-result-overlay').classList.remove('active');
    initTetris();
}

function collAt(shape, px, py) {
    return shape.some((row, dy) => row.some((v, dx) => {
        const nx = px + dx;
        const ny = py + dy;
        return v && (nx < 0 || nx >= 10 || ny >= 20 || (ny >= 0 && tBoard[ny][nx]));
    }));
}

function getGhostY() {
    if (!tPiece) return 0;
    let gy = tPiece.y;
    while (!collAt(tPiece.s, tPiece.x, gy + 1)) gy++;
    return gy;
}

async function lockPieceT() {
    tPiece.s.forEach((row, dy) => row.forEach((v, dx) => {
        if (v && tPiece.y + dy >= 0) {
            tBoard[tPiece.y + dy][tPiece.x + dx] = tPiece.c;
        }
    }));
    sfxPop();
    tBusy = true;
    await clearLinesT();
    tBusy = false;
    spawnT();
    doVibrate(25);
}

async function stepT() {
    if (tBusy || !tPiece) return;
    tPiece.y++;
    if (collAt(tPiece.s, tPiece.x, tPiece.y)) {
        tPiece.y--;
        await lockPieceT();
    }
    drawT();
}

async function hardDropT() {
    if (tBusy || !tPiece) return;
    const colors = getActiveTColors();
    let dropped = 0;
    while (!collAt(tPiece.s, tPiece.x, tPiece.y + 1)) {
        tPiece.y++;
        dropped++;
    }
    if (dropped > 0) {
        tScore += dropped * 2;
        document.getElementById('tetris-score').innerText = tScore;
        const rect = tCanvas.getBoundingClientRect();
        spawnBurst(rect.left + (tPiece.x + 1) * 20, rect.top + (tPiece.y + 1) * 20, 12, [colors[tPiece.c], '#ffffff']);
        triggerShake(false);
    }
    drawT();
    await lockPieceT();
    drawT();
}

async function clearLinesT() {
    let fullRows = [];
    for (let y = 0; y < 20; y++) {
        if (tBoard[y].every(v => v !== 0)) fullRows.push(y);
    }
    if (fullRows.length > 0) {
        const rect = tCanvas.getBoundingClientRect();
        sfxLineClear(fullRows.length);
        doVibrate(90);
        triggerShake(fullRows.length >= 2);
        fullRows.forEach(y => spawnBurst(rect.left + 100, rect.top + y * 20 + 10, 22));

        const pts = 100 * fullRows.length;
        spawnFloatText(
            rect.left + 100,
            rect.top + fullRows[0] * 20,
            fullRows.length > 1 ? `🔥 COMBO +${pts}!` : `+${pts}!`,
            '#4ade80'
        );

        for (let i = 0; i < 3; i++) {
            fullRows.forEach(y => { tCtx.fillStyle = 'white'; tCtx.fillRect(0, y * 20, 200, 20); });
            await new Promise(r => setTimeout(r, 40));
            drawT();
            await new Promise(r => setTimeout(r, 40));
        }
        fullRows.forEach(y => {
            tBoard.splice(y, 1);
            tBoard.unshift(Array(10).fill(0));
        });
        tScore += pts;
        document.getElementById('tetris-score').innerText = tScore;
    }
}

function drawNextT() {
    if (!tNextCtx || !tNextId) return;
    const colors = getActiveTColors();
    tNextCtx.fillStyle = isMinimalMode() ? '#1c1f26' : '#0f172a';
    tNextCtx.fillRect(0, 0, 64, 64);

    const shape = T_SHAPES[tNextId];
    const bs = 14;
    const ox = Math.floor((64 - shape[0].length * bs) / 2);
    const oy = Math.floor((64 - shape.length * bs) / 2);

    shape.forEach((row, dy) => row.forEach((v, dx) => {
        if (!v) return;
        const px = ox + dx * bs;
        const py = oy + dy * bs;
        tNextCtx.fillStyle = colors[v];
        tNextCtx.fillRect(px, py, bs - 1, bs - 1);
        if (!isMinimalMode()) {
            tNextCtx.fillStyle = 'rgba(255,255,255,0.28)';
            tNextCtx.fillRect(px, py, bs - 1, 3);
        }
    }));
}

function drawT() {
    const colors = getActiveTColors();
    tCtx.fillStyle = isMinimalMode() ? '#1c1f26' : '#1e293b';
    tCtx.fillRect(0, 0, 200, 400);

    tBoard.forEach((row, y) => row.forEach((v, x) => {
        if (v) drawBlock(x, y, colors[v]);
    }));

    if (tPiece) {
        const ghostY = getGhostY();
        if (ghostY > tPiece.y) {
            tPiece.s.forEach((row, dy) => row.forEach((v, dx) => {
                if (v) {
                    const gx = (tPiece.x + dx) * 20;
                    const gy = (ghostY + dy) * 20;
                    tCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                    tCtx.fillRect(gx, gy, 19, 19);
                    tCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
                    tCtx.lineWidth = 1;
                    tCtx.strokeRect(gx + 0.5, gy + 0.5, 18, 18);
                }
            }));
        }

        tPiece.s.forEach((row, dy) => row.forEach((v, dx) => {
            if (v) drawBlock(tPiece.x + dx, tPiece.y + dy, colors[tPiece.c]);
        }));
    }
}

function drawBlock(x, y, color) {
    tCtx.fillStyle = color;
    tCtx.fillRect(x * 20, y * 20, 19, 19);
    if (!isMinimalMode()) {
        tCtx.fillStyle = 'rgba(255,255,255,0.28)';
        tCtx.fillRect(x * 20, y * 20, 19, 4);
    }
}

function moveLeftT() {
    if (tBusy || !tPiece) return;
    if (!collAt(tPiece.s, tPiece.x - 1, tPiece.y)) {
        tPiece.x--;
        sfxClick();
        drawT();
        doVibrate(10);
    }
}

function moveRightT() {
    if (tBusy || !tPiece) return;
    if (!collAt(tPiece.s, tPiece.x + 1, tPiece.y)) {
        tPiece.x++;
        sfxClick();
        drawT();
        doVibrate(10);
    }
}

function rotateT() {
    if (tBusy || !tPiece) return;
    const rotated = tPiece.s[0].map((_, i) => tPiece.s.map(r => r[i]).reverse());
    const kicks = [0, -1, 1, -2, 2];
    for (const offset of kicks) {
        if (!collAt(rotated, tPiece.x + offset, tPiece.y)) {
            tPiece.s = rotated;
            tPiece.x += offset;
            sfxPop();
            drawT();
            doVibrate(15);
            return;
        }
    }
}

function dropT() { stepT(); }

// ==================== УПРАВЛЕНИЕ СВАЙПАМИ ПО ПОЛЮ ====================
let tStartX = 0, tStartY = 0, tLastX = 0, tLastY = 0, tStartTime = 0, tGestureMoved = false;

tCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    tStartX = tLastX = touch.clientX;
    tStartY = tLastY = touch.clientY;
    tStartTime = Date.now();
    tGestureMoved = false;
}, { passive: false });

tCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (tBusy || !tPiece || !e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const dx = touch.clientX - tLastX;
    const dy = touch.clientY - tLastY;
    const totalDx = Math.abs(touch.clientX - tStartX);
    const totalDy = Math.abs(touch.clientY - tStartY);

    if (Math.abs(dx) >= 22) {
        const steps = Math.trunc(dx / 22);
        for (let i = 0; i < Math.abs(steps); i++) {
            if (steps > 0) moveRightT();
            else moveLeftT();
        }
        tLastX += steps * 22;
        tGestureMoved = true;
    }

    if (dy >= 28 && totalDy > totalDx * 1.3) {
        stepT();
        tLastY = touch.clientY;
        tGestureMoved = true;
    }
}, { passive: false });

tCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (tBusy || !tPiece) return;
    const touch = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
    if (!touch) return;

    const totalDx = touch.clientX - tStartX;
    const totalDy = touch.clientY - tStartY;
    const dt = Date.now() - tStartTime;

    if (totalDy > 55 && Math.abs(totalDy) > Math.abs(totalDx) * 1.5 && dt < 320) {
        hardDropT();
        return;
    }

    if (!tGestureMoved && Math.abs(totalDx) < 14 && Math.abs(totalDy) < 14 && dt < 280) {
        rotateT();
    }
}, { passive: false });
