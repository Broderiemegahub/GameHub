const ZLAB_STAGES = [
    { min: 0,         icon: '🦠', name: 'Стадия 1: Вирус' },
    { min: 150,       icon: '🧪', name: 'Стадия 2: Био-слизень' },
    { min: 1000,      icon: '🧟', name: 'Стадия 3: Зомби' },
    { min: 5000,      icon: '🧌', name: 'Стадия 4: Мутант' },
    { min: 25000,     icon: '🦖', name: 'Стадия 5: Тиран' },
    { min: 100000,    icon: '🤖', name: 'Стадия 6: Кибер-Зомби' },
    { min: 500000,    icon: '👑', name: 'Стадия 7: Альфа-Босс' },
    { min: 3000000,   icon: '🌌', name: 'Стадия 8: Галактический Титан' },
    { min: 20000000,  icon: '👾', name: 'Стадия 9: Бог Мутаций' }
];

const ZLAB_UPGRADES = [
    { id: 'syringe',     icon: '💉', name: 'Шприц мутагена',    desc: '+1 к силе клика',          baseCost: 15,      click: 1,    sec: 0 },
    { id: 'incubator',   icon: '🧫', name: 'Инкубатор',         desc: '+2 мутагена / сек',        baseCost: 50,      click: 0,    sec: 2 },
    { id: 'stim',        icon: '⚡', name: 'Плазма-стимулятор', desc: '+5 к силе клика',          baseCost: 220,     click: 5,    sec: 0 },
    { id: 'scientist',   icon: '👨‍🔬', name: 'Безумный учёный',  desc: '+12 мутагена / сек',       baseCost: 600,     click: 0,    sec: 12 },
    { id: 'genemod',     icon: '🧬', name: 'Генный модификатор',desc: '+18 к силе клика',         baseCost: 1500,    click: 18,   sec: 0 },
    { id: 'reactor',     icon: '☢️', name: 'Био-реактор',       desc: '+45 мутагена / сек',       baseCost: 2800,    click: 0,    sec: 45 },
    { id: 'cyberarm',    icon: '🦾', name: 'Кибер-манипулятор', desc: '+65 к силе клика',         baseCost: 7500,    click: 65,   sec: 0 },
    { id: 'alien',       icon: '🛸', name: 'Штамм Омега',       desc: '+25 клик, +180 / сек',     baseCost: 16000,   click: 25,   sec: 180 },
    { id: 'collider',    icon: '🌌', name: 'Квантовый коллайдер',desc: '+550 мутагена / сек',     baseCost: 55000,   click: 0,    sec: 550 },
    { id: 'ai_core',     icon: '🧠', name: 'ИИ-Надзиратель',    desc: '+200 клик, +1.4K / сек',   baseCost: 180000,  click: 200,  sec: 1400 },
    { id: 'meteor',      icon: '☄️', name: 'Метеоритный вирус', desc: '+4.5K мутагена / сек',     baseCost: 650000,  click: 0,    sec: 4500 },
    { id: 'singularity', icon: '👑', name: 'Сингулярность',     desc: '+1.5K клик, +15K / сек',   baseCost: 2500000, click: 1500, sec: 15000 }
];

let zState = loadZombieLab();
let zLabInt = null, zEventInt = null, zFlaskTimer = null, zIsoTimer = null;
let zActiveEvent = null, zTicks = 0;

function stopZombieLab() {
    if (zLabInt) { clearInterval(zLabInt); zLabInt = null; }
    clearZLabEvent();
    hideFloatingEvents();
    saveZombieLab();
}

function loadZombieLab() {
    try { const raw = localStorage.getItem('zombieLabSave'); if (raw) return JSON.parse(raw); } catch {}
    return { mutagen: 0, total: 0, owned: {} };
}

function saveZombieLab() {
    try { localStorage.setItem('zombieLabSave', JSON.stringify(zState)); } catch {}
    if (typeof updateRecord === 'function') updateRecord('zlab', Math.floor(zState.total));
}

