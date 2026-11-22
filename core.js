// ==================== СИСТЕМА ОБНОВЛЕНИЙ ====================
const APP_VERSION = '2.2';
const CHANGELOG = [
    '⚙️ Все настройки (стиль, музыка и игры) объединены в одно меню с вкладками',
    '🤍 Добавлен стиль «Минимализм» без неона и СДВГ-эффектов',
    '🧪 Добавлена «Зомби-лаборатория» с хардкор-событиями',
    '🎵 Встроенная библиотека музыки (4 трека + эффекты)'
];

function initUpdateBadge() {
    const badge = document.getElementById('update-badge');
    if (!badge) return;
    let seen = null;
    try { seen = localStorage.getItem('gameHubSeenVersion'); } catch {}
    if (seen !== APP_VERSION) {
        badge.innerText = 'NEW ' + APP_VERSION;
        badge.classList.add('has-new');
    } else {
        badge.innerText = 'v' + APP_VERSION;
        badge.classList.remove('has-new');
    }
}

function openUpdateModal() {
    document.getElementById('update-modal-title').innerText = 'ОБНОВЛЕНИЕ v' + APP_VERSION;
    document.getElementById('changelog-list').innerHTML = CHANGELOG.map(item => `<li>${item}</li>`).join('');
    document.getElementById('update-modal').classList.add('active');
}

function closeUpdateModal() {
    document.getElementById('update-modal').classList.remove('active');
    try { localStorage.setItem('gameHubSeenVersion', APP_VERSION); } catch {}
    initUpdateBadge();
}

initUpdateBadge();

// ==================== TELEGRAM MINI APP ====================
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
}

// ==================== ЕДИНЫЕ НАСТРОЙКИ ====================
function openSettings(tab = 'style') {
    showScreen('settings-screen');
    renderTrackList();
    document.getElementById('bgm-vol').value = Math.round(audioPrefs.bgmVol * 100);
    document.getElementById('sfx-vol').value = Math.round(audioPrefs.sfxVol * 100);
    document.getElementById('bgm-vol-val').innerText = Math.round(audioPrefs.bgmVol * 100) + '%';
    document.getElementById('sfx-vol-val').innerText = Math.round(audioPrefs.sfxVol * 100) + '%';
    switchSettingsTab(tab, true);
}

function switchSettingsTab(tab, silent = false) {
    if (!silent) sfxClick();
    ['style', 'music', 'games'].forEach(t => {
        document.getElementById('stab-' + t).classList.toggle('active', t === tab);
        document.getElementById('pane-' + t).classList.toggle('active', t === tab);
    });
}

// ==================== АУДИО ДВИЖОК ====================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null, bgmTimer = null, bgmStep = 0;

const MUSIC_TRACKS = [
    { id: 'techno',    title: '⚡ Cyber Techno',    desc: '132 BPM • Плотный бас и драйв' },
    { id: 'synthwave', title: '🌃 Neon Synthwave',  desc: '112 BPM • Ретро-арпеджио 80-х' },
    { id: 'chiptune',  title: '👾 8-Bit Arcade',    desc: '140 BPM • Классика приставок' },
    { id: 'lofi',      title: '🌙 Chill Beat',      desc: '88 BPM • Спокойный бит для фокуса' },
    { id: 'none',      title: '🔇 Без музыки',      desc: 'Только звуковые эффекты' }
];

let audioPrefs = loadAudioPrefs();

function loadAudioPrefs() {
    try { const raw = localStorage.getItem('gameHubAudio'); if (raw) return JSON.parse(raw); } catch {}
    return { track: 'techno', bgmVol: 0.4, sfxVol: 0.75 };
}
function saveAudioPrefs() {
    try { localStorage.setItem('gameHubAudio', JSON.stringify(audioPrefs)); } catch {}
}
function ensureAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playTone(freq, dur, type = 'sine', vol = 0.2, slideTo = null) {
    if (!audioCtx || vol <= 0.001) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + dur + 0.02);
}
function playNoise(dur, vol = 0.15, highpass = 1000) {
    if (!audioCtx || vol <= 0.001) return;
    const bufferSize = Math.floor(audioCtx.sampleRate * dur);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = highpass;
    const gain = audioCtx.createGain(), now = audioCtx.currentTime;
    gain.gain.setValueAtTime(vol, now); gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); noise.start(now);
}

