const aimArena = document.getElementById('aim-arena');

let aimActive = false;
let aimStarted = false;
let aimScore = 0;
let aimCombo = 1;
let aimMaxCombo = 1;
let aimHits = 0;
let aimClicks = 0;
let aimTimeLeft = 30.0;
let aimLastFrame = 0;
let aimSpawnTimer = 0;
let aimRafId = null;
let aimTargets = [];
let aimNextId = 1;

function getAimRng() {
    return (typeof activeDuel !== 'undefined' && activeDuel && activeDuel.game === 'aim' && typeof duelRng === 'function')
        ? duelRng
        : Math.random;
}

function stopAim() {
    aimActive = false;
    aimStarted = false;
    if (aimRafId) {
        cancelAnimationFrame(aimRafId);
        aimRafId = null;
    }
    aimTargets = [];
    if (aimArena) aimArena.innerHTML = '';
}

function initAim() {
    stopAim();
    document.getElementById('aim-result-overlay').classList.remove('active');

    aimActive = true;
    aimStarted = false;
    aimScore = 0;
    aimCombo = 1;
    aimMaxCombo = 1;
    aimHits = 0;
    aimClicks = 0;
    aimTimeLeft = 30.0;
    aimSpawnTimer = 0;

    updateAimHud();
    spawnStartTarget();
}

function closeAimOverlayAndRestart() {
    document.getElementById('aim-result-overlay').classList.remove('active');
    initAim();
}

function updateAimHud() {
    const timeEl = document.getElementById('aim-time');
    const scoreEl = document.getElementById('aim-score');
    const comboEl = document.getElementById('aim-combo');
    const accEl = document.getElementById('aim-acc');
    const bestEl = document.getElementById('aim-best');

    if (timeEl) {
        timeEl.innerText = Math.max(0, aimTimeLeft).toFixed(1) + 'с';
        timeEl.style.color = aimTimeLeft <= 5 && aimStarted ? '#ef4444' : '#ffffff';
    }
    if (scoreEl) scoreEl.innerText = aimScore;
    if (comboEl) {
        comboEl.innerText = '×' + aimCombo;
        comboEl.style.color = aimCombo >= 4 ? '#fbbf24' : aimCombo >= 2 ? '#4ade80' : '#94a3b8';
    }
    const acc = aimClicks > 0 ? Math.round((aimHits / aimClicks) * 100) : 100;
    if (accEl) accEl.innerText = acc + '%';
    if (bestEl && typeof hubRecords !== 'undefined') bestEl.innerText = hubRecords.aim || 0;
}

function spawnStartTarget() {
    if (!aimArena) return;
    aimArena.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'aim-target is-start';
    el.innerHTML = '<span>🎯</span><small>СТАРТ</small>';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.dataset.tid = 'start';
    aimArena.appendChild(el);
}

function startAimRound(e) {
    aimStarted = true;
    aimLastFrame = performance.now();
    aimSpawnTimer = 0;
    if (aimArena) aimArena.innerHTML = '';

    sfxVictory();
    doVibrate(35);
    const cx = e ? e.clientX : window.innerWidth / 2;
    const cy = e ? e.clientY : window.innerHeight / 2;
    spawnBurst(cx, cy, 24, ['#38bdf8', '#4ade80', '#fbbf24']);
    spawnFloatText(cx, cy - 20, '🔥 ПОГНАЛИ!', '#38bdf8');

    spawnAimTarget();
    spawnAimTarget();
    aimRafId = requestAnimationFrame(aimGameLoop);
}

