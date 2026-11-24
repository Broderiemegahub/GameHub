// ==================== АУДИО ДВИЖОК И МУЗЫКА ====================
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
    if (typeof spawnBurst === 'function') spawnBurst(e.clientX, e.clientY, 10);
    if (!audioUnlocked) {
        audioUnlocked = true; ensureAudio();
        if (audioPrefs.track !== 'none') startBgm();
    }
});
