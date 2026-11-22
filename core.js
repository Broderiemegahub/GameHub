// ==================== СИСТЕМА ОБНОВЛЕНИЙ ====================
const APP_VERSION = '1.2';
const CHANGELOG = [
    '🎧 Полностью переработан звук: добавлены 4 трека в стиле TikTok (Drift Phonk, Sigma Bass, Brazilian Funk, Interstellar)',
    '🔊 Добавлены 808-бас, ковбеллы, эхо и компрессор звука',
    '⚙️ Все настройки объединены в одно меню с вкладками',
    '🤍 Добавлен стиль «Минимализм» без неона'
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

// ==================== ПРОДВИНУТЫЙ АУДИО ДВИЖОК (TIKTOK BEATS + SFX) ====================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null, masterComp = null, delayNode = null, distCurve = null;
let bgmTimer = null, bgmStep = 0;

const MUSIC_TRACKS = [
    { id: 'phonk',  title: '🔥 Drift Phonk (808)',   desc: '145 BPM • Ковбеллы и жёсткий 808-бас' },
    { id: 'sigma',  title: '🕶️ Dark Sigma Bass',    desc: '124 BPM • Атмосферный замедленный бас' },
    { id: 'brazil', title: '🏎️ Brazilian Funk',     desc: '130 BPM • Качающий ритм и саб-дроп' },
    { id: 'space',  title: '🌌 Interstellar Vibe',  desc: '105 BPM • Космическое пианино и эхо' },
    { id: 'none',   title: '🔇 Без музыки',         desc: 'Только звуковые эффекты' }
];

let audioPrefs = loadAudioPrefs();

function loadAudioPrefs() {
    try {
        const raw = localStorage.getItem('gameHubAudio');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (!MUSIC_TRACKS.some(t => t.id === parsed.track)) parsed.track = 'phonk';
            return parsed;
        }
    } catch {}
    return { track: 'phonk', bgmVol: 0.45, sfxVol: 0.75 };
}
function saveAudioPrefs() {
    try { localStorage.setItem('gameHubAudio', JSON.stringify(audioPrefs)); } catch {}
}

function makeDistortionCurve(amount = 28) {
    const samples = 44100, curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}

function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new AudioCtx();
        distCurve = makeDistortionCurve(24);

        masterComp = audioCtx.createDynamicsCompressor();
        masterComp.threshold.value = -14;
        masterComp.knee.value = 12;
        masterComp.ratio.value = 6;
        masterComp.attack.value = 0.004;
        masterComp.release.value = 0.16;
        masterComp.connect(audioCtx.destination);

        delayNode = audioCtx.createDelay(1.0);
        delayNode.delayTime.value = 0.25;
        const fb = audioCtx.createGain();
        fb.gain.value = 0.34;
        const lp = audioCtx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2100;

        delayNode.connect(lp);
        lp.connect(fb);
        fb.connect(delayNode);
        lp.connect(masterComp);
    }
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
    osc.connect(gain); gain.connect(masterComp);
    osc.start(now); osc.stop(now + dur + 0.02);
}

function playNoise(dur, vol = 0.15, filterFreq = 1000, filterType = 'highpass') {
    if (!audioCtx || vol <= 0.001) return;
    const bufferSize = Math.floor(audioCtx.sampleRate * dur);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type = filterType; filter.frequency.value = filterFreq;
    const gain = audioCtx.createGain(), now = audioCtx.currentTime;
    gain.gain.setValueAtTime(vol, now); gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter); filter.connect(gain); gain.connect(masterComp); noise.start(now);
}

// Синтезатор 808-кика с саб-басом (качает даже на динамике телефона)
function play808Kick(vol = 0.45, subFreq = 44, dur = 0.28) {
    if (!audioCtx || vol <= 0.001) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const shaper = audioCtx.createWaveShaper();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, now);
    osc.frequency.exponentialRampToValueAtTime(subFreq, now + 0.065);
    osc.frequency.exponentialRampToValueAtTime(Math.max(28, subFreq * 0.85), now + dur);

    shaper.curve = distCurve;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(shaper); shaper.connect(gain); gain.connect(masterComp);
    osc.start(now); osc.stop(now + dur + 0.02);
}

// Фирменный ковбелл TR-808 для Drift Phonk
function playCowbell(freq, dur = 0.16, vol = 0.25, echo = true) {
    if (!audioCtx || vol <= 0.001) return;
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const bp = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.485, now);

    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(freq * 1.55, now);
    bp.Q.value = 3.2;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc1.connect(bp); osc2.connect(bp);
    bp.connect(gain); gain.connect(masterComp);
    if (echo && delayNode) {
        const send = audioCtx.createGain();
        send.gain.value = 0.28;
        gain.connect(send); send.connect(delayNode);
    }

    osc1.start(now); osc2.start(now);
    osc1.stop(now + dur + 0.02); osc2.stop(now + dur + 0.02);
}

// Синтезатор с плавным фильтром и эхом
function playFilteredSynth(freq, dur, type = 'sawtooth', vol = 0.2, cutStart = 1800, cutEnd = 350, echo = true) {
    if (!audioCtx || vol <= 0.001) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutStart, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, cutEnd), now + dur);
    filter.Q.value = 2.5;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter); filter.connect(gain); gain.connect(masterComp);
    if (echo && delayNode) {
        const send = audioCtx.createGain();
        send.gain.value = 0.35;
        gain.connect(send); send.connect(delayNode);
    }

    osc.start(now); osc.stop(now + dur + 0.03);
}