function spawnAimTarget() {
    if (!aimActive || !aimStarted || !aimArena) return;
    if (aimTargets.length >= 4) return;

    const rng = getAimRng();
    const w = aimArena.clientWidth || 300;
    const h = aimArena.clientHeight || 380;

    const roll = rng();
    let type = 'normal';
    let size = 48;
    let life = 1.75;
    let icon = '🎯';

    if (roll < 0.14 && aimTargets.filter(t => t.type === 'bomb').length === 0) {
        type = 'bomb';
        size = 44;
        life = 1.45;
        icon = '💣';
    } else if (roll < 0.25) {
        type = 'bonus';
        size = 40;
        life = 1.35;
        icon = '⏱';
    } else if (roll < 0.52) {
        type = 'moving';
        size = 44;
        life = 2.1;
        icon = '⚡';
    }

    const pad = size / 2 + 10;
    let x = pad + rng() * Math.max(10, w - pad * 2);
    let y = pad + rng() * Math.max(10, h - pad * 2);

    for (let attempt = 0; attempt < 6; attempt++) {
        const tooClose = aimTargets.some(t => Math.hypot(t.x - x, t.y - y) < 58);
        if (!tooClose) break;
        x = pad + rng() * Math.max(10, w - pad * 2);
        y = pad + rng() * Math.max(10, h - pad * 2);
    }

    const angle = rng() * Math.PI * 2;
    const speed = type === 'moving' ? (95 + rng() * 65) : 0;

    const el = document.createElement('div');
    el.className = `aim-target is-${type}`;
    el.innerText = icon;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    const id = aimNextId++;
    el.dataset.tid = String(id);
    aimArena.appendChild(el);

    aimTargets.push({
        id,
        type,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        life,
        maxLife: life,
        el
    });
}

function removeAimTarget(id) {
    const idx = aimTargets.findIndex(t => t.id === id);
    if (idx === -1) return;
    const [t] = aimTargets.splice(idx, 1);
    if (t && t.el && t.el.parentNode) t.el.remove();
}

function aimGameLoop(now) {
    if (!aimActive || !aimStarted) return;

    const dt = Math.min(0.1, (now - aimLastFrame) / 1000);
    aimLastFrame = now;

    aimTimeLeft -= dt;
    if (aimTimeLeft <= 0) {
        aimTimeLeft = 0;
        updateAimHud();
        finishAimRound();
        return;
    }

    aimSpawnTimer -= dt;
    const desiredInterval = aimTimeLeft < 10 ? 0.42 : 0.55;
    if (aimSpawnTimer <= 0) {
        spawnAimTarget();
        aimSpawnTimer = desiredInterval;
    }

    const w = aimArena.clientWidth || 300;
    const h = aimArena.clientHeight || 380;

    for (let i = aimTargets.length - 1; i >= 0; i--) {
        const t = aimTargets[i];
        t.life -= dt;
        if (t.life <= 0) {
            if (t.type !== 'bomb' && aimCombo > 1) {
                aimCombo = 1;
            }
            removeAimTarget(t.id);
            continue;
        }

        if (t.type === 'moving') {
            t.x += t.vx * dt;
            t.y += t.vy * dt;
            const r = t.size / 2 + 4;
            if (t.x < r) { t.x = r; t.vx = Math.abs(t.vx); }
            if (t.x > w - r) { t.x = w - r; t.vx = -Math.abs(t.vx); }
            if (t.y < r) { t.y = r; t.vy = Math.abs(t.vy); }
            if (t.y > h - r) { t.y = h - r; t.vy = -Math.abs(t.vy); }
            t.el.style.left = t.x + 'px';
            t.el.style.top = t.y + 'px';
        }

        const scale = 0.55 + 0.45 * (t.life / t.maxLife);
        t.el.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
    }

    updateAimHud();
    aimRafId = requestAnimationFrame(aimGameLoop);
}