function shareZLabScore() {
    const stageName = document.getElementById('zlab-stage').innerText;
    shareGameScore(`🧪 Моя Зомби-Лаба в Game Hub: ${formatNum(zState.total)} мутагена (${stageName})! Попробуй догнать!`);
}

function formatNum(n) {
    n = Math.floor(Math.max(0, n));
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
}

function getZLabStats() {
    let perClick = 1, perSec = 0;
    ZLAB_UPGRADES.forEach(u => {
        const cnt = zState.owned[u.id] || 0;
        perClick += cnt * u.click;
        perSec += cnt * u.sec;
    });
    return { perClick, perSec };
}

function getUpgradeCost(u) {
    return Math.floor(u.baseCost * Math.pow(1.18, zState.owned[u.id] || 0));
}

function openZombieLab() {
    showScreen('zlab-screen');
    renderZombieLab();
    zTicks = 0;
    zLabInt = setInterval(() => {
        const { perSec } = getZLabStats();
        let secMult = 1;
        if (zActiveEvent && zActiveEvent.type === 'alien') secMult = 4;
        if (zActiveEvent && (zActiveEvent.type === 'cryo' || zActiveEvent.type === 'vampire')) secMult = 0;

        if (perSec > 0 && secMult > 0) {
            const gain = (perSec * secMult) / 5;
            zState.mutagen += gain; zState.total += gain;
        }
        zTicks++;
        if (zTicks % 15 === 0) saveZombieLab();
        if (!zActiveEvent && zTicks > 0 && zTicks % 100 === 0 && zState.total >= 20) triggerRandomZLabEvent();
        updateZLabNumbers();
    }, 200);
}

