// ==================== ШАХМАТЫ (БОТ 3 УРОВНЯ + НА ДВОИХ + ОНЛАЙН) ====================
function injectChessStyles() {
    if (document.getElementById('chess-auto-styles')) return;
    const style = document.createElement('style');
    style.id = 'chess-auto-styles';
    style.textContent = `
        #chess-screen .top-bar .btn { white-space: nowrap; }
        .chess-board {
            width: min(88vw, 360px);
            height: min(88vw, 360px);
            aspect-ratio: 1 / 1;
            display: grid !important;
            grid-template-columns: repeat(8, 1fr) !important;
            grid-template-rows: repeat(8, 1fr) !important;
            border: 2px solid var(--accent, #38bdf8);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 0 22px rgba(56, 189, 248, 0.25);
            margin: 6px auto;
            user-select: none;
            flex-shrink: 0;
        }
        .chess-cell {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: clamp(1.45rem, 6.2vw, 1.95rem);
            cursor: pointer;
            transition: background 0.12s;
            overflow: hidden;
        }
        .chess-board.cboard_default .chess-cell.light { background: #1e293b; }
        .chess-board.cboard_default .chess-cell.dark  { background: #0f172a; }

        .chess-board.cboard_emerald { border-color: #4ade80; box-shadow: 0 0 22px rgba(74, 222, 128, 0.28); }
        .chess-board.cboard_emerald .chess-cell.light { background: #2d6a4f; }
        .chess-board.cboard_emerald .chess-cell.dark  { background: #1b4332; }

        .chess-board.cboard_marble { border-color: #cbd5e1; box-shadow: 0 0 22px rgba(226, 232, 240, 0.25); }
        .chess-board.cboard_marble .chess-cell.light { background: #475569; }
        .chess-board.cboard_marble .chess-cell.dark  { background: #1e293b; }

        .chess-board.cboard_gold { border-color: #fbbf24; box-shadow: 0 0 24px rgba(251, 191, 36, 0.35); }
        .chess-board.cboard_gold .chess-cell.light { background: #78350f; }
        .chess-board.cboard_gold .chess-cell.dark  { background: #271506; }

        .chess-board.cboard_cyber { border-color: #e879f9; box-shadow: 0 0 24px rgba(232, 121, 249, 0.35); }
        .chess-board.cboard_cyber .chess-cell.light { background: #3b0764; }
        .chess-board.cboard_cyber .chess-cell.dark  { background: #140826; }

        .chess-cell.selected { background: rgba(56, 189, 248, 0.45) !important; }
        .chess-cell.last-move { box-shadow: inset 0 0 0 2px rgba(251, 191, 36, 0.65); }
        .chess-cell.in-check { background: rgba(239, 68, 68, 0.6) !important; }

        .chess-cell.valid-move::after {
            content: '';
            width: 28%;
            height: 28%;
            border-radius: 50%;
            background: rgba(74, 222, 128, 0.85);
            box-shadow: 0 0 8px #4ade80;
            pointer-events: none;
        }
        .chess-cell.valid-capture::after {
            content: '';
            position: absolute;
            inset: 3px;
            border-radius: 50%;
            border: 3px solid rgba(244, 63, 94, 0.9);
            pointer-events: none;
        }
        .chess-piece-w {
            position: relative;
            color: #ffffff;
            text-shadow: 0 0 8px rgba(56, 189, 248, 0.95), 0 2px 3px rgba(0,0,0,0.95);
            line-height: 1;
        }
        .chess-piece-b {
            position: relative;
            color: #fb7185;
            text-shadow: 0 0 8px rgba(244, 63, 94, 0.85), 0 2px 3px rgba(0,0,0,0.95);
            line-height: 1;
        }
        .cacc_aura {
            filter: drop-shadow(0 0 6px #38bdf8) drop-shadow(0 0 12px #e879f9);
        }
        .cacc_runes::before {
            content: '';
            position: absolute;
            inset: -3px;
            border-radius: 50%;
            border: 1.5px dashed rgba(251, 191, 36, 0.8);
            pointer-events: none;
        }
        .cacc_crown::after {
            content: '👑';
            position: absolute;
            top: -9px;
            right: -7px;
            font-size: 0.62rem;
            filter: drop-shadow(0 1px 2px #000);
            pointer-events: none;
        }
        @keyframes capFlashAnim {
            0%   { transform: scale(1.18); filter: brightness(2.2); }
            100% { transform: scale(1); filter: brightness(1); }
        }
        .cap-flash-lightning { background: #38bdf8 !important; animation: capFlashAnim 0.35s ease-out; }
        .cap-flash-fire      { background: #f97316 !important; animation: capFlashAnim 0.35s ease-out; }
        .cap-flash-ice       { background: #bae6fd !important; animation: capFlashAnim 0.35s ease-out; }
        .cap-flash-explosion { background: #4ade80 !important; animation: capFlashAnim 0.42s ease-out; }
    `;
    document.head.appendChild(style);
}
injectChessStyles();

const CHESS_SYMBOLS = {
    K: '♔\uFE0E', Q: '♕\uFE0E', R: '♖\uFE0E', B: '♗\uFE0E', N: '♘\uFE0E', P: '♙\uFE0E',
    k: '♚\uFE0E', q: '♛\uFE0E', r: '♜\uFE0E', b: '♝\uFE0E', n: '♞\uFE0E', p: '♟\uFE0E'
};

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const PST_PAWN = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
];

const PST_KNIGHT = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];

const PST_CENTER = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
];

let chessState = null;
let chessAiTimer = null;
let chessOnlinePollTimer = null;
let pendingPromoMove = null;
let isSyncingOnlineMove = false;

function encodeChessBoard(board) {
    let s = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            s += board[r][c] || '.';
        }
    }
    return s;
}

