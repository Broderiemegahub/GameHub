// ==================== НАСТРОЙКИ БАЗЫ, КУРСА И АДМИНКИ ====================
const FIREBASE_URL = 'https://gamehubonline-7b970-default-rtdb.firebaseio.com';
const ADMIN_PIN = '2010042Ki';
const GEM_RATE_RUB = 10;     // Курс валюты: 1 ₽ = 10 💎
const TOPUP_ENABLED = false; // false = вкладка «Курс» закрыта на замок; true = открыта
const DONATE_URL = '';       // Сюда позже вставишь ссылку на Tribute / DonationAlerts

// ==================== СИСТЕМА ОБНОВЛЕНИЙ ====================
const APP_VERSION = '2.6';
const CHANGELOG = [
    '☁️ Полная облачная синхронизация: гемы, скины, рекорды и Зомби-лаба теперь переносятся между устройствами',
    '👤 Разделение аккаунтов: разные аккаунты Telegram на одном телефоне больше не делят общий баланс и админку',
    '💣 Магазин для Сапёра со скинами поля и кастомными метками вместо флагов',
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

// ==================== ИЗОЛЯЦИЯ ПАМЯТИ ПО АККАУНТАМ И ОБЛАЧНЫЙ СЕЙВ ====================
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
            // Загружаем из облака, если на этом устройстве ещё нет сейва или облако свежее
            if (localTs === 0 || remoteTs > localTs) {
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

    const badge = typeof getEquippedBadgeText === 'function' ? getEquippedBadgeText() : '';
    nameEl.innerHTML = badge ? `${tgUser.name} <span class="lb-badge-tag">${badge}</span>` : tgUser.name;
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
    if (typeof updateGemsUI === 'function') updateGemsUI();
}

// ==================== ЕДИНЫЕ НАСТРОЙКИ ====================
function openSettings(tab = 'style') {
    if (isUserBanned) return;
    showScreen('settings-screen');
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