function triggerRandomZLabEvent() {
    const pool = ['meltdown', 'meltdown', 'vampire', 'vampire', 'swarm', 'swarm', 'isotope', 'isotope', 'breach', 'overdrive', 'alien', 'cryo', 'flask'];
    const pick = pool[Math.floor(Math.random() * pool.length)];

    if (pick === 'flask') { spawnFloatingBtn('zlab-golden-flask', 6000); return; }
    if (pick === 'isotope') { spawnFloatingBtn('zlab-isotope', 7000); return; }

    clearZLabEvent();
    const banner = document.getElementById('zlab-event-banner');
    const reactor = document.getElementById('zlab-reactor');
    const fill = document.getElementById('zlab-event-fill');
    const hint = document.getElementById('zlab-tap-hint');

    if (pick === 'meltdown') {
        zActiveEvent = { type: 'meltdown', time: 6, maxTime: 6, failed: false };
        banner.className = 'active ev-meltdown'; reactor.className = 'ev-meltdown';
        hint.innerText = 'НЕ ТРОГАЙ!'; fill.style.width = '100%'; sfxAlarm(); triggerShake(true);
    } else if (pick === 'vampire') {
        zActiveEvent = { type: 'vampire', time: 8, maxTime: 8, taps: 0, need: 25, stolen: 0 };
        banner.className = 'active ev-vampire'; reactor.className = 'ev-vampire';
        hint.innerText = 'РАЗДАВИ!'; fill.style.width = '0%'; sfxAlarm(); triggerShake(true);
    } else if (pick === 'swarm') {
        zActiveEvent = { type: 'swarm', time: 6, maxTime: 6, left: 5 };
        banner.className = 'active ev-swarm'; hint.innerText = 'БЕЙ ЗОМБИ!';
        fill.style.width = '100%'; sfxAlarm(); spawnZombieSwarm(5);
    } else if (pick === 'breach') {
        zActiveEvent = { type: 'breach', time: 8, maxTime: 8, taps: 0, need: 15 };
        banner.className = 'active ev-breach'; reactor.className = 'ev-breach';
        hint.innerText = 'УДЕРЖИВАЙ!'; fill.style.width = '0%'; sfxAlarm();
    } else if (pick === 'overdrive') {
        zActiveEvent = { type: 'overdrive', time: 10, maxTime: 10 };
        banner.className = 'active ev-overdrive'; reactor.className = 'ev-overdrive';
        hint.innerText = 'КЛИК x3!'; fill.style.width = '100%'; sfxVictory();
    } else if (pick === 'alien') {
        zActiveEvent = { type: 'alien', time: 12, maxTime: 12 };
        banner.className = 'active ev-alien'; reactor.className = 'ev-alien';
        hint.innerText = 'ДОХОД x4!'; fill.style.width = '100%'; sfxMatch(5);
    } else if (pick === 'cryo') {
        zActiveEvent = { type: 'cryo', time: 8, maxTime: 8, taps: 0, need: 8 };
        banner.className = 'active ev-cryo'; reactor.className = 'ev-cryo';
        hint.innerText = 'РАЗБЕЙ ЛЁД!'; fill.style.width = '0%'; sfxFlag();
    }

    updateEventBannerText();

    zEventInt = setInterval(() => {
        if (!zActiveEvent) return;
        zActiveEvent.time--;

        if (zActiveEvent.type === 'vampire') {
            const drain = Math.floor(zState.mutagen * 0.04);
            if (drain > 0) {
                zState.mutagen = Math.max(0, zState.mutagen - drain);
                zActiveEvent.stolen += drain;
                spawnFloatText(window.innerWidth / 2, window.innerHeight / 2 - 70, `🩸 -${formatNum(drain)} 🧪`, '#ef4444');
                triggerShake(false);
            }
        }

        updateEventBannerText();
        if (['overdrive', 'alien', 'meltdown', 'swarm'].includes(zActiveEvent.type)) {
            fill.style.width = Math.max(0, (zActiveEvent.time / zActiveEvent.maxTime) * 100) + '%';
        }

        if (zActiveEvent.time <= 0) {
            const ev = zActiveEvent;
            clearZLabEvent();
            if (ev.type === 'meltdown' && !ev.failed) {
                const { perClick, perSec } = getZLabStats();
                const bonus = Math.max(100, perClick * 30 + perSec * 15);
                zState.mutagen += bonus; zState.total += bonus;
                sfxVictory();
                spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 45, ['#4ade80', '#fbbf24', '#ffffff'], 1.3);
                spawnFloatText(window.innerWidth / 2, window.innerHeight / 2 - 40, `☢️ СТАБИЛИЗИРОВАНО! +${formatNum(bonus)} 🧪`, '#4ade80');
            } else if (ev.type === 'swarm' && ev.left > 0) {
                const penalty = Math.floor(zState.mutagen * (ev.left * 0.07));
                zState.mutagen = Math.max(0, zState.mutagen - penalty);
                sfxExplosion(); triggerShake(true); doVibrate(200);
                spawnFloatText(window.innerWidth / 2, window.innerHeight / 2 - 40, `☣️ ПРОРВАЛИСЬ! -${formatNum(penalty)} 🧪`, '#ef4444');
            }
            updateZLabNumbers();
        }
    }, 1000);
}

function spawnZombieSwarm(count) {
    const layer = document.getElementById('zlab-swarm-layer');
    layer.innerHTML = '';
    const maxX = Math.max(40, window.innerWidth - 90), maxY = Math.max(140, window.innerHeight - 160);
    for (let i = 0; i < count; i++) {
        const z = document.createElement('div');
        z.className = 'swarm-zombie'; z.innerText = '🧟';
        z.style.left = (15 + Math.random() * maxX) + 'px';
        z.style.top = (95 + Math.random() * (maxY - 95)) + 'px';
        z.onclick = (e) => {
            e.stopPropagation(); z.remove(); sfxExplosion(); doVibrate(35);
            spawnBurst(e.clientX, e.clientY, 20, ['#4ade80', '#ef4444', '#ffffff']);
            if (zActiveEvent && zActiveEvent.type === 'swarm') {
                zActiveEvent.left--; updateEventBannerText();
                if (zActiveEvent.left <= 0) {
                    const { perClick, perSec } = getZLabStats();
                    const bonus = Math.max(120, perClick * 35 + perSec * 20);
                    zState.mutagen += bonus; zState.total += bonus;
                    clearZLabEvent(); sfxVictory(); triggerShake(true); doVibrate([60, 40, 120]);
                    spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 55, ['#4ade80', '#fbbf24', '#ffffff'], 1.4);
                    spawnFloatText(window.innerWidth / 2, window.innerHeight / 2 - 40, `☣️ ЗАЧИЩЕНО! +${formatNum(bonus)} 🧪`, '#4ade80');
                    updateZLabNumbers();
                }
            }
        };
        layer.appendChild(z);
    }
}