function decodeChessBoard(str) {
    if (!str || typeof str !== 'string' || str.length !== 64) return createInitialChessBoard();
    const b = [];
    for (let r = 0; r < 8; r++) {
        const row = [];
        for (let c = 0; c < 8; c++) {
            const ch = str[r * 8 + c];
            row.push(ch === '.' ? null : ch);
        }
        b.push(row);
    }
    return b;
}

function openChess() {
    if (typeof isUserBanned !== 'undefined' && isUserBanned) return;
    injectChessStyles();
    if (typeof activeDuel !== 'undefined' && activeDuel) {
        activeDuel = null;
        if (typeof updateDuelLiveBanner === 'function') updateDuelLiveBanner();
    }
    sfxClick();
    showScreen('chess-screen');
    startNewChessGame();
}

function stopChess() {
    if (chessAiTimer) {
        clearTimeout(chessAiTimer);
        chessAiTimer = null;
    }
    if (chessOnlinePollTimer) {
        clearInterval(chessOnlinePollTimer);
        chessOnlinePollTimer = null;
    }
    const promo = document.getElementById('chess-promo-modal');
    if (promo) promo.classList.remove('active');
}

function createInitialChessBoard() {
    return [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];
}

function configureChessTopControls(isOnline) {
    const modeSel = document.getElementById('chess-mode-select');
    const resetBtn = document.getElementById('chess-reset-btn');
    const onlineTag = document.getElementById('chess-online-tag');
    const undoBtn = document.getElementById('chess-undo-btn');
    const resignBtn = document.getElementById('chess-resign-btn');

    if (modeSel) modeSel.style.display = isOnline ? 'none' : 'inline-block';
    if (resetBtn) resetBtn.style.display = isOnline ? 'none' : 'inline-flex';
    if (onlineTag) onlineTag.style.display = isOnline ? 'inline-block' : 'none';
    if (undoBtn) undoBtn.style.display = isOnline ? 'none' : 'inline-flex';
    if (resignBtn) resignBtn.style.display = isOnline ? 'inline-flex' : 'none';
}

function startNewChessGame() {
    injectChessStyles();
    stopChess();
    configureChessTopControls(false);

    const resOverlay = document.getElementById('chess-result-overlay');
    if (resOverlay) resOverlay.classList.remove('active');

    const modeSelect = document.getElementById('chess-mode-select');
    const mode = modeSelect ? modeSelect.value : 'medium';

    chessState = {
        board: createInitialChessBoard(),
        turn: 'w',
        mode: mode,
        myColor: 'w',
        selected: null,
        legalMoves: [],
        lastMove: null,
        castling: { wK: true, wQ: true, bK: true, bQ: true },
        epTarget: null,
        history: [],
        capturedW: [],
        capturedB: [],
        gameOver: false,
        aiThinking: false
    };

    renderChessBoard();
    updateChessStatus();
}

// ==================== ОНЛАЙН-ШАХМАТЫ (ПОШАГОВАЯ ПАРТИЯ) ====================
function startNewOnlineChess(duelObj) {
    injectChessStyles();
    stopChess();
    configureChessTopControls(true);
    if (typeof updateDuelLiveBanner === 'function') updateDuelLiveBanner();

    const onlineTag = document.getElementById('chess-online-tag');
    if (onlineTag) {
        onlineTag.innerText = `⚔️ vs ${duelObj.toName}`;
    }

    const resOverlay = document.getElementById('chess-result-overlay');
    if (resOverlay) resOverlay.classList.remove('active');

    chessState = {
        board: createInitialChessBoard(),
        turn: 'w',
        mode: 'online',
        myColor: 'w',
        duelId: duelObj.id,
        moveCount: 0,
        selected: null,
        legalMoves: [],
        lastMove: null,
        castling: { wK: true, wQ: true, bK: true, bQ: true },
        epTarget: null,
        history: [],
        capturedW: [],
        capturedB: [],
        gameOver: false,
        aiThinking: false
    };

    renderChessBoard();
    updateChessStatus();
}