function sfxClick() { ensureAudio(); playTone(520, 0.06, 'triangle', 0.16 * audioPrefs.sfxVol, 780); }
function sfxPop() { ensureAudio(); playTone(360, 0.08, 'sine', 0.18 * audioPrefs.sfxVol, 620); }
function sfxFlag() { ensureAudio(); playTone(680, 0.07, 'square', 0.1 * audioPrefs.sfxVol, 920); }
function sfxMatch(combo = 1) {
    ensureAudio();
    const base = 440 * Math.pow(1.06, Math.min(combo, 12));
    playTone(base, 0.12, 'triangle', 0.22 * audioPrefs.sfxVol);
    setTimeout(() => playTone(base * 1.25, 0.16, 'sine', 0.22 * audioPrefs.sfxVol), 65);
}
function sfxExplosion() {
    ensureAudio();
    playTone(130, 0.45, 'sawtooth', 0.35 * audioPrefs.sfxVol, 28);
    playNoise(0.4, 0.32 * audioPrefs.sfxVol, 180);
}
function sfxLineClear(lines = 1) {
    ensureAudio();
    const notes = lines > 1 ? [523, 659, 784, 1046] : [440, 554, 659];
    notes.forEach((n, idx) => setTimeout(() => playTone(n, 0.15, 'square', 0.14 * audioPrefs.sfxVol), idx * 55));
}
function sfxVictory() {
    ensureAudio();
    [523.25, 659.25, 783.99, 1046.5].forEach((n, idx) =>
        setTimeout(() => playTone(n, idx === 3 ? 0.45 : 0.16, 'triangle', 0.24 * audioPrefs.sfxVol), idx * 95)
    );
}
function sfxShuffle() {
    ensureAudio();
    [300, 420, 560, 480].forEach((n, idx) => setTimeout(() => playTone(n, 0.07, 'sine', 0.14 * audioPrefs.sfxVol), idx * 40));
}
function sfxAlarm() {
    ensureAudio();
    playTone(880, 0.16, 'sawtooth', 0.18 * audioPrefs.sfxVol, 440);
    setTimeout(() => playTone(880, 0.16, 'sawtooth', 0.18 * audioPrefs.sfxVol, 440), 200);
}

function startBgm() {
    stopBgm();
    if (audioPrefs.track === 'none' || audioPrefs.bgmVol <= 0.01) return;
    ensureAudio(); bgmStep = 0;
    const bpmMap = { techno: 132, synthwave: 112, chiptune: 140, lofi: 88 };
    const stepMs = (60000 / (bpmMap[audioPrefs.track] || 120)) / 4;

    bgmTimer = setInterval(() => {
        if (!audioCtx || audioCtx.state !== 'running') return;
        const v = audioPrefs.bgmVol * 0.28, s = bgmStep % 16;

        if (audioPrefs.track === 'techno') {
            if (s % 4 === 0) playTone(125, 0.13, 'sine', v * 1.4, 38);
            if (s % 4 === 2) playNoise(0.04, v * 0.35, 6500);
            const bass = [55, 0, 55, 65.4, 55, 0, 73.4, 65.4, 55, 0, 55, 82.4, 73.4, 0, 65.4, 0];
            if (bass[s]) playTone(bass[s], 0.11, 'sawtooth', v * 0.55);
            if (s === 0 || s === 6 || s === 12) playTone(220 * (s === 12 ? 1.5 : 1), 0.09, 'square', v * 0.22);
        } else if (audioPrefs.track === 'synthwave') {
            if (s === 0 || s === 8) playTone(110, 0.14, 'sine', v * 1.2, 42);
            if (s === 4 || s === 12) playNoise(0.09, v * 0.4, 1500);
            const arp = [220, 261.6, 329.6, 392, 220, 261.6, 329.6, 440, 174.6, 220, 261.6, 349.2, 196, 246.9, 293.6, 392];
            playTone(arp[s], 0.14, 'triangle', v * 0.45);
            if (s % 4 === 0) playTone(arp[s] / 2, 0.25, 'sawtooth', v * 0.3);
        } else if (audioPrefs.track === 'chiptune') {
            const mel = [523, 0, 659, 784, 0, 659, 523, 392, 440, 0, 523, 659, 587, 0, 493, 0];
            const bas = [130, 130, 196, 196, 130, 130, 196, 196, 110, 110, 164, 164, 146, 146, 196, 196];
            if (mel[s]) playTone(mel[s], 0.09, 'square', v * 0.32);
            if (s % 2 === 0) playTone(bas[s], 0.08, 'triangle', v * 0.45);
        } else if (audioPrefs.track === 'lofi') {
            if (s === 0 || s === 10) playTone(95, 0.16, 'sine', v * 1.0, 40);
            if (s === 4 || s === 12) playNoise(0.07, v * 0.25, 2200);
            if (s === 0) { playTone(261.6, 0.6, 'sine', v * 0.3); playTone(329.6, 0.6, 'sine', v * 0.25); playTone(392, 0.6, 'sine', v * 0.2); }
            if (s === 8) { playTone(220, 0.6, 'sine', v * 0.3); playTone(261.6, 0.6, 'sine', v * 0.25); playTone(329.6, 0.6, 'sine', v * 0.2); }
        }
        bgmStep++;
    }, stepMs);
}
function stopBgm() { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } }

function renderTrackList() {
    const list = document.getElementById('track-list'); list.innerHTML = '';
    MUSIC_TRACKS.forEach(tr => {
        const isAct = audioPrefs.track === tr.id;
        const el = document.createElement('div');
        el.className = 'track-card' + (isAct ? ' active' : '');
        el.innerHTML = `<div class="track-info"><div class="track-title">${tr.title}</div><div class="track-desc">${tr.desc}</div></div><div class="track-status">${isAct ? '🔊' : '▶️'}</div>`;
        el.onclick = () => { audioPrefs.track = tr.id; saveAudioPrefs(); sfxClick(); startBgm(); renderTrackList(); };
        list.appendChild(el);
    });
}
function updateAudioSettings() {
    const bv = parseInt(document.getElementById('bgm-vol').value), sv = parseInt(document.getElementById('sfx-vol').value);
    audioPrefs.bgmVol = bv / 100; audioPrefs.sfxVol = sv / 100;
    document.getElementById('bgm-vol-val').innerText = bv + '%';
    document.getElementById('sfx-vol-val').innerText = sv + '%';
    saveAudioPrefs();
    if (bv === 0) stopBgm(); else if (!bgmTimer && audioPrefs.track !== 'none') startBgm();
}

let audioUnlocked = false;
window.addEventListener('pointerdown', (e) => {
    spawnBurst(e.clientX, e.clientY, 10);
    if (!audioUnlocked) {
        audioUnlocked = true; ensureAudio();
        if (audioPrefs.track !== 'none') startBgm();
    }
});

// ==================== АНИМАЦИИ И ЖИВОЙ ФОН ====================
const bgCanvas = document.getElementById('bg-canvas'), bgCtx = bgCanvas.getContext('2d');
const fxCanvas = document.getElementById('fx-canvas'), fxCtx = fxCanvas.getContext('2d');
let particles = [], floatTexts = [], bgOrbs = [], bgStars = [], gridOffset = 0, victoryFxTimer = null;
let currentStyleMode = 'neon';

function isMinimalMode() { return currentStyleMode === 'minimal'; }

function resizeCanvases() {
    bgCanvas.width = fxCanvas.width = window.innerWidth;
    bgCanvas.height = fxCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvases);
resizeCanvases();

for (let i = 0; i < 18; i++) bgOrbs.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, r: 18 + Math.random() * 45, vx: (Math.random() - 0.5) * 1.4, vy: (Math.random() - 0.5) * 1.4, hue: Math.random() * 360 });
for (let i = 0; i < 70; i++) bgStars.push({ x: (Math.random() - 0.5) * window.innerWidth, y: (Math.random() - 0.5) * window.innerHeight, z: Math.random() * 800 + 100 });

