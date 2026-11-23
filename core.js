// ==================== СИСТЕМА ОБНОВЛЕНИЙ ====================
const APP_VERSION = '2.5';
const CHANGELOG = [
    '👤 Профиль Telegram (имя и аватар) прямо в главном меню',
    '🏆 Таблица лидеров по каждой игре (Сапёр, Тетрис и Зомби-лаба)',
    '📤 Кнопка «Поделиться в чате» для флекса рекордами в Telegram',
    '🧱 Новый неоновый экран конца игры в Тетрисе'
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

// ==================== TELEGRAM MINI APP И ПРОФИЛЬ ====================
const tgWebApp = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
if (tgWebApp) {
    tgWebApp.ready();
    tgWebApp.expand();
    if (tgWebApp.disableVerticalSwipes) tgWebApp.disableVerticalSwipes();
}

const rawTgUser = tgWebApp?.initDataUnsafe?.user;
const tgUser = {
    name: rawTgUser ? [rawTgUser.first_name, rawTgUser.last_name].filter(Boolean).join(' ') : 'Игрок',
    username: rawTgUser?.username ? '@' + rawTgUser.username : 'Telegram Player',
    photo: rawTgUser?.photo_url || ''
};

function initTgProfile() {
    const nameEl = document.getElementById('tg-user-name');
    const tagEl = document.getElementById('tg-user-tag');
    const avatarEl = document.getElementById('tg-avatar');
    if (!nameEl || !avatarEl) return;

    nameEl.innerText = tgUser.name;
    tagEl.innerText = tgUser.username;

    const initial = (tgUser.name.trim()[0] || '👤').toUpperCase();
    if (tgUser.photo) {
        const img = document.createElement('img');
        img.src = tgUser.photo;
        img.onerror = () => { avatarEl.innerHTML = initial; };
        avatarEl.innerHTML = '';
        avatarEl.appendChild(img);
    } else {
        avatarEl.innerText = initial;
    }
}
initTgProfile();

function shareGameScore(text) {
    const appUrl = 'https://broderiemegahub.github.io/GameHub/';
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(text)}`;
    if (tgWebApp && tgWebApp.openTelegramLink) {
        tgWebApp.openTelegramLink(shareUrl);
    } else {
        window.open(shareUrl, '_blank');
    }
}

// ==================== РЕКОРДЫ И ТАБЛИЦА ЛИДЕРОВ ====================
let hubRecords = loadHubRecords();
let currentLbTab = 'mines';

function loadHubRecords() {
    let data = { mines: null, tetris: 0, zlab: 0 };
    try {
        const raw = localStorage.getItem('gameHubRecords');
        if (raw) data = { ...data, ...JSON.parse(raw) };
    } catch {}
    try {
        const zSave = JSON.parse(localStorage.getItem('zombieLabSave') || 'null');
        if (zSave && zSave.total > data.zlab) data.zlab = Math.floor(zSave.total);
    } catch {}
    return data;
}

function saveHubRecords() {
    try { localStorage.setItem('gameHubRecords', JSON.stringify(hubRecords)); } catch {}
}

function updateRecord(game, val) {
    if (game === 'mines') {
        if (val > 0 && (hubRecords.mines === null || val < hubRecords.mines)) {
            hubRecords.mines = val;
            saveHubRecords();
            return true;
        }
    } else if (game === 'tetris') {
        if (val > hubRecords.tetris) {
            hubRecords.tetris = val;
            saveHubRecords();
            return true;
        }
    } else if (game === 'zlab') {
        if (val > hubRecords.zlab) {
            hubRecords.zlab = Math.floor(val);
            saveHubRecords();
            return true;
        }
    }
    return false;
}

function formatCompact(n) {
    n = Math.floor(Math.max(0, n));
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
}

const LB_RIVALS = {
    mines: [
        { name: 'ShadowMiner', tag: '@miner_pro', val: 14 },
        { name: 'CyberFox',    tag: '@cfox',      val: 22 },
        { name: 'NeonPulse',   tag: '@npulse',    val: 31 },
        { name: 'Vortex',      tag: '@vtx99',     val: 44 },
        { name: 'PixelKnight', tag: '@pknight',   val: 58 },
        { name: 'Rookie_01',   tag: '@rookie',    val: 80 }
    ],
    tetris: [
        { name: 'BlockGod',    tag: '@tetromaster', val: 4800 },
        { name: 'CyberFox',    tag: '@cfox',        val: 3200 },
        { name: 'NeonPulse',   tag: '@npulse',      val: 2100 },
        { name: 'Vortex',      tag: '@vtx99',       val: 1400 },
        { name: 'PixelKnight', tag: '@pknight',     val: 800 },
        { name: 'Rookie_01',   tag: '@rookie',      val: 300 }
    ],
    zlab: [
        { name: 'Dr. Omega',   tag: '@biohazard', val: 2500000 },
        { name: 'MutantKing',  tag: '@zking',     val: 500000 },
        { name: 'CyberFox',    tag: '@cfox',      val: 100000 },
        { name: 'NeonPulse',   tag: '@npulse',    val: 25000 },
        { name: 'Vortex',      tag: '@vtx99',     val: 5000 },
        { name: 'Rookie_01',   tag: '@rookie',    val: 500 }
    ]
};

function openLeaderboard(tab = 'mines') {
    showScreen('leaderboard-screen');
    switchLbTab(tab, true);
}

function switchLbTab(tab, silent = false) {
    if (!silent) sfxClick();
    currentLbTab = tab;
    ['mines', 'tetris', 'zlab'].forEach(t => {
        document.getElementById('lbtab-' + t).classList.toggle('active', t === tab);
    });

    const list = LB_RIVALS[tab].map(x => ({ ...x, isMe: false }));
    const myVal = hubRecords[tab];
    const hasScore = tab === 'mines' ? (myVal !== null && myVal > 0) : (myVal > 0);

    if (hasScore) {
        list.push({ name: tgUser.name + ' (Вы)', tag: tgUser.username, val: myVal, isMe: true });
    }

    if (tab === 'mines') list.sort((a, b) => a.val - b.val);
    else list.sort((a, b) => b.val - a.val);

    const summaryEl = document.getElementById('lb-my-summary');
    const shareBtn = document.getElementById('lb-share-btn');

    if (hasScore) {
        const myRank = list.findIndex(x => x.isMe) + 1;
        const valText = tab === 'mines' ? `${myVal} сек`
                      : tab === 'tetris' ? `${myVal} очков`
                      : `${formatCompact(myVal)} 🧪`;
        summaryEl.innerHTML = `<span>Твоё место: #${myRank}</span><span>Рекорд: ${valText}</span>`;

        const shareText = tab === 'mines' ? `💣 Мой рекорд в Сапёре (Game Hub) — ${myVal} сек (#${myRank} в топе)! Попробуй побить!`
                        : tab === 'tetris' ? `🧱 Мой рекорд в Тетрисе (Game Hub) — ${myVal} очков (#${myRank} в топе)! Сможешь больше?`
                        : `🧪 Я нафармил ${formatCompact(myVal)} мутагена в Зомби-Лабе (#${myRank} в топе)! Залетай!`;
        shareBtn.onclick = () => { sfxClick(); shareGameScore(shareText); };
    } else {
        summaryEl.innerHTML = `<span>Рекорд ещё не установлен</span><span>Сыграй катку!</span>`;
        shareBtn.onclick = () => { sfxClick(); shareGameScore('🎮 Залетай в Game Hub — тут Сапёр, Тетрис, Маджонг и Зомби-Лаба!'); };
    }

    const listEl = document.getElementById('lb-list');
    listEl.innerHTML = '';
    const medals = ['🥇', '🥈', '🥉'];

    list.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'lb-row' + (item.isMe ? ' is-me' : '');
        const rankStr = medals[idx] || `#${idx + 1}`;
        const scoreStr = tab === 'mines' ? `⏱ ${item.val}с`
                       : tab === 'tetris' ? `${item.val} pts`
                       : `🧪 ${formatCompact(item.val)}`;
        row.innerHTML = `
            <div class="lb-left">
                <div class="lb-rank">${rankStr}</div>
                <div style="min-width:0;">
                    <div class="lb-name">${item.name}</div>
                    <div class="lb-tag">${item.tag}</div>
                </div>
            </div>
            <div class="lb-score">${scoreStr}</div>
        `;
        listEl.appendChild(row);
    });
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
let audioCtx = null, masterComp = null, delayNode = null;
let bgmTimer = null, bgmStep = 0;

