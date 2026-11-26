// ==================== НАСТРОЙКИ БАЗЫ, КУРСА, VIP И АДМИНКИ ====================
const FIREBASE_URL = 'https://gamehubonline-7b970-default-rtdb.firebaseio.com';
const ADMIN_PIN = '2010042Ki';
const GEM_RATE_RUB = 10;     // Курс валюты: 1 ₽ = 10 💎
const VIP_GEM_MULT = 2;      // Множитель гемов за игры для VIP (×2)
const TOPUP_ENABLED = false; // false = вкладка «Курс» закрыта на замок; true = открыта
const DONATE_URL = '';       // Сюда позже вставишь ссылку на оплату

const VIP_PLANS = [
    { id: 'vip_7d',   days: 7,  priceRub: 69,  icon: '⏳', title: 'VIP на 7 дней',  badge: 'Неделя' },
    { id: 'vip_30d',  days: 30, priceRub: 249, icon: '🔥', title: 'VIP на 30 дней', badge: 'Выгодно' },
    { id: 'vip_perm', days: 0,  priceRub: 499, icon: '♾️', title: 'VIP НАВСЕГДА',   badge: 'Навсегда' }
];

// ==================== СИСТЕМА ОБНОВЛЕНИЙ ====================
const APP_VERSION = '2.7';
const CHANGELOG = [
    '👑 VIP-статус (7 дней, 30 дней, Навсегда): ×2 гемов за игры и бонус дня, тег в топе, темы и своя музыка',
    '☁️ Полная облачная синхронизация: гемы, VIP, скины, рекорды и Зомби-лаба переносятся между устройствами',
    '👤 Разделение аккаунтов: разные аккаунты Telegram на одном телефоне больше не делят общий баланс',
    '⚔️ Онлайн-дуэли 1 на 1 по общему Seed'
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

const rawTgUser = tgWebApp && tgWebApp.initDataUnsafe ? tgWebApp.initDataUnsafe.user : null;
const tgUser = {
    name: rawTgUser ? [rawTgUser.first_name, rawTgUser.last_name].filter(Boolean).join(' ') : 'Игрок',
    username: (rawTgUser && rawTgUser.username) ? '@' + rawTgUser.username : 'Telegram Player',
    photo: (rawTgUser && rawTgUser.photo_url) ? rawTgUser.photo_url : ''
};

function getPlayerId() {
    if (rawTgUser && rawTgUser.id) return 'tg_' + rawTgUser.id;
    let fallbackId = null;
    try { fallbackId = localStorage.getItem('gameHubGuestId'); } catch {}
    if (!fallbackId) {
        fallbackId = 'guest_' + Math.random().toString(36).slice(2, 10);
        try { localStorage.setItem('gameHubGuestId', fallbackId); } catch {}
    }
    return fallbackId;
}

const myPlayerId = getPlayerId();
let isUserBanned = false;
let isBanSyncing = false;
let currentStyleMode = 'neon';

// ==================== ИЗОЛЯЦИЯ ПАМЯТИ ПО АККАУНТАМ И VIP-СТАТУС ====================
function userKey(base) {
    return `${base}_${myPlayerId}`;
}

function migrateLegacyKey(base) {
    const scopedKey = userKey(base);
    try {
        if (localStorage.getItem(scopedKey) !== null) return;
        const legacyVal = localStorage.getItem(base);
        if (legacyVal === null) return;

        const owner = localStorage.getItem('gameHubLegacyOwner');
        if (!owner || owner === myPlayerId) {
            localStorage.setItem('gameHubLegacyOwner', myPlayerId);
            localStorage.setItem(scopedKey, legacyVal);
        }
    } catch {}
}

let vipUntilTs = 0;
try { vipUntilTs = Number(localStorage.getItem(userKey('gameHubVipUntil'))) || 0; } catch {}

function isVipUser() {
    return vipUntilTs === -1 || vipUntilTs > Date.now();
}

function getVipStatusText() {
    if (vipUntilTs === -1) return '👑 VIP НАВСЕГДА';
    if (vipUntilTs > Date.now()) {
        const d = new Date(vipUntilTs);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `👑 VIP до ${dd}.${mm}`;
    }
    return '';
}

function setVipUntil(ts, skipCloud = false) {
    vipUntilTs = Number(ts) || 0;
    try { localStorage.setItem(userKey('gameHubVipUntil'), String(vipUntilTs)); } catch {}
    initTgProfile();
    if (typeof updateGemsUI === 'function') updateGemsUI();
    if (typeof enforceVipThemeLock === 'function') enforceVipThemeLock();
    if (typeof renderTrackList === 'function') renderTrackList();
    if (!skipCloud) scheduleCloudSave();
}

function showVipRequiredModal(featureName = '') {
    let modal = document.getElementById('vip-info-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'vip-info-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="victory-card" style="border-color:#fbbf24; max-width:350px; padding:16px;">
                <div style="font-size:2.3rem; line-height:1;">👑</div>
                <div class="victory-title" style="color:#fbbf24; font-size:1.3rem;">VIP-ДОСТУП</div>
                <div id="vip-modal-reason" class="victory-sub" style="color:#fde68a; font-weight:700;"></div>
                <ul class="changelog-list" style="text-align:left; font-size:0.8rem; margin:8px 0;">
                    <li>💎 <b>×${VIP_GEM_MULT} кристаллов</b> за победы в играх</li>
                    <li>🎁 <b>×2 ежедневный бонус</b> (до 200 💎 в день)</li>
                    <li>🎨 <b>Все темы, цвета и эффекты</b> интерфейса</li>
                    <li>🎵 <b>Вся музыка и загрузка своего MP3</b></li>
                    <li>👑 <b>Золотой статус [VIP]</b> в таблице лидеров</li>
                </ul>
                <div id="vip-modal-plans" style="display:flex; flex-direction:column; gap:6px; width:100%; margin:6px 0 8px;"></div>
                <div id="vip-modal-footer" style="font-size:0.75rem; color:#cbd5e1; margin-bottom:10px;"></div>
                <button class="btn btn-green" style="width:100%;" onclick="sfxClick(); document.getElementById('vip-info-modal').classList.remove('active');">ПОНЯТНО</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const reasonEl = document.getElementById('vip-modal-reason');
    const plansEl = document.getElementById('vip-modal-plans');
    const footerEl = document.getElementById('vip-modal-footer');

    if (reasonEl) {
        reasonEl.innerText = featureName ? `Раздел «${featureName}» открыт только для VIP` : 'Выбери подходящий тариф VIP:';
    }

    if (plansEl) {
        plansEl.innerHTML = VIP_PLANS.map(p => `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(251,191,36,0.12); border:1px solid rgba(251,191,36,0.45); border-radius:10px; padding:7px 10px;">
                <div style="text-align:left;">
                    <div style="font-size:0.84rem; font-weight:800; color:#fff;">${p.icon} ${p.title}</div>
                    <div style="font-size:0.7rem; color:#fde68a;">${p.badge}</div>
                </div>
                <div style="font-size:0.88rem; font-weight:900; color:#fbbf24; background:rgba(15,23,42,0.8); padding:4px 9px; border-radius:8px; border:1px solid #fbbf24;">
                    ${p.priceRub} ₽
                </div>
            </div>
        `).join('');
    }

    if (footerEl) {
        footerEl.innerHTML = isVipUser()
            ? `<b style="color:#4ade80;">✅ У тебя уже активен ${getVipStatusText()}!</b>`
            : `Твой ID для активации: <code>${myPlayerId}</code>`;
    }
    modal.classList.add('active');
}

// ==================== ОБЛАЧНЫЙ СЕЙВ ====================
let cloudSyncReady = false;
let cloudSaveTimer = null;

function getLocalSaveTimestamp() {
    try { return Number(localStorage.getItem(userKey('gameHubSaveTs'))) || 0; } catch { return 0; }
}

function setLocalSaveTimestamp(ts) {
    try { localStorage.setItem(userKey('gameHubSaveTs'), String(ts)); } catch {}
}

function scheduleCloudSave() {
    const now = Date.now();
    setLocalSaveTimestamp(now);
    if (!cloudSyncReady || isUserBanned) return;
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => {
        pushCloudSaveNow(now);
    }, 1200);
}

async function pushCloudSaveNow(tsOverride = null) {
    if (!cloudSyncReady || isUserBanned) return;
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) return;

    const ts = tsOverride || getLocalSaveTimestamp() || Date.now();
    const payload = {
        updatedAt: ts,
        vipUntil: vipUntilTs,
        eco: typeof ecoState !== 'undefined' ? ecoState : null,
        records: typeof hubRecords !== 'undefined' ? hubRecords : null,
        zlab: typeof zState !== 'undefined' ? zState : null
    };

    try {
        await fetch(`${baseUrl}/saves/${myPlayerId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch {}
}

async function pullCloudSave() {
    const baseUrl = FIREBASE_URL.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) {
        cloudSyncReady = true;
        return;
    }

    try {
        const res = await fetch(`${baseUrl}/saves/${myPlayerId}.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const remote = await res.json();
        const localTs = getLocalSaveTimestamp();

        if (remote && typeof remote === 'object') {
            const remoteTs = Number(remote.updatedAt) || 0;
            if (localTs === 0 || remoteTs > localTs) {
                if (remote.vipUntil !== undefined) {
                    setVipUntil(remote.vipUntil, true);
                }
                if (remote.eco && typeof applyRemoteEcoState === 'function') {
                    applyRemoteEcoState(remote.eco);
                }
                if (remote.records && typeof applyRemoteRecords === 'function') {
                    applyRemoteRecords(remote.records);
                }
                if (remote.zlab && typeof applyRemoteZLab === 'function') {
                    applyRemoteZLab(remote.zlab);
                }
                setLocalSaveTimestamp(remoteTs || Date.now());
            } else if (localTs > remoteTs) {
                cloudSyncReady = true;
                await pushCloudSaveNow(localTs);
            }
        } else if (localTs > 0) {
            cloudSyncReady = true;
            await pushCloudSaveNow(localTs);
        }
    } catch {}

    cloudSyncReady = true;
    if (typeof syncGemsToCloud === 'function') {
        await syncGemsToCloud();
    }
}

function shareGameScore(text) {
    const appUrl = 'https://broderiemegahub.github.io/GameHub/';
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(text)}`;
    if (tgWebApp && tgWebApp.openTelegramLink) {
        tgWebApp.openTelegramLink(shareUrl);
    } else {
        window.open(shareUrl, '_blank');
    }
}

function initTgProfile() {
    const nameEl = document.getElementById('tg-user-name');
    const tagEl = document.getElementById('tg-user-tag');
    const avatarEl = document.getElementById('tg-avatar');
    if (!nameEl || !avatarEl) return;

    const vip = isVipUser();
    const badge = typeof getEquippedBadgeText === 'function' ? getEquippedBadgeText() : '';
    const vipTagHtml = vip ? ` <span class="lb-badge-tag" style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0f172a;font-weight:900;">👑 VIP</span>` : '';
    const shopBadgeHtml = badge ? ` <span class="lb-badge-tag">${badge}</span>` : '';

    nameEl.innerHTML = `${tgUser.name}${vipTagHtml}${shopBadgeHtml}`;
    tagEl.innerText = vip ? `${getVipStatusText()} • ${tgUser.username}` : tgUser.username;
    tagEl.style.color = vip ? '#fbbf24' : '';

    if (vip) {
        avatarEl.style.border = '2px solid #fbbf24';
        avatarEl.style.boxShadow = '0 0 14px rgba(251, 191, 36, 0.65)';
    } else {
        avatarEl.style.border = '';
        avatarEl.style.boxShadow = '';
    }

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
    if (typeof updateGemsUI === 'function') updateGemsUI();
}