async function openOnlineChessMatch(duelId) {
    injectChessStyles();
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    try {
        const res = await fetch(`${baseUrl}/duels/${duelId}.json?t=${Date.now()}`, { cache: 'no-store' });
        const duel = await res.json();
        if (!duel || duel.game !== 'chess') {
            alert('Партия не найдена!');
            return;
        }

        const isCreator = duel.fromId === myPlayerId;
        const myColor = isCreator ? 'w' : 'b';

        if (!isCreator && duel.status === 'chess_active' && !duel.acceptedByOpponent) {
            const bet = Number(duel.bet) || 0;
            if (bet > 0) {
                if (getGems() < bet) {
                    sfxAlarm();
                    doVibrate(120);
                    spawnFloatText(window.innerWidth / 2, window.innerHeight / 2, `💎 Нужно ${bet} 💎 для принятия!`, '#ef4444');
                    return;
                }
                addGems(-bet);
            }
            await fetch(`${baseUrl}/duels/${duelId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acceptedByOpponent: true })
            });
            duel.acceptedByOpponent = true;
        }

        activeDuel = {
            ...duel,
            role: isCreator ? 'creator' : 'opponent',
            myColor: myColor,
            isFirstMove: false
        };

        document.getElementById('main-menu').style.display = 'none';
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
        document.getElementById('chess-screen').style.display = 'flex';

        stopChess();
        configureChessTopControls(true);
        if (typeof updateDuelLiveBanner === 'function') updateDuelLiveBanner();

        const oppName = isCreator ? duel.toName : duel.fromName;
        const onlineTag = document.getElementById('chess-online-tag');
        if (onlineTag) onlineTag.innerText = `⚔️ vs ${oppName}`;

        const resOverlay = document.getElementById('chess-result-overlay');
        if (resOverlay) resOverlay.classList.remove('active');

        chessState = {
            board: decodeChessBoard(duel.boardStr),
            turn: duel.turn || 'w',
            mode: 'online',
            myColor: myColor,
            duelId: duel.id,
            moveCount: Number(duel.moveCount) || 1,
            selected: null,
            legalMoves: [],
            lastMove: duel.lastMove || null,
            castling: duel.castling || { wK: true, wQ: true, bK: true, bQ: true },
            epTarget: duel.epTarget || null,
            history: [],
            capturedW: (duel.capturedWStr || '').split('').filter(Boolean),
            capturedB: (duel.capturedBStr || '').split('').filter(Boolean),
            gameOver: duel.status === 'finished',
            aiThinking: false
        };

        renderChessBoard();
        updateChessStatus();

        if (duel.status === 'finished') {
            showFinishedOnlineChessResult(duel);
            return;
        }

        chessOnlinePollTimer = setInterval(pollOnlineChessState, 4000);
    } catch {
        alert('Ошибка загрузки партии!');
    }
}

async function pollOnlineChessState() {
    if (!chessState || chessState.mode !== 'online' || chessState.gameOver || isSyncingOnlineMove) return;
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    try {
        const res = await fetch(`${baseUrl}/duels/${chessState.duelId}.json?t=${Date.now()}`, { cache: 'no-store' });
        const duel = await res.json();
        if (!duel) return;

        const remoteMoves = Number(duel.moveCount) || 0;
        if (remoteMoves > chessState.moveCount || duel.status === 'finished') {
            chessState.board = decodeChessBoard(duel.boardStr);
            chessState.turn = duel.turn || chessState.turn;
            chessState.moveCount = remoteMoves;
            chessState.lastMove = duel.lastMove || null;
            chessState.castling = duel.castling || chessState.castling;
            chessState.epTarget = duel.epTarget || null;
            chessState.capturedW = (duel.capturedWStr || '').split('').filter(Boolean);
            chessState.capturedB = (duel.capturedBStr || '').split('').filter(Boolean);
            chessState.selected = null;
            chessState.legalMoves = [];

            sfxPop();
            doVibrate(35);
            renderChessBoard();

            if (duel.status === 'finished') {
                chessState.gameOver = true;
                stopChess();
                updateChessStatus();
                showFinishedOnlineChessResult(duel);
            } else {
                updateChessStatus();
            }
        }
    } catch {}
}

function showFinishedOnlineChessResult(duel) {
    const overlay = document.getElementById('chess-result-overlay');
    const titleEl = document.getElementById('chess-res-title');
    const subEl = document.getElementById('chess-res-sub');
    const badgeEl = document.getElementById('chess-res-badge');
    if (!overlay || !titleEl) return;

    const bet = Number(duel.bet) || 0;
    const bank = bet * 2;
    const oppName = duel.fromId === myPlayerId ? duel.toName : duel.fromName;

    if (duel.winnerId === myPlayerId) {
        sfxVictory();
        spawnConfettiCannon(true);
        spawnConfettiCannon(false);
        titleEl.innerText = '👑 ПОБЕДА В ОНЛАЙН-ШАХМАТАХ!';
        titleEl.style.color = '#4ade80';
        subEl.innerText = duel.resignedBy ? `${oppName} сдался!` : `Ты поставил мат игроку ${oppName}!`;
        badgeEl.innerText = bank > 0 ? `Банк: +${bank} 💎` : 'Чистая победа!';
    } else if (duel.winnerId === 'draw') {
        sfxPop();
        titleEl.innerText = '🤝 НИЧЬЯ (ПАТ)';
        titleEl.style.color = '#38bdf8';
        subEl.innerText = `Партия с ${oppName} завершилась вничью.`;
        badgeEl.innerText = bet > 0 ? `Ставка ${bet} 💎 возвращена` : 'Ничья';
    } else {
        sfxExplosion();
        titleEl.innerText = '💀 ПОРАЖЕНИЕ';
        titleEl.style.color = '#ef4444';
        subEl.innerText = duel.resignedBy === myPlayerId ? 'Ты сдался в этой партии.' : `${oppName} поставил тебе мат!`;
        badgeEl.innerText = bank > 0 ? `Банк ${bank} 💎 достался сопернику` : 'Возьми реванш в Дуэлях!';
    }

    overlay.classList.add('active');
}

async function resignOnlineChess() {
    if (!chessState || chessState.mode !== 'online' || !activeDuel) return;
    if (activeDuel.isFirstMove) {
        if (!confirm('Отменить создание вызова? Гемы не спишутся.')) return;
        activeDuel = null;
        if (typeof updateDuelLiveBanner === 'function') updateDuelLiveBanner();
        openDuels('create');
        return;
    }

    if (!confirm('Сдаться в этой партии? Ставка достанется сопернику!')) return;
    sfxExplosion();
    isSyncingOnlineMove = true;

    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    const oppId = activeDuel.fromId === myPlayerId ? activeDuel.toId : activeDuel.fromId;

    try {
        await fetch(`${baseUrl}/duels/${chessState.duelId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'finished',
                winnerId: oppId,
                resignedBy: myPlayerId,
                payoutClaimed: false,
                finishedAt: Date.now()
            })
        });
    } catch {}

    isSyncingOnlineMove = false;
    chessState.gameOver = true;
    stopChess();
    activeDuel = null;
    if (typeof updateDuelLiveBanner === 'function') updateDuelLiveBanner();
    openDuels('history');
}

// ==================== ЛОГИКА ПРАВИЛ ШАХМАТ ====================
function pieceColor(p) {
    if (!p) return null;
    return p === p.toUpperCase() ? 'w' : 'b';
}

function cloneBoard(b) {
    return b.map(row => row.slice());
}