function updateEventBannerText() {
    if (!zActiveEvent) return;
    const t = document.getElementById('zlab-event-title');
    if (zActiveEvent.type === 'meltdown') t.innerText = `☢️ ПЕРЕГРЕВ! НЕ ТАПАЙ РЕАКТОР! (${zActiveEvent.time}с)`;
    else if (zActiveEvent.type === 'vampire') t.innerText = `🩸 ВАМПИР ЖРЁТ МУТАГЕН! 25 ТАПОВ! (${zActiveEvent.time}с)`;
    else if (zActiveEvent.type === 'swarm') t.innerText = `☣️ НАШЕСТВИЕ! УБЕЙ ЗОМБИ: ${zActiveEvent.left} (${zActiveEvent.time}с)`;
    else if (zActiveEvent.type === 'breach') t.innerText = `⚠️ ПРОРЫВ ИЗОЛЯЦИИ! ТАПАЙ! (${zActiveEvent.time}с)`;
    else if (zActiveEvent.type === 'overdrive') t.innerText = `⚡ ПЕРЕГРУЗКА: КЛИК ×3! (${zActiveEvent.time}с)`;
    else if (zActiveEvent.type === 'alien') t.innerText = `🛸 ИНОПЛАНЕТНЫЙ СИГНАЛ: АВТО ×4! (${zActiveEvent.time}с)`;
    else if (zActiveEvent.type === 'cryo') t.innerText = `❄️ КРИО-СБОЙ! ПРОБЕЙ ЛЁД! (${zActiveEvent.time}с)`;
}

function clearZLabEvent() {
    zActiveEvent = null;
    if (zEventInt) { clearInterval(zEventInt); zEventInt = null; }
    const banner = document.getElementById('zlab-event-banner');
    const reactor = document.getElementById('zlab-reactor');
    const hint = document.getElementById('zlab-tap-hint');
    const layer = document.getElementById('zlab-swarm-layer');
    if (banner) banner.className = '';
    if (reactor) reactor.className = '';
    if (hint) hint.innerText = 'ТАПАЙ!';
    if (layer) layer.innerHTML = '';
}

function spawnFloatingBtn(id, dur) {
    const el = document.getElementById(id);
    const maxX = Math.max(40, window.innerWidth - 105), maxY = Math.max(120, window.innerHeight - 200);
    el.style.left = (20 + Math.random() * maxX) + 'px';
    el.style.top = (100 + Math.random() * (maxY - 100)) + 'px';
    el.classList.add('active'); sfxFlag();
    if (id === 'zlab-golden-flask') { clearTimeout(zFlaskTimer); zFlaskTimer = setTimeout(() => el.classList.remove('active'), dur); }
    else { clearTimeout(zIsoTimer); zIsoTimer = setTimeout(() => el.classList.remove('active'), dur); }
}

function hideFloatingEvents() {
    clearTimeout(zFlaskTimer); zFlaskTimer = null;
    clearTimeout(zIsoTimer); zIsoTimer = null;
    const f = document.getElementById('zlab-golden-flask'), iso = document.getElementById('zlab-isotope');
    if (f) f.classList.remove('active');
    if (iso) iso.classList.remove('active');
}

function catchGoldenFlask(e) {
    e.stopPropagation(); clearTimeout(zFlaskTimer);
    document.getElementById('zlab-golden-flask').classList.remove('active');
    const { perClick, perSec } = getZLabStats();
    const bonus = Math.max(80, perClick * 25 + perSec * 18);
    zState.mutagen += bonus; zState.total += bonus;
    sfxVictory(); triggerShake(true); doVibrate([50, 30, 100]);
    spawnBurst(e.clientX, e.clientY, 45, ['#fbbf24', '#fef08a', '#ffffff'], 1.3);
    spawnFloatText(e.clientX, e.clientY - 20, `🌟 ЗОЛОТАЯ КОЛБА! +${formatNum(bonus)} 🧪`, '#fbbf24');
    saveZombieLab(); updateZLabNumbers();
}