function getAdhdMode() {
    if (isMinimalMode()) return 'off';
    return document.getElementById('adhd-level').value;
}
function spawnBurst(x, y, count = 16, colors = null, power = 1) {
    if (getAdhdMode() === 'off') return;
    const palette = colors || ['#38bdf8', '#f472b6', '#fbbf24', '#4ade80', '#a855f7', '#ffffff'];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2, speed = (2 + Math.random() * 6.5) * power;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5 * power, size: (3 + Math.random() * 5.5) * Math.min(power, 1.4), color: palette[Math.floor(Math.random() * palette.length)], alpha: 1, decay: 0.016 + Math.random() * 0.02, shape: Math.random() > 0.35 ? 'square' : 'circle', rot: Math.random() * Math.PI });
    }
}
function spawnConfettiCannon(fromLeft) {
    if (getAdhdMode() === 'off') return;
    const x = fromLeft ? 10 : window.innerWidth - 10, y = window.innerHeight - 20;
    const palette = ['#fbbf24', '#4ade80', '#38bdf8', '#f472b6', '#a855f7', '#ffffff', '#fb7185'];
    for (let i = 0; i < 34; i++) {
        const spread = fromLeft ? (-Math.PI / 2.2) + (Math.random() - 0.3) * 0.75 : (-Math.PI / 1.8) - (Math.random() - 0.3) * 0.75;
        const speed = 9 + Math.random() * 9;
        particles.push({ x, y, vx: Math.cos(spread) * speed, vy: Math.sin(spread) * speed, size: 5 + Math.random() * 7, color: palette[Math.floor(Math.random() * palette.length)], alpha: 1, decay: 0.011 + Math.random() * 0.012, shape: 'square', rot: Math.random() * Math.PI });
    }
}
function spawnFloatText(x, y, text, color = '#fbbf24') {
    if (getAdhdMode() === 'off') return;
    floatTexts.push({ x, y, text, color, alpha: 1, vy: -2.1 });
}
function triggerShake(big = false) {
    if (getAdhdMode() !== 'max') return;
    const cls = big ? 'shake-lg' : 'shake-sm';
    document.body.classList.remove('shake-sm', 'shake-lg');
    void document.body.offsetWidth;
    document.body.classList.add(cls);
}

function renderLoop() {
    if (!isMinimalMode()) {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        const bgEffect = document.getElementById('bg-effect-select').value;
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

        if (bgEffect === 'orbs') {
            bgOrbs.forEach(o => {
                o.x += o.vx; o.y += o.vy; o.hue = (o.hue + 0.4) % 360;
                if (o.x < -60) o.x = bgCanvas.width + 60; if (o.x > bgCanvas.width + 60) o.x = -60;
                if (o.y < -60) o.y = bgCanvas.height + 60; if (o.y > bgCanvas.height + 60) o.y = -60;
                const grad = bgCtx.createRadialGradient(o.x, o.y, 2, o.x, o.y, o.r);
                grad.addColorStop(0, `hsla(${o.hue}, 90%, 65%, 0.28)`); grad.addColorStop(1, 'transparent');
                bgCtx.fillStyle = grad; bgCtx.beginPath(); bgCtx.arc(o.x, o.y, o.r, 0, Math.PI * 2); bgCtx.fill();
            });
        } else if (bgEffect === 'stars') {
            const cx = bgCanvas.width / 2, cy = bgCanvas.height / 2;
            bgCtx.fillStyle = accent || '#38bdf8';
            bgStars.forEach(s => {
                s.z -= 4;
                if (s.z <= 10) { s.x = (Math.random() - 0.5) * bgCanvas.width; s.y = (Math.random() - 0.5) * bgCanvas.height; s.z = 800; }
                const k = 250 / s.z, px = cx + s.x * k, py = cy + s.y * k, sz = Math.max(1, (1 - s.z / 800) * 4);
                bgCtx.globalAlpha = 1 - s.z / 800; bgCtx.fillRect(px, py, sz, sz);
            });
            bgCtx.globalAlpha = 1;
        } else if (bgEffect === 'grid') {
            gridOffset = (gridOffset + 0.8) % 40;
            bgCtx.strokeStyle = accent || '#38bdf8'; bgCtx.globalAlpha = 0.14; bgCtx.lineWidth = 1;
            for (let x = 0; x < bgCanvas.width; x += 40) { bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, bgCanvas.height); bgCtx.stroke(); }
            for (let y = gridOffset; y < bgCanvas.height; y += 40) { bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(bgCanvas.width, y); bgCtx.stroke(); }
            bgCtx.globalAlpha = 1;
        }

        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= p.decay; p.rot += 0.14;
            if (p.alpha <= 0) { particles.splice(i, 1); continue; }
            fxCtx.save(); fxCtx.globalAlpha = p.alpha; fxCtx.fillStyle = p.color;
            fxCtx.translate(p.x, p.y); fxCtx.rotate(p.rot);
            if (p.shape === 'circle') { fxCtx.beginPath(); fxCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2); fxCtx.fill(); }
            else { fxCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7); }
            fxCtx.restore();
        }
        for (let i = floatTexts.length - 1; i >= 0; i--) {
            const ft = floatTexts[i];
            ft.y += ft.vy; ft.alpha -= 0.02;
            if (ft.alpha <= 0) { floatTexts.splice(i, 1); continue; }
            fxCtx.save(); fxCtx.globalAlpha = ft.alpha; fxCtx.font = '900 22px Segoe UI, sans-serif';
            fxCtx.textAlign = 'center'; fxCtx.fillStyle = ft.color; fxCtx.shadowColor = ft.color; fxCtx.shadowBlur = 12;
            fxCtx.fillText(ft.text, ft.x, ft.y); fxCtx.restore();
        }
    }
    requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