// ==================== ЕДИНЫЕ НАСТРОЙКИ ====================
function openSettings(tab = 'style') {
    if (isUserBanned) return;
    showScreen('settings-screen');
    if (typeof enforceVipThemeLock === 'function') enforceVipThemeLock();
    if (typeof renderTrackList === 'function') renderTrackList();
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

// ==================== НАВИГАЦИЯ ====================
function stopAllGames() {
    if (typeof victoryFxTimer !== 'undefined' && victoryFxTimer) {
        clearInterval(victoryFxTimer);
        victoryFxTimer = null;
    }
    document.getElementById('mj-victory-overlay').classList.remove('active');
    document.getElementById('mines-result-overlay').classList.remove('active');
    document.getElementById('tetris-result-overlay').classList.remove('active');
    const aimOverlay = document.getElementById('aim-result-overlay');
    if (aimOverlay) aimOverlay.classList.remove('active');
    const duelOverlay = document.getElementById('duel-result-overlay');
    if (duelOverlay) duelOverlay.classList.remove('active');

    if (typeof stopMines === 'function') stopMines();
    if (typeof stopTetris === 'function') stopTetris();
    if (typeof stopZombieLab === 'function') stopZombieLab();
    if (typeof stopAim === 'function') stopAim();
}

function showScreen(id) {
    if (isUserBanned) return;
    stopAllGames();
    document.getElementById('main-menu').style.display = 'none';
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
}

function backToMenu() {
    if (isUserBanned) return;
    if (typeof activeDuel !== 'undefined' && activeDuel) {
        if (!abortActiveDuel()) return;
    }
    stopAllGames();
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById('main-menu').style.display = 'flex';
    if (typeof updateGemsUI === 'function') updateGemsUI();
    if (typeof syncDuelsAndPayouts === 'function') syncDuelsAndPayouts();
}

function doVibrate(ms) {
    if (document.getElementById('vibrate-on').checked && navigator.vibrate) navigator.vibrate(ms);
}

window.oncontextmenu = (e) => { e.preventDefault(); return false; };