function triggerIsotopeGamble(e) {
    e.stopPropagation(); clearTimeout(zIsoTimer);
    document.getElementById('zlab-isotope').classList.remove('active');
    if (Math.random() < 0.5) {
        const gain = Math.max(150, Math.floor(zState.mutagen));
        zState.mutagen += gain; zState.total += gain;
        sfxVictory(); triggerShake(true); doVibrate([80, 40, 140]);
        spawnConfettiCannon(true); spawnConfettiCannon(false);
        spawnBurst(e.clientX, e.clientY, 55, ['#d946ef', '#4ade80', '#fbbf24', '#ffffff'], 1.4);
        spawnFloatText(e.clientX, e.clientY - 20, `🎲 ДЖЕКПОТ ×2! +${formatNum(gain)} 🧪`, '#4ade80');
    } else {
        const loss = Math.floor(zState.mutagen * 0.35);
        zState.mutagen = Math.max(0, zState.mutagen - loss);
        sfxExplosion(); triggerShake(true); doVibrate(250);
        spawnBurst(e.clientX, e.clientY, 55, ['#ef4444', '#f97316', '#ffffff'], 1.4);
        spawnFloatText(e.clientX, e.clientY - 20, `💥 ВЗРЫВ! -${formatNum(loss)} 🧪`, '#ef4444');
    }
    saveZombieLab(); updateZLabNumbers();
}

function tapReactor(e) {
    const rx = e.clientX || window.innerWidth / 2, ry = e.clientY || window.innerHeight / 2;
    if (zActiveEvent && zActiveEvent.type === 'meltdown') {
        zActiveEvent.failed = true;
        const penalty = Math.max(10, Math.floor(zState.mutagen * 0.1));
        zState.mutagen = Math.max(0, zState.mutagen - penalty);
        sfxExplosion(); triggerShake(true); doVibrate(180);
        spawnBurst(rx, ry, 30, ['#ef4444', '#f97316', '#fef08a'], 1.2);
        spawnFloatText(rx, ry - 15, `☢️ ОЖОГ! -${formatNum(penalty)} 🧪`, '#ef4444');
        updateZLabNumbers(); return;
    }

    const { perClick, perSec } = getZLabStats();
    let mult = 1, burstColors = ['#4ade80', '#86efac', '#ffffff'], txtColor = '#4ade80';
    if (zActiveEvent) {
        if (zActiveEvent.type === 'breach' || zActiveEvent.type === 'vampire') { mult = 2; burstColors = ['#ef4444', '#fbbf24']; txtColor = '#fbbf24'; }
        else if (zActiveEvent.type === 'overdrive') { mult = 3; burstColors = ['#fbbf24', '#f97316', '#ffffff']; txtColor = '#fbbf24'; }
        else if (zActiveEvent.type === 'cryo') { mult = 1; burstColors = ['#7dd3fc', '#ffffff']; txtColor = '#7dd3fc'; }
    }

    const gain = perClick * mult;
    zState.mutagen += gain; zState.total += gain;
    sfxPop(); doVibrate(15);
    spawnBurst(rx, ry, zActiveEvent ? 14 : 7, burstColors);
    spawnFloatText(rx, ry - 15, `+${formatNum(gain)} 🧪`, txtColor);

    if (zActiveEvent && ['breach', 'cryo', 'vampire'].includes(zActiveEvent.type)) {
        zActiveEvent.taps++;
        document.getElementById('zlab-event-fill').style.width = Math.min(100, (zActiveEvent.taps / zActiveEvent.need) * 100) + '%';
        if (zActiveEvent.taps >= zActiveEvent.need) {
            const type = zActiveEvent.type, refund = zActiveEvent.stolen || 0;
            const bonus = Math.max(70, perClick * 25 + perSec * 16) + refund;
            zState.mutagen += bonus; zState.total += bonus;
            sfxVictory(); triggerShake(true); doVibrate([60, 40, 120]);
            spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 50, type === 'cryo' ? ['#38bdf8', '#ffffff', '#fbbf24'] : ['#4ade80', '#fbbf24', '#ffffff'], 1.35);
            const msg = type === 'cryo' ? `❄️ ЛЁД ПРОБИТ! +${formatNum(bonus)} 🧪` : type === 'vampire' ? `🩸 ВАМПИР РАЗДАВЛЕН! +${formatNum(bonus)} 🧪` : `🛡️ УДЕРЖАН! +${formatNum(bonus)} 🧪`;
            spawnFloatText(window.innerWidth / 2, window.innerHeight / 2 - 40, msg, type === 'cryo' ? '#7dd3fc' : '#fbbf24');
            clearZLabEvent();
        }
    }
    updateZLabNumbers();
}