function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isSquareAttacked(board, targetR, targetC, byColor) {
    const pawnDir = byColor === 'w' ? 1 : -1;
    const enemyPawn = byColor === 'w' ? 'P' : 'p';
    for (const dc of [-1, 1]) {
        const pr = targetR + pawnDir, pc = targetC + dc;
        if (inBounds(pr, pc) && board[pr][pc] === enemyPawn) return true;
    }

    const enemyKnight = byColor === 'w' ? 'N' : 'n';
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = targetR + dr, nc = targetC + dc;
        if (inBounds(nr, nc) && board[nr][nc] === enemyKnight) return true;
    }

    const enemyKing = byColor === 'w' ? 'K' : 'k';
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const kr = targetR + dr, kc = targetC + dc;
            if (inBounds(kr, kc) && board[kr][kc] === enemyKing) return true;
        }
    }

    const enemyRook = byColor === 'w' ? 'R' : 'r';
    const enemyQueen = byColor === 'w' ? 'Q' : 'q';
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        let r = targetR + dr, c = targetC + dc;
        while (inBounds(r, c)) {
            const p = board[r][c];
            if (p) {
                if (p === enemyRook || p === enemyQueen) return true;
                break;
            }
            r += dr; c += dc;
        }
    }

    const enemyBishop = byColor === 'w' ? 'B' : 'b';
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        let r = targetR + dr, c = targetC + dc;
        while (inBounds(r, c)) {
            const p = board[r][c];
            if (p) {
                if (p === enemyBishop || p === enemyQueen) return true;
                break;
            }
            r += dr; c += dc;
        }
    }

    return false;
}

function findKing(board, color) {
    const kChar = color === 'w' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === kChar) return { r, c };
        }
    }
    return null;
}

function isKingInCheck(board, color) {
    const kPos = findKing(board, color);
    if (!kPos) return false;
    return isSquareAttacked(board, kPos.r, kPos.c, color === 'w' ? 'b' : 'w');
}

function generatePseudoMoves(state, color) {
    const moves = [];
    const { board, castling, epTarget } = state;
    const enemy = color === 'w' ? 'b' : 'w';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p || pieceColor(p) !== color) continue;
            const type = p.toLowerCase();

            if (type === 'p') {
                const dir = color === 'w' ? -1 : 1;
                const startRow = color === 'w' ? 6 : 1;
                const promoRow = color === 'w' ? 0 : 7;

                const r1 = r + dir;
                if (inBounds(r1, c) && !board[r1][c]) {
                    moves.push({ fromR: r, fromC: c, toR: r1, toC: c, promo: r1 === promoRow });
                    const r2 = r + dir * 2;
                    if (r === startRow && !board[r2][c]) {
                        moves.push({ fromR: r, fromC: c, toR: r2, toC: c, doublePawn: true });
                    }
                }

                for (const dc of [-1, 1]) {
                    const tc = c + dc;
                    if (!inBounds(r1, tc)) continue;
                    const target = board[r1][tc];
                    if (target && pieceColor(target) === enemy) {
                        moves.push({ fromR: r, fromC: c, toR: r1, toC: tc, promo: r1 === promoRow });
                    } else if (epTarget && epTarget.r === r1 && epTarget.c === tc) {
                        moves.push({ fromR: r, fromC: c, toR: r1, toC: tc, enPassant: true });
                    }
                }
            } else if (type === 'n') {
                for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
                    const nr = r + dr, nc = c + dc;
                    if (inBounds(nr, nc) && pieceColor(board[nr][nc]) !== color) {
                        moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
                    }
                }
            } else if (type === 'b' || type === 'r' || type === 'q') {
                const dirs = [];
                if (type === 'r' || type === 'q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
                if (type === 'b' || type === 'q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
                for (const [dr, dc] of dirs) {
                    let nr = r + dr, nc = c + dc;
                    while (inBounds(nr, nc)) {
                        const target = board[nr][nc];
                        if (!target) {
                            moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
                        } else {
                            if (pieceColor(target) === enemy) {
                                moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
                            }
                            break;
                        }
                        nr += dr; nc += dc;
                    }
                }
            } else if (type === 'k') {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr, nc = c + dc;
                        if (inBounds(nr, nc) && pieceColor(board[nr][nc]) !== color) {
                            moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
                        }
                    }
                }

                const homeRow = color === 'w' ? 7 : 0;
                if (r === homeRow && c === 4 && !isSquareAttacked(board, homeRow, 4, enemy)) {
                    const canK = color === 'w' ? castling.wK : castling.bK;
                    const canQ = color === 'w' ? castling.wQ : castling.bQ;
                    const rookChar = color === 'w' ? 'R' : 'r';

                    if (canK && board[homeRow][7] === rookChar && !board[homeRow][5] && !board[homeRow][6]) {
                        if (!isSquareAttacked(board, homeRow, 5, enemy) && !isSquareAttacked(board, homeRow, 6, enemy)) {
                            moves.push({ fromR: homeRow, fromC: 4, toR: homeRow, toC: 6, castle: 'K' });
                        }
                    }
                    if (canQ && board[homeRow][0] === rookChar && !board[homeRow][1] && !board[homeRow][2] && !board[homeRow][3]) {
                        if (!isSquareAttacked(board, homeRow, 3, enemy) && !isSquareAttacked(board, homeRow, 2, enemy)) {
                            moves.push({ fromR: homeRow, fromC: 4, toR: homeRow, toC: 2, castle: 'Q' });
                        }
                    }
                }
            }
        }
    }
    return moves;
}

