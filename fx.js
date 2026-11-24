// ==================== АНИМАЦИИ, ЖИВОЙ ФОН И СТИЛЬ ====================
const bgCanvas = document.getElementById('bg-canvas'), bgCtx = bgCanvas.getContext('2d');
const fxCanvas = document.getElementById('fx-canvas'), fxCtx = fxCanvas.getContext('2d');
let particles = [], floatTexts = [], bgOrbs = [], bgStars = [], gridOffset = 0, victoryFxTimer = null;

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