function buyUpgrade(id) {
    const u = ZLAB_UPGRADES.find(x => x.id === id);
    if (!u) return;
    const cost = getUpgradeCost(u);
    if (zState.mutagen < cost) return;
    zState.mutagen -= cost;
    zState.owned[u.id] = (zState.owned[u.id] || 0) + 1;
    saveZombieLab(); sfxMatch(3); doVibrate(35); renderZombieLab();
}

function updateZLabNumbers() {
    const { perClick, perSec } = getZLabStats();
    const clickMult = (zActiveEvent && zActiveEvent.type === 'overdrive') ? 3 : (zActiveEvent && (zActiveEvent.type === 'breach' || zActiveEvent.type === 'vampire')) ? 2 : 1;
    const secMult = (zActiveEvent && zActiveEvent.type === 'alien') ? 4 : (zActiveEvent && (zActiveEvent.type === 'cryo' || zActiveEvent.type === 'vampire')) ? 0 : 1;

    document.getElementById('zlab-val').innerText = formatNum(zState.mutagen);
    document.getElementById('zlab-click').innerText = formatNum(perClick * clickMult);
    document.getElementById('zlab-sec').innerText = formatNum(perSec * secMult);

    let stage = ZLAB_STAGES[0];
    for (const s of ZLAB_STAGES) if (zState.total >= s.min) stage = s;
    let icon = stage.icon;
    if (zActiveEvent) {
        if (zActiveEvent.type === 'cryo') icon = '🧊';
        else if (zActiveEvent.type === 'meltdown') icon = '☢️';
        else if (zActiveEvent.type === 'vampire') icon = '🦇';
    }
    document.getElementById('zlab-creature').innerText = icon;
    document.getElementById('zlab-stage').innerText = stage.name;

    ZLAB_UPGRADES.forEach(u => {
        const el = document.getElementById('zupg-' + u.id);
        if (!el) return;
        const canBuy = zState.mutagen >= getUpgradeCost(u);
        el.classList.toggle('can-buy', canBuy);
        el.classList.toggle('locked', !canBuy);
    });
}

function renderZombieLab() {
    const shop = document.getElementById('zlab-shop'); shop.innerHTML = '';
    ZLAB_UPGRADES.forEach(u => {
        const cost = getUpgradeCost(u), cnt = zState.owned[u.id] || 0, canBuy = zState.mutagen >= cost;
        const item = document.createElement('div');
        item.id = 'zupg-' + u.id; item.className = 'zlab-item ' + (canBuy ? 'can-buy' : 'locked');
        item.innerHTML = `<div class="zlab-item-left"><div class="zlab-item-icon">${u.icon}</div><div><div class="zlab-item-name">${u.name}</div><div class="zlab-item-desc">${u.desc}</div></div></div><div class="zlab-item-right"><div class="zlab-item-cost">🧪 ${formatNum(cost)}</div><div class="zlab-item-lvl">Ур. ${cnt}</div></div>`;
        item.onclick = () => buyUpgrade(u.id);
        shop.appendChild(item);
    });
    updateZLabNumbers();
}

function resetZombieLab() {
    if (!confirm('Сбросить весь прогресс Зомби-Лаборатории?')) return;
    zState = { mutagen: 0, total: 0, owned: {} };
    clearZLabEvent(); hideFloatingEvents(); saveZombieLab(); renderZombieLab();
}