function applyMoveToState(state, move, promoChoice = 'q') {
    const board = cloneBoard(state.board);
    const castling = { ...state.castling };
    const piece = board[move.fromR][move.fromC];
    const color = pieceColor(piece);
    let captured = board[move.toR][move.toC];

    if (move.enPassant) {
        captured = board[move.fromR][move.toC];
        board[move.fromR][move.toC] = null;
    }

    board[move.toR][move.toC] = piece;
    board[move.fromR][move.fromC] = null;

    if (move.promo) {
        const pChar = color === 'w' ? promoChoice.toUpperCase() : promoChoice.toLowerCase();
        board[move.toR][move.toC] = pChar;
    }

    if (move.castle === 'K') {
        board[move.fromR][5] = board[move.fromR][7];
        board[move.fromR][7] = null;
    } else if (move.castle === 'Q') {
        board[move.fromR][3] = board[move.fromR][0];
        board[move.fromR][0] = null;
    }

    if (piece === 'K') { castling.wK = false; castling.wQ = false; }
    if (piece === 'k') { castling.bK = false; castling.bQ = false; }
    if (move.fromR === 7 && move.fromC === 0) castling.wQ = false;
    if (move.fromR === 7 && move.fromC === 7) castling.wK = false;
    if (move.fromR === 0 && move.fromC === 0) castling.bQ = false;
    if (move.fromR === 0 && move.fromC === 7) castling.bK = false;
    if (move.toR === 7 && move.toC === 0) castling.wQ = false;
    if (move.toR === 7 && move.toC === 7) castling.wK = false;
    if (move.toR === 0 && move.toC === 0) castling.bQ = false;
    if (move.toR === 0 && move.toC === 7) castling.bK = false;

    const epTarget = move.doublePawn ? { r: (move.fromR + move.toR) / 2, c: move.fromC } : null;

    return {
        board,
        turn: color === 'w' ? 'b' : 'w',
        castling,
        epTarget,
        captured
    };
}

function getAllLegalMoves(state, color) {
    const pseudo = generatePseudoMoves(state, color);
    return pseudo.filter(m => {
        const next = applyMoveToState(state, m, 'q');
        return !isKingInCheck(next.board, color);
    });
}

// ==================== ЭФФЕКТЫ ВЗЯТИЯ ИЗ МАГАЗИНА ====================
function triggerChessCaptureEffect(toR, toC) {
    const boardEl = document.getElementById('chess-board');
    if (!boardEl) return;

    const flip = chessState && chessState.mode === 'online' && chessState.myColor === 'b';
    const visR = flip ? 7 - toR : toR;
    const visC = flip ? 7 - toC : toC;
    const cellIdx = visR * 8 + visC;
    const cellEl = boardEl.children[cellIdx];

    const fxType = typeof getEquippedChessFx === 'function' ? getEquippedChessFx() : 'cfx_default';
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (cellEl) {
        const rect = cellEl.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
        cellEl.classList.remove('cap-flash-lightning', 'cap-flash-fire', 'cap-flash-ice', 'cap-flash-explosion');
        void cellEl.offsetWidth;
        if (fxType === 'cfx_lightning') cellEl.classList.add('cap-flash-lightning');
        else if (fxType === 'cfx_fire') cellEl.classList.add('cap-flash-fire');
        else if (fxType === 'cfx_ice') cellEl.classList.add('cap-flash-ice');
        else if (fxType === 'cfx_explosion') cellEl.classList.add('cap-flash-explosion');
    }

    if (typeof spawnBurst === 'function') {
        if (fxType === 'cfx_lightning') {
            spawnBurst(x, y, 26, ['#38bdf8', '#e0f2fe', '#facc15'], 1.3);
            if (typeof spawnFloatText === 'function') spawnFloatText(x, y - 10, '⚡', '#38bdf8');
        } else if (fxType === 'cfx_fire') {
            spawnBurst(x, y, 28, ['#f97316', '#ef4444', '#fbbf24'], 1.3);
            if (typeof spawnFloatText === 'function') spawnFloatText(x, y - 10, '🔥', '#f97316');
        } else if (fxType === 'cfx_ice') {
            spawnBurst(x, y, 26, ['#bae6fd', '#38bdf8', '#ffffff'], 1.2);
            if (typeof spawnFloatText === 'function') spawnFloatText(x, y - 10, '❄️', '#bae6fd');
        } else if (fxType === 'cfx_explosion') {
            spawnBurst(x, y, 36, ['#4ade80', '#a855f7', '#fbbf24'], 1.5);
            if (typeof triggerShake === 'function') triggerShake(false);
            if (typeof spawnFloatText === 'function') spawnFloatText(x, y - 10, '☢️ BOOM!', '#4ade80');
        } else {
            spawnBurst(x, y, 14, ['#fb7185', '#fbbf24'], 0.9);
        }
    }
}

// ==================== ХОД ИГРОКА И СИНХРОНИЗАЦИЯ ====================
function onChessCellClick(r, c) {
    if (!chessState || chessState.gameOver || chessState.aiThinking || isSyncingOnlineMove) return;
    if (chessState.mode !== 'pvp' && chessState.mode !== 'online' && chessState.turn === 'b') return;
    if (chessState.mode === 'online' && chessState.turn !== chessState.myColor) return;

    const clickedPiece = chessState.board[r][c];
    const clickedColor = pieceColor(clickedPiece);

    const chosenMove = chessState.legalMoves.find(m => m.toR === r && m.toC === c);
    if (chosenMove) {
        if (chosenMove.promo) {
            pendingPromoMove = chosenMove;
            const promoModal = document.getElementById('chess-promo-modal');
            if (promoModal) promoModal.classList.add('active');
            sfxPop();
            return;
        }
        executeChessMove(chosenMove, 'q');
        return;
    }

    if (clickedColor === chessState.turn) {
        const allMoves = getAllLegalMoves(chessState, chessState.turn);
        const pieceMoves = allMoves.filter(m => m.fromR === r && m.fromC === c);
        chessState.selected = { r, c };
        chessState.legalMoves = pieceMoves;
        sfxClick();
        renderChessBoard();
    } else {
        chessState.selected = null;
        chessState.legalMoves = [];
        renderChessBoard();
    }
}