// --- ЗВУКОВЫЕ ЭФФЕКТЫ (SFX) ---
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

// --- СЕКВЕНСОР ФОНОВОЙ МУЗЫКИ ---
function startBgm() {
    stopBgm();
    if (audioPrefs.track === 'none' || audioPrefs.bgmVol <= 0.01) return;
    ensureAudio(); bgmStep = 0;

    const bpmMap = { phonk: 145, sigma: 124, brazil: 130, space: 105 };
    const stepMs = (60000 / (bpmMap[audioPrefs.track] || 130)) / 4;

    bgmTimer = setInterval(() => {
        if (!audioCtx || audioCtx.state !== 'running') return;
        const v = audioPrefs.bgmVol;
        const s = bgmStep % 32;

        if (audioPrefs.track === 'phonk') {
            // 1. DRIFT PHONK (808 Cowbell + Heavy Sub)
            const cowbellMel = [
                554.37, 0, 554.37, 587.33, 554.37, 0, 493.88, 440.00,
                554.37, 0, 554.37, 739.99, 587.33, 554.37, 493.88, 0,
                554.37, 0, 554.37, 587.33, 554.37, 0, 440.00, 392.00,
                369.99, 0, 440.00, 493.88, 554.37, 0, 493.88, 0
            ];
            if (cowbellMel[s]) playCowbell(cowbellMel[s], 0.17, v * 0.34, true);

            // 808 Kick + Sub
            if ([0, 6, 10, 16, 22, 26].includes(s)) {
                const subNote = s < 16 ? 46.25 : (s < 24 ? 36.71 : 41.20);
                play808Kick(v * 0.65, subNote, 0.32);
            }
            // Trap Snare/Clap
            if (s % 8 === 4) {
                playNoise(0.11, v * 0.28, 1200, 'bandpass');
                playTone(190, 0.08, 'triangle', v * 0.2, 95);
            }
            // Hi-hats + roll
            if (s % 2 === 0 || s === 15 || s === 30 || s === 31) {
                playNoise(0.03, v * 0.12, 7500, 'highpass');
            }
        }
        else if (audioPrefs.track === 'sigma') {
            // 2. DARK SIGMA BASS (Slowed Synthwave / Metamorphosis vibe)
            const bassSeq = [65.41, 65.41, 51.91, 51.91, 43.65, 43.65, 49.00, 49.00];
            const barIdx = Math.floor(s / 4);
            if (s % 2 === 0) {
                playFilteredSynth(bassSeq[barIdx], 0.22, 'sawtooth', v * 0.36, 650, 140, false);
            }
            const leadSeq = [
                523.25, 0, 392.00, 0, 466.16, 0, 392.00, 0,
                415.30, 0, 349.23, 0, 392.00, 0, 311.13, 0,
                523.25, 0, 587.33, 0, 622.25, 0, 587.33, 523.25,
                466.16, 0, 415.30, 0, 392.00, 0, 0, 0
            ];
            if (leadSeq[s]) {
                playFilteredSynth(leadSeq[s], 0.28, 'sawtooth', v * 0.24, 2400, 500, true);
            }
            if (s % 4 === 0) play808Kick(v * 0.55, 42, 0.24);
            if (s % 8 === 4) playNoise(0.15, v * 0.26, 1100, 'highpass');
        }
        else if (audioPrefs.track === 'brazil') {
            // 3. BRAZILIAN FUNK (Синкопированный ритм + саб-дроп)
            if ([0, 3, 6, 8, 11, 14, 16, 19, 22, 24, 27, 30].includes(s)) {
                play808Kick(v * 0.68, s % 16 === 0 ? 48 : 55, 0.22);
            }
            const funkLead = [
                329.63, 0, 329.63, 392.00, 0, 329.63, 440.00, 0,
                329.63, 0, 329.63, 493.88, 0, 440.00, 392.00, 0,
                659.25, 0, 659.25, 783.99, 0, 659.25, 880.00, 0,
                659.25, 0, 587.33, 493.88, 0, 440.00, 392.00, 0
            ];
            if (funkLead[s]) {
                playFilteredSynth(funkLead[s], 0.14, 'square', v * 0.22, 1900, 420, true);
            }
            if (s % 4 === 2) playNoise(0.04, v * 0.16, 5500, 'highpass');
        }
        else if (audioPrefs.track === 'space') {
            // 4. INTERSTELLAR VIBE (Эмоциональное арпеджио + эхо)
            const arp = [
                220.00, 329.63, 440.00, 523.25, 659.25, 523.25, 440.00, 329.63,
                174.61, 261.63, 349.23, 440.00, 523.25, 440.00, 349.23, 261.63,
                261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63,
                196.00, 246.94, 392.00, 493.88, 587.33, 493.88, 392.00, 246.94
            ];
            playFilteredSynth(arp[s], 0.34, 'triangle', v * 0.28, 2200, 600, true);
            if (s % 8 === 0) {
                const pads = [110.00, 87.31, 130.81, 98.00];
                playFilteredSynth(pads[s / 8], 1.1, 'sine', v * 0.35, 500, 250, false);
                play808Kick(v * 0.35, 40, 0.25);
            }
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