const customAudioEl = new Audio();
customAudioEl.loop = true;
let customAudioUrl = null;
let customAudioName = 'music.mp3 или файл с телефона';

const customFileInput = document.createElement('input');
customFileInput.type = 'file';
customFileInput.accept = 'audio/*';
customFileInput.style.display = 'none';
document.body.appendChild(customFileInput);

customFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    customAudioUrl = URL.createObjectURL(file);
    customAudioName = file.name;
    audioPrefs.track = 'custom';
    saveAudioPrefs();
    startBgm();
    renderTrackList();
});

const MUSIC_TRACKS = [
    { id: 'mc_sweden',   title: '🟩 Minecraft — Sweden',       desc: 'C418 • Мягкое атмосферное пианино' },
    { id: 'mc_wethands', title: '🟦 Minecraft — Wet Hands',    desc: 'C418 • Ностальгическая мелодия' },
    { id: 'roblox_chill',title: '🟥 Roblox — Classic Lobby',   desc: 'Ламповый чилл из старого лобби' },
    { id: 'space',       title: '🌌 Interstellar Vibe',        desc: 'Космическое арпеджио и эхо' },
    { id: 'custom',      title: '🎧 Свой MP3 трек',            desc: customAudioName },
    { id: 'none',        title: '🔇 Без музыки',               desc: 'Только звуковые эффекты' }
];