function chooseChessPromotion(pieceType) {
    const promoModal = document.getElementById('chess-promo-modal');
    if (promoModal) promoModal.classList.remove('active');
    if (!pendingPromoMove) return;
    const mv = pendingPromoMove;
    pendingPromoMove = null;
    executeChessMove(mv, pieceType);
}

async function executeChessMove(move, promoChoice = 'q') {
    chessState.history.push({
        board: cloneBoard(chessState.board),
        turn: chessState.turn,
        castling: { ...chessState.castling },
        epTarget: chessState.epTarget ? { ...chessState.epTarget } : null,
        lastMove: chessState.lastMove ? { ...chessState.lastMove } : null,
        capturedW: chessState.capturedW.slice(),
        capturedB: chessState.capturedB.slice()
    });

    const next = applyMoveToState(chessState, move, promoChoice);
    chessState.board = next.board;
    chessState.turn = next.turn;
    chessState.castling = next.castling;
    chessState.epTarget = next.epTarget;
    chessState.lastMove = { fromR: move.fromR, fromC: move.fromC, toR: move.toR, toC: move.toC };
    chessState.selected = null;
    chessState.legalMoves = [];

    if (next.captured) {
        if (pieceColor(next.captured) === 'w') chessState.capturedW.push(next.captured);
        else chessState.capturedB.push(next.captured);
        sfxPop();
        doVibrate(25);
    } else {
        sfxClick();
    }

    renderChessBoard();
    if (next.captured) {
        triggerChessCaptureEffect(move.toR, move.toC);
    }

    const nextLegal = getAllLegalMoves(chessState, chessState.turn);
    const inCheck = isKingInCheck(chessState.board, chessState.turn);

    if (chessState.mode === 'online' && activeDuel) {
        await pushOnlineChessMove(nextLegal.length === 0, inCheck);
        return;
    }

    if (nextLegal.length === 0) {
        chessState.gameOver = true;
        updateChessStatus();
        handleChessGameEnd(inCheck);
        return;
    }

    if (inCheck) {
        sfxFlag();
        doVibrate(45);
    }

    updateChessStatus();

    if (!chessState.gameOver && chessState.mode !== 'pvp' && chessState.turn === 'b') {
        chessState.aiThinking = true;
        updateChessStatus();
        chessAiTimer = setTimeout(() => {
            chessAiTimer = null;
            makeChessAiMove();
        }, 280);
    }
}

