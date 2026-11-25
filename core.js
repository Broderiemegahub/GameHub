// ==================== НАСТРОЙКИ БАЗЫ, КУРСА И АДМИНКИ ====================
const FIREBASE_URL = 'https://gamehubonline-7b970-default-rtdb.firebaseio.com';
const ADMIN_PIN = '20100420Ki';
const GEM_RATE_RUB = 10;     // Курс валюты: 1 ₽ = 10 💎
const TOPUP_ENABLED = false; // false = вкладка «Курс» закрыта на замок; true = открыта
const DONATE_URL = '';       // Сюда позже вставишь ссылку на Tribute / DonationAlerts

// ==================== СИСТЕМА ОБНОВЛЕНИЙ ====================
const APP_VERSION = '2.5';
const CHANGELOG = [
    '💣 В Магазин добавлена вкладка «Сапёр» со скинами поля и кастомными метками вместо флагов',
    '🎨 Исправлены цвета цифр (1–8) в Сапёре — теперь каждая цифра чётко выделяется',
    '🛒 В шапку Сапёра добавлена кнопка быстрого перехода в магазин',
    '⚔️ Сохранена полная поддержка онлайн-дуэлей 1 на 1 по общему Seed'
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