let audioPrefs = loadAudioPrefs();

function loadAudioPrefs() {
    try {
        const raw = localStorage.getItem('gameHubAudio');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (!MUSIC_TRACKS.some(t => t.id === parsed.track)) parsed.track = 'mc_sweden';
            return parsed;
        }
    } catch {}
    return { track: 'mc_sweden', bgmVol: 0.45, sfxVol: 0.75 };
}
function saveAudioPrefs() {
    try { localStorage.setItem('gameHubAudio', JSON.stringify(audioPrefs)); } catch {}
}

function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new AudioCtx();
        masterComp = audioCtx.createDynamicsCompressor();
        masterComp.threshold.value = -14;
        masterComp.knee.value = 14;
        masterComp.ratio.value = 5;
        masterComp.attack.value = 0.005;
        masterComp.release.value = 0.18;
        masterComp.connect(audioCtx.destination);

        delayNode = audioCtx.createDelay(1.0);
        delayNode.delayTime.value = 0.28;
        const fb = audioCtx.createGain();
        fb.gain.value = 0.36;
        const lp = audioCtx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1900;

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

function playWarmPiano(freq, dur = 0.8, vol = 0.25, echo = true) {
    if (!audioCtx || vol <= 0.001 || !freq) return;
    const now = audioCtx.currentTime;
    const oscMain = audioCtx.createOscillator(), oscSub = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter(), gain = audioCtx.createGain();

    oscMain.type = 'triangle'; oscMain.frequency.setValueAtTime(freq, now);
    oscSub.type = 'sine'; oscSub.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + dur);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    oscMain.connect(filter); oscSub.connect(filter);
    filter.connect(gain); gain.connect(masterComp);

    if (echo && delayNode) {
        const send = audioCtx.createGain();
        send.gain.value = 0.38;
        gain.connect(send); send.connect(delayNode);
    }
    oscMain.start(now); oscSub.start(now);
    oscMain.stop(now + dur + 0.04); oscSub.stop(now + dur + 0.04);
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

    if (audioPrefs.track === 'custom') {
        customAudioEl.volume = Math.min(1, audioPrefs.bgmVol);
        customAudioEl.src = customAudioUrl || 'music.mp3';
        customAudioEl.play().catch(() => customFileInput.click());
        return;
    }

    ensureAudio();
    bgmStep = 0;
    const bpmMap = { mc_sweden: 76, mc_wethands: 84, roblox_chill: 108, space: 105 };
    const stepMs = (60000 / (bpmMap[audioPrefs.track] || 90)) / 2;

    bgmTimer = setInterval(() => {
        if (!audioCtx || audioCtx.state !== 'running') return;
        const v = audioPrefs.bgmVol;
        const s = bgmStep % 32;

        if (audioPrefs.track === 'mc_sweden') {
            const mel = [369.99,440.00,554.37,659.25,587.33,0,440.00,0, 369.99,440.00,587.33,554.37,440.00,0,369.99,0, 392.00,493.88,587.33,739.99,659.25,0,587.33,0, 329.63,440.00,554.37,659.25,554.37,0,440.00,0];
            const bass = [146.83,0,0,0,220.00,0,0,0, 123.47,0,0,0,185.00,0,0,0, 98.00,0,0,0,146.83,0,0,0, 110.00,0,0,0,164.81,0,0,0];
            if (mel[s]) playWarmPiano(mel[s], 1.15, v * 0.30, true);
            if (bass[s]) playWarmPiano(bass[s], 1.6, v * 0.28, false);
        } else if (audioPrefs.track === 'mc_wethands') {
            const mel = [440.00,554.37,659.25,739.99,659.25,554.37,493.88,554.37, 587.33,739.99,880.00,830.61,739.99,659.25,554.37,493.88, 440.00,554.37,659.25,880.00,830.61,659.25,554.37,493.88, 369.99,440.00,554.37,659.25,554.37,493.88,440.00,0];
            const bass = [110.00,0,164.81,0,110.00,0,164.81,0, 146.83,0,220.00,0,146.83,0,220.00,0, 92.50,0,138.59,0,92.50,0,138.59,0, 164.81,0,246.94,0,164.81,0,246.94,0];
            if (mel[s]) playWarmPiano(mel[s], 0.9, v * 0.28, true);
            if (bass[s]) playWarmPiano(bass[s], 1.1, v * 0.24, false);
        } else if (audioPrefs.track === 'roblox_chill') {
            const chords = [[349.23,440.00,523.25,659.25],[329.63,392.00,493.88,587.33],[293.66,349.23,440.00,523.25],[261.63,329.63,392.00,493.88]];
            const bar = Math.floor(s / 8), stepInBar = s % 8;
            if (stepInBar === 0 || stepInBar === 3 || stepInBar === 6) chords[bar].forEach(note => playWarmPiano(note, 0.55, v * 0.14, true));
            const bassLine = [174.61,0,0,261.63,164.81,0,0,246.94,146.83,0,0,220.00,130.81,0,0,196.00];
            const bNote = bassLine[Math.floor(s / 2)];
            if (s % 2 === 0 && bNote) playTone(bNote, 0.35, 'sine', v * 0.32);
            if (stepInBar % 2 === 0) playNoise(0.03, v * 0.08, 6000, 'highpass');
        } else if (audioPrefs.track === 'space') {
            const s16 = bgmStep % 16;
            const arp = [220.00,329.63,440.00,523.25,659.25,523.25,440.00,329.63, 174.61,261.63,349.23,440.00,523.25,440.00,349.23,261.63];
            playWarmPiano(arp[s16], 0.65, v * 0.28, true);
            if (s16 % 8 === 0) playWarmPiano(s16 === 0 ? 110.00 : 87.31, 1.4, v * 0.32, false);
        }
        bgmStep++;
    }, stepMs);
}