if (aimArena) {
    aimArena.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (!aimActive) return;
        if (e.isTrusted === false) return;

        const targetEl = e.target.closest('.aim-target');

        if (!aimStarted) {
            if (targetEl && targetEl.dataset.tid === 'start') {
                startAimRound(e);
            }
            return;
        }

        aimClicks++;
        const cx = e.clientX || window.innerWidth / 2;
        const cy = e.clientY || window.innerHeight / 2;

        if (!targetEl) {
            aimCombo = 1;
            if (typeof ensureAudio === 'function' && typeof playTone === 'function') {
                ensureAudio();
                playTone(170, 0.06, 'sine', 0.1 * (audioPrefs?.sfxVol || 0.7), 110);
            }
            doVibrate(10);
            spawnFloatText(cx, cy - 12, 'МИМО', '#94a3b8');
            updateAimHud();
            return;
        }

        const tid = Number(targetEl.dataset.tid);
        const tObj = aimTargets.find(t => t.id === tid);
        if (!tObj) return;

        removeAimTarget(tid);

        if (tObj.type === 'bomb') {
            aimCombo = 1;
            aimScore = Math.max(0, aimScore - 200);
            sfxExplosion();
            triggerShake(true);
            doVibrate([80, 40, 80]);
            spawnBurst(cx, cy, 26, ['#ef4444', '#f97316', '#ffffff'], 1.2);
            spawnFloatText(cx, cy - 18, '💥 -200!', '#ef4444');
            updateAimHud();
            spawnAimTarget();
            return;
        }

        aimHits++;
        const basePts = tObj.type === 'bonus' ? 250 : tObj.type === 'moving' ? 180 : 100;
        const pts = basePts * aimCombo;
        aimScore += pts;

        if (aimCombo < 5) aimCombo++;
        if (aimCombo > aimMaxCombo) aimMaxCombo = aimCombo;

        if (tObj.type === 'bonus') {
            aimTimeLeft = Math.min(45, aimTimeLeft + 1.5);
            sfxVictory();
            doVibrate(35);
            spawnBurst(cx, cy, 24, ['#4ade80', '#e879f9', '#ffffff'], 1.15);
            spawnFloatText(cx, cy - 18, `+${pts} • +1.5с ⏱`, '#4ade80');
        } else if (tObj.type === 'moving') {
            sfxMatch(aimCombo + 2);
            doVibrate(22);
            spawnBurst(cx, cy, 18, ['#fbbf24', '#f97316', '#ffffff']);
            spawnFloatText(cx, cy - 16, `+${pts} ⚡`, '#fbbf24');
        } else {
            sfxPop();
            doVibrate(15);
            spawnBurst(cx, cy, 14, ['#38bdf8', '#a855f7', '#ffffff']);
            spawnFloatText(cx, cy - 16, `+${pts}`, '#38bdf8');
        }

        updateAimHud();
        if (aimTargets.length < 2) spawnAimTarget();
    });
}

function finishAimRound() {
    aimActive = false;
    aimStarted = false;
    if (aimArena) aimArena.innerHTML = '';

    const acc = aimClicks > 0 ? Math.round((aimHits / aimClicks) * 100) : 0;
    const accBonus = (acc >= 75 && aimScore > 0) ? Math.round(aimScore * (acc / 250)) : 0;
    const finalScore = aimScore + accBonus;

    if (typeof activeDuel !== 'undefined' && activeDuel && activeDuel.game === 'aim') {
        setTimeout(() => finishDuelAttempt(finalScore, false), 300);
        return;
    }

    sfxVictory();
    doVibrate([60, 40, 120]);
    spawnConfettiCannon(true);
    spawnConfettiCannon(false);

    const isNewBest = updateRecord('aim', finalScore);
    const earnedGems = finalScore >= 300 ? Math.max(2, Math.floor(finalScore / 300)) : 0;
    if (earnedGems > 0 && typeof addGems === 'function') addGems(earnedGems);

    const subText = accBonus > 0
        ? `Счёт: ${finalScore} (бонус точности +${accBonus}) • Точность: ${acc}%`
        : `Счёт: ${finalScore} • Точность: ${acc}% • Макс. комбо: ×${aimMaxCombo}`;

    document.getElementById('aim-res-sub').innerText = earnedGems > 0
        ? `${subText} • +${earnedGems} 💎`
        : subText;

    document.getElementById('aim-res-badge').innerText = isNewBest
        ? `🔥 НОВЫЙ РЕКОРД: ${hubRecords.aim}!`
        : `🏆 Лучший рекорд: ${hubRecords.aim}`;

    document.getElementById('aim-res-share').onclick = () => {
        sfxClick();
        shareGameScore(`🎯 Я набил ${finalScore} очков с точностью ${acc}% в Cyber Aim (мой рекорд: ${hubRecords.aim}) в Game Hub! Попробуй побить!`);
    };

    setTimeout(() => {
        document.getElementById('aim-result-overlay').classList.add('active');
    }, 220);
}
