const tCanvas = document.getElementById('tetris-canvas');
const tCtx = tCanvas.getContext('2d');
let tBoard = [], tPiece = null, tScore = 0, tInt = null, tBusy = false;
const T_COLORS = [null, '#38bdf8', '#fbbf24', '#a855f7', '#4ade80', '#ef4444', '#3b82f6', '#f97316'];
const T_SHAPES = [null, [[1,1,1,1]], [[2,2],[2,2]], [[0,3,0],[3,3,3]], [[0,4,4],[4,4,0]], [[5,5,0],[0,5,5]], [[6,0,0],[6,6,6]], [[0,0,7],[7,7,7]]];

function stopTetris() {
    if (tInt) { clearInterval(tInt); tInt = null; }
}

function initTetris() {
    clearInterval(tInt); tBusy = false;
    tScore = 0; tBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
    document.getElementById('tetris-score').innerText = '0';
    const speed = parseInt(document.getElementById('tetris-speed').value);
    spawnT(); drawT();
    tInt = setInterval(stepT, speed);
}

function spawnT() {
    const id = Math.floor(Math.random() * 7) + 1;
    tPiece = { s: T_SHAPES[id], x: 3, y: 0, c: id };
    if (collT()) {
        clearInterval(tInt); sfxExplosion(); triggerShake(true); doVibrate([100, 50, 100]);
        setTimeout(() => { alert('ТЕТРИС: КОНЕЦ ИГРЫ! Счет: ' + tScore); initTetris(); }, 150);
    }
}

function collT() {
    return tPiece.s.some((row, dy) => row.some((v, dx) => {
        let nx = tPiece.x + dx, ny = tPiece.y + dy;
        return v && (nx < 0 || nx >= 10 || ny >= 20 || (ny >= 0 && tBoard[ny][nx]));
    }));
}

async function stepT() {
    if (tBusy || !tPiece) return;
    tPiece.y++;
    if (collT()) {
        tPiece.y--;
        tPiece.s.forEach((row, dy) => row.forEach((v, dx) => { if (v) tBoard[tPiece.y + dy][tPiece.x + dx] = tPiece.c; }));
        sfxPop(); tBusy = true; await clearLinesT(); tBusy = false; spawnT(); doVibrate(25);
    }
    drawT();
}

async function clearLinesT() {
    let fullRows = [];
    for (let y = 0; y < 20; y++) if (tBoard[y].every(v => v !== 0)) fullRows.push(y);
    if (fullRows.length > 0) {
        const rect = tCanvas.getBoundingClientRect();
        sfxLineClear(fullRows.length); doVibrate(90); triggerShake(fullRows.length >= 2);
        fullRows.forEach(y => spawnBurst(rect.left + 100, rect.top + y * 20 + 10, 22));
        const pts = 100 * fullRows.length;
        spawnFloatText(rect.left + 100, rect.top + fullRows[0] * 20, fullRows.length > 1 ? `🔥 COMBO +${pts}!` : `+${pts}!`, '#4ade80');
        for (let i = 0; i < 3; i++) {
            fullRows.forEach(y => { tCtx.fillStyle = 'white'; tCtx.fillRect(0, y * 20, 200, 20); });
            await new Promise(r => setTimeout(r, 40)); drawT(); await new Promise(r => setTimeout(r, 40));
        }
        fullRows.forEach(y => { tBoard.splice(y, 1); tBoard.unshift(Array(10).fill(0)); });
        tScore += pts; document.getElementById('tetris-score').innerText = tScore;
    }
}

function drawT() {
    tCtx.fillStyle = isMinimalMode() ? '#1c1f26' : '#1e293b';
    tCtx.fillRect(0, 0, 200, 400);
    tBoard.forEach((row, y) => row.forEach((v, x) => { if (v) drawBlock(x, y, T_COLORS[v]); }));
    if (tPiece) tPiece.s.forEach((row, dy) => row.forEach((v, dx) => { if (v) drawBlock(tPiece.x + dx, tPiece.y + dy, T_COLORS[tPiece.c]); }));
}

function drawBlock(x, y, color) {
    tCtx.fillStyle = color; tCtx.fillRect(x * 20, y * 20, 19, 19);
    if (!isMinimalMode()) { tCtx.fillStyle = 'rgba(255,255,255,0.28)'; tCtx.fillRect(x * 20, y * 20, 19, 4); }
}

function moveLeftT() { if (tBusy) return; tPiece.x--; if (collT()) tPiece.x++; else sfxClick(); drawT(); doVibrate(10); }
function moveRightT() { if (tBusy) return; tPiece.x++; if (collT()) tPiece.x--; else sfxClick(); drawT(); doVibrate(10); }
function rotateT() {
    if (tBusy) return;
    let old = tPiece.s;
    tPiece.s = tPiece.s[0].map((_, i) => tPiece.s.map(r => r[i]).reverse());
    if (collT()) tPiece.s = old; else sfxPop();
    drawT(); doVibrate(15);
}
function dropT() { stepT(); }