// ==================== СТИЛЬ И КАСТОМИЗАЦИЯ ====================
function setStyleMode(mode, silent = false) {
    currentStyleMode = mode === 'minimal' ? 'minimal' : 'neon';
    document.body.classList.toggle('minimal-mode', currentStyleMode === 'minimal');
    document.getElementById('style-neon').classList.toggle('active', currentStyleMode === 'neon');
    document.getElementById('style-minimal').classList.toggle('active', currentStyleMode === 'minimal');
    document.getElementById('neon-only-settings').style.display = currentStyleMode === 'minimal' ? 'none' : 'block';
    if (currentStyleMode === 'minimal') {
        particles = []; floatTexts = [];
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    }
    if (!silent) { sfxClick(); saveLobbyPrefs(); }
}

function applyPreset(bg, accent) {
    document.getElementById('bg-picker').value = bg;
    document.getElementById('accent-picker').value = accent;
    updateLobbyColors(); sfxPop();
    spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 28, [accent, '#ffffff', '#fbbf24']);
    doVibrate(30);
}
function updateLobbyColors() {
    const bg = document.getElementById('bg-picker').value, accent = document.getElementById('accent-picker').value;
    document.documentElement.style.setProperty('--bg', bg);
    document.documentElement.style.setProperty('--accent', accent);
    saveLobbyPrefs();
}
function saveLobbyPrefs() {
    try {
        localStorage.setItem('gameHubLobby', JSON.stringify({
            styleMode: currentStyleMode,
            bg: document.getElementById('bg-picker').value,
            accent: document.getElementById('accent-picker').value,
            bgEffect: document.getElementById('bg-effect-select').value,
            adhd: document.getElementById('adhd-level').value
        }));
    } catch {}
}
function loadLobbyPrefs() {
    try {
        const saved = JSON.parse(localStorage.getItem('gameHubLobby') || 'null');
        if (!saved) return;
        document.getElementById('bg-picker').value = saved.bg || '#0f172a';
        document.getElementById('accent-picker').value = saved.accent || '#38bdf8';
        document.getElementById('bg-effect-select').value = saved.bgEffect || 'orbs';
        document.getElementById('adhd-level').value = saved.adhd || 'max';
        document.documentElement.style.setProperty('--bg', saved.bg || '#0f172a');
        document.documentElement.style.setProperty('--accent', saved.accent || '#38bdf8');
        setStyleMode(saved.styleMode || 'neon', true);
    } catch {}
}
loadLobbyPrefs();

// ==================== НАВИГАЦИЯ ====================
function stopAllGames() {
    if (victoryFxTimer) { clearInterval(victoryFxTimer); victoryFxTimer = null; }
    document.getElementById('mj-victory-overlay').classList.remove('active');
    document.getElementById('mines-result-overlay').classList.remove('active');
    if (typeof stopMines === 'function') stopMines();
    if (typeof stopTetris === 'function') stopTetris();
    if (typeof stopZombieLab === 'function') stopZombieLab();
}
function showScreen(id) {
    stopAllGames();
    document.getElementById('main-menu').style.display = 'none';
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
}
function backToMenu() {
    stopAllGames();
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById('main-menu').style.display = 'flex';
}
function doVibrate(ms) {
    if (document.getElementById('vibrate-on').checked && navigator.vibrate) navigator.vibrate(ms);
}
window.oncontextmenu = (e) => { e.preventDefault(); return false; };