function stopBgm() {
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    customAudioEl.pause();
}

function renderTrackList() {
    const list = document.getElementById('track-list'); list.innerHTML = '';
    MUSIC_TRACKS.forEach(tr => {
        const isAct = audioPrefs.track === tr.id;
        const desc = tr.id === 'custom' ? customAudioName : tr.desc;
        const el = document.createElement('div');
        el.className = 'track-card' + (isAct ? ' active' : '');
        el.innerHTML = `<div class="track-info"><div class="track-title">${tr.title}</div><div class="track-desc">${desc}</div></div><div class="track-status">${isAct ? '🔊' : '▶️'}</div>`;
        el.onclick = () => {
            if (tr.id === 'custom' && isAct) { customFileInput.click(); return; }
            audioPrefs.track = tr.id; saveAudioPrefs(); sfxClick(); startBgm(); renderTrackList();
        };
        list.appendChild(el);
    });
}
function updateAudioSettings() {
    const bv = parseInt(document.getElementById('bgm-vol').value), sv = parseInt(document.getElementById('sfx-vol').value);
    audioPrefs.bgmVol = bv / 100; audioPrefs.sfxVol = sv / 100;
    document.getElementById('bgm-vol-val').innerText = bv + '%';
    document.getElementById('sfx-vol-val').innerText = sv + '%';
    customAudioEl.volume = Math.min(1, audioPrefs.bgmVol);
    saveAudioPrefs();
    if (bv === 0) stopBgm(); else if (!bgmTimer && customAudioEl.paused && audioPrefs.track !== 'none') startBgm();
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
    document.getElementById('tetris-result-overlay').classList.remove('active');
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