async function pushOnlineChessMove(isGameEnd, isCheck) {
    isSyncingOnlineMove = true;
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    const duel = activeDuel;

    if (duel.isFirstMove) {
        const bet = Number(duel.bet) || 0;
        if (bet > 0) {
            if (getGems() < bet) {
                alert('Недостаточно кристаллов для ставки!');
                isSyncingOnlineMove = false;
                backToMenu();
                return;
            }
            addGems(-bet);
        }
        duel.isFirstMove = false;
    }

    chessState.moveCount = (chessState.moveCount || 0) + 1;
    const nextTurnId = chessState.turn === 'w' ? duel.fromId : duel.toId;

    const bet = Number(duel.bet) || 0;
    const bank = bet * 2;
    let status = 'chess_active';
    let winnerId = null;
    let payoutClaimed = false;

    if (isGameEnd) {
        chessState.gameOver = true;
        status = 'finished';
        if (isCheck) {
            winnerId = myPlayerId;
            payoutClaimed = true;
            if (bank > 0) addGems(bank);
            if (typeof addGems === 'function') addGems(25);
        } else {
            winnerId = 'draw';
            payoutClaimed = false;
            if (bet > 0) addGems(bet);
        }
    } else if (isCheck) {
        sfxFlag();
        doVibrate(45);
    }

    const payload = {
        id: duel.id,
        game: 'chess',
        bet: bet,
        fromId: duel.fromId,
        fromName: duel.fromName,
        fromTag: duel.fromTag,
        toId: duel.toId,
        toName: duel.toName,
        toTag: duel.toTag,
        status: status,
        turn: chessState.turn,
        currentTurnId: nextTurnId,
        moveCount: chessState.moveCount,
        acceptedByOpponent: duel.acceptedByOpponent || duel.role === 'opponent',
        boardStr: encodeChessBoard(chessState.board),
        castling: chessState.castling,
        epTarget: chessState.epTarget,
        lastMove: chessState.lastMove,
        capturedWStr: chessState.capturedW.join(''),
        capturedBStr: chessState.capturedB.join(''),
        winnerId: winnerId,
        payoutClaimed: payoutClaimed,
        createdAt: duel.createdAt || Date.now(),
        updatedAt: Date.now()
    };

    try {
        await fetch(`${baseUrl}/duels/${duel.id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (chessState.moveCount === 1 && typeof sendDuelTelegramNotification === 'function') {
            const betStr = bet > 0 ? `\nСтавка: <b>${bet} 💎</b> (банк ${bank} 💎)` : '';
            sendDuelTelegramNotification(
                duel.toId,
                `♟️ <b>Вызов в Онлайн-Шахматы!</b>\n\nИгрок <b>${duel.fromName}</b> сделал первый ход и ждёт тебя!${betStr}\n\nЗаходи в Game Hub → ⚔️ Дуэли!`
            );
        }
    } catch {}

    isSyncingOnlineMove = false;
    updateChessStatus();

    if (isGameEnd) {
        stopChess();
        showFinishedOnlineChessResult({ ...payload, winnerId });
    } else if (!chessOnlinePollTimer) {
        chessOnlinePollTimer = setInterval(pollOnlineChessState, 4000);
    }
}

function undoChessMove() {
    if (!chessState || chessState.mode === 'online' || chessState.aiThinking || chessState.history.length === 0) return;
    sfxClick();

    let steps = 1;
    if (chessState.mode !== 'pvp' && chessState.turn === 'w' && chessState.history.length >= 2) {
        steps = 2;
    }

    let snap = null;
    for (let i = 0; i < steps; i++) {
        if (chessState.history.length > 0) snap = chessState.history.pop();
    }
    if (!snap) return;

    chessState.board = snap.board;
    chessState.turn = snap.turn;
    chessState.castling = snap.castling;
    chessState.epTarget = snap.epTarget;
    chessState.lastMove = snap.lastMove;
    chessState.capturedW = snap.capturedW;
    chessState.capturedB = snap.capturedB;
    chessState.selected = null;
    chessState.legalMoves = [];
    chessState.gameOver = false;

    const resOverlay = document.getElementById('chess-result-overlay');
    if (resOverlay) resOverlay.classList.remove('active');

    renderChessBoard();
    updateChessStatus();
}

// ==================== ИИ ШАХМАТНОГО БОТА ====================
function evaluateChessBoard(board) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p) continue;
            const isW = p === p.toUpperCase();
            const type = p.toLowerCase();
            const base = PIECE_VALUES[type] || 0;
            const tableR = isW ? r : 7 - r;

            let pos = 0;
            if (type === 'p') pos = PST_PAWN[tableR][c];
            else if (type === 'n') pos = PST_KNIGHT[tableR][c];
            else if (type === 'b' || type === 'q') pos = PST_CENTER[tableR][c];

            score += isW ? (base + pos) : -(base + pos);
        }
    }
    return score;
}

function minimaxChess(state, depth, alpha, beta, isMax) {
    const color = isMax ? 'w' : 'b';
    const moves = getAllLegalMoves(state, color);

    if (moves.length === 0) {
        if (isKingInCheck(state.board, color)) {
            return isMax ? (-99999 - depth) : (99999 + depth);
        }
        return 0;
    }

    if (depth === 0) {
        return evaluateChessBoard(state.board);
    }

    moves.sort((a, b) => {
        const capA = state.board[a.toR][a.toC] ? 1 : 0;
        const capB = state.board[b.toR][b.toC] ? 1 : 0;
        return capB - capA;
    });

    if (isMax) {
        let best = -Infinity;
        for (const m of moves) {
            const next = applyMoveToState(state, m, 'q');
            const val = minimaxChess(next, depth - 1, alpha, beta, false);
            if (val > best) best = val;
            if (best > alpha) alpha = best;
            if (beta <= alpha) break;
        }
        return best;
    } else {
        let best = Infinity;
        for (const m of moves) {
            const next = applyMoveToState(state, m, 'q');
            const val = minimaxChess(next, depth - 1, alpha, beta, true);
            if (val < best) best = val;
            if (best < beta) beta = best;
            if (beta <= alpha) break;
        }
        return best;
    }
}

function makeChessAiMove() {
    if (!chessState || chessState.gameOver) return;
    const moves = getAllLegalMoves(chessState, 'b');
    chessState.aiThinking = false;

    if (moves.length === 0) {
        chessState.gameOver = true;
        handleChessGameEnd(isKingInCheck(chessState.board, 'b'));
        return;
    }

    let chosen = moves[0];

    if (chessState.mode === 'easy') {
        if (Math.random() < 0.65) {
            chosen = moves[Math.floor(Math.random() * moves.length)];
        } else {
            let bestVal = Infinity;
            for (const m of moves) {
                const next = applyMoveToState(chessState, m, 'q');
                const val = evaluateChessBoard(next.board) + (Math.random() * 40 - 20);
                if (val < bestVal) { bestVal = val; chosen = m; }
            }
        }
    } else {
        const depth = chessState.mode === 'hard' ? 3 : 2;
        let bestVal = Infinity;
        let bestList = [];

        for (const m of moves) {
            const next = applyMoveToState(chessState, m, 'q');
            const val = minimaxChess(next, depth - 1, -Infinity, Infinity, true);
            if (val < bestVal) {
                bestVal = val;
                bestList = [m];
            } else if (val === bestVal) {
                bestList.push(m);
            }
        }
        chosen = bestList[Math.floor(Math.random() * bestList.length)] || moves[0];
    }

    executeChessMove(chosen, 'q');
}

// ==================== ЗАВЕРШЕНИЕ И ОТРИСОВКА ====================
function handleChessGameEnd(isCheckmate) {
    const overlay = document.getElementById('chess-result-overlay');
    const titleEl = document.getElementById('chess-res-title');
    const subEl = document.getElementById('chess-res-sub');
    const badgeEl = document.getElementById('chess-res-badge');
    if (!overlay || !titleEl) return;

    const winner = chessState.turn === 'w' ? 'b' : 'w';
    const vip = typeof isVipUser === 'function' && isVipUser();
    const mult = vip && typeof VIP_GEM_MULT !== 'undefined' ? VIP_GEM_MULT : 1;

    if (!isCheckmate) {
        sfxPop();
        titleEl.innerText = '🤝 НИЧЬЯ (ПАТ)';
        titleEl.style.color = '#38bdf8';
        subEl.innerText = 'Ходов больше нет, но король не под шахом.';
        badgeEl.innerText = 'Партия завершена вничью';
    } else if (chessState.mode === 'pvp') {
        sfxVictory();
        spawnConfettiCannon(true);
        spawnConfettiCannon(false);
        titleEl.innerText = winner === 'w' ? '🏆 ПОБЕДА БЕЛЫХ!' : '🏆 ПОБЕДА ЧЁРНЫХ!';
        titleEl.style.color = '#fbbf24';
        subEl.innerText = 'Отличный мат в игре на двоих!';
        badgeEl.innerText = 'Режим на 2 игроков';
    } else if (winner === 'w') {
        const baseReward = chessState.mode === 'hard' ? 50 : chessState.mode === 'medium' ? 30 : 15;
        const shownReward = baseReward * mult;
        if (typeof addGems === 'function') addGems(baseReward);

        sfxVictory();
        doVibrate([50, 30, 90]);
        spawnConfettiCannon(true);
        spawnConfettiCannon(false);

        const diffNames = { easy: 'Новичок', medium: 'Любитель', hard: 'Мастер' };
        titleEl.innerText = '👑 ШАХ И МАТ! ПОБЕДА';
        titleEl.style.color = '#4ade80';
        subEl.innerText = `Ты обыграл бота (${diffNames[chessState.mode]})!`;
        badgeEl.innerText = `Награда: +${shownReward} 💎${vip ? ' (👑 VIP ×2)' : ''}`;
    } else {
        sfxExplosion();
        triggerShake(true);
        doVibrate(160);
        titleEl.innerText = '💀 ТЕБЕ ПОСТАВИЛИ МАТ';
        titleEl.style.color = '#ef4444';
        subEl.innerText = 'Попробуй ещё раз или смени тактику!';
        badgeEl.innerText = 'Поражение';
    }

    overlay.classList.add('active');
}

function updateChessStatus() {
    const statusEl = document.getElementById('chess-status-text');
    const capWEl = document.getElementById('chess-cap-w');
    const capBEl = document.getElementById('chess-cap-b');
    if (!statusEl || !chessState) return;

    if (capWEl) capWEl.innerText = chessState.capturedW.map(p => CHESS_SYMBOLS[p]).join('');
    if (capBEl) capBEl.innerText = chessState.capturedB.map(p => CHESS_SYMBOLS[p]).join('');

    if (chessState.gameOver) {
        statusEl.innerText = '🏁 Партия окончена';
        statusEl.style.color = '#fbbf24';
        return;
    }
    if (chessState.aiThinking) {
        statusEl.innerText = '🤖 Бот обдумывает ход...';
        statusEl.style.color = '#38bdf8';
        return;
    }

    const inCheck = isKingInCheck(chessState.board, chessState.turn);

    if (chessState.mode === 'online') {
        const isMyTurn = chessState.turn === chessState.myColor;
        const sideLabel = chessState.myColor === 'w' ? '⚪ Белые' : '🔴 Чёрные';
        if (isMyTurn) {
            statusEl.innerText = inCheck ? `⚠️ ШАХ! Твой ход (${sideLabel})` : `🟢 Твой ход (${sideLabel})`;
            statusEl.style.color = inCheck ? '#fbbf24' : '#4ade80';
        } else {
            statusEl.innerText = `⏳ Ход соперника...`;
            statusEl.style.color = '#94a3b8';
        }
        return;
    }

    const turnLabel = chessState.turn === 'w' ? '⚪ Ход белых' : (chessState.mode === 'pvp' ? '🔴 Ход чёрных' : '🤖 Ход бота');
    statusEl.innerText = inCheck ? `⚠️ ШАХ! ${turnLabel}` : turnLabel;
    statusEl.style.color = inCheck ? '#fbbf24' : '#e2e8f0';
}

function renderChessBoard() {
    injectChessStyles();
    const boardEl = document.getElementById('chess-board');
    if (!boardEl || !chessState) return;

    const boardSkin = typeof getEquippedChessBoard === 'function' ? getEquippedChessBoard() : 'cboard_default';
    boardEl.className = 'chess-board ' + boardSkin;
    boardEl.innerHTML = '';

    const accType = typeof getEquippedChessAcc === 'function' ? getEquippedChessAcc() : 'cacc_none';
    const flip = chessState.mode === 'online' && chessState.myColor === 'b';

    const wKing = isKingInCheck(chessState.board, 'w') ? findKing(chessState.board, 'w') : null;
    const bKing = isKingInCheck(chessState.board, 'b') ? findKing(chessState.board, 'b') : null;

    for (let visR = 0; visR < 8; visR++) {
        for (let visC = 0; visC < 8; visC++) {
            const r = flip ? 7 - visR : visR;
            const c = flip ? 7 - visC : visC;

            const cell = document.createElement('div');
            const isLight = (r + c) % 2 === 0;
            cell.className = 'chess-cell ' + (isLight ? 'light' : 'dark');

            if (chessState.selected && chessState.selected.r === r && chessState.selected.c === c) {
                cell.classList.add('selected');
            }
            if (chessState.lastMove && (
                (chessState.lastMove.fromR === r && chessState.lastMove.fromC === c) ||
                (chessState.lastMove.toR === r && chessState.lastMove.toC === c)
            )) {
                cell.classList.add('last-move');
            }
            if ((wKing && wKing.r === r && wKing.c === c) || (bKing && bKing.r === r && bKing.c === c)) {
                cell.classList.add('in-check');
            }

            const moveHint = chessState.legalMoves.find(m => m.toR === r && m.toC === c);
            if (moveHint) {
                cell.classList.add(chessState.board[r][c] || moveHint.enPassant ? 'valid-capture' : 'valid-move');
            }

            const p = chessState.board[r][c];
            if (p) {
                const span = document.createElement('span');
                const isW = pieceColor(p) === 'w';
                span.className = (isW ? 'chess-piece-w' : 'chess-piece-b') + (accType !== 'cacc_none' ? ' ' + accType : '');
                span.innerText = CHESS_SYMBOLS[p];
                cell.appendChild(span);
            }

            cell.onclick = () => onChessCellClick(r, c);
            boardEl.appendChild(cell);
        }
    }
}
