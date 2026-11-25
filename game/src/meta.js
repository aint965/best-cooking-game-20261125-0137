// Dapur Kilat — meta.js
// Meta-progress that lives between shifts: the coin wallet, settings,
// achievements, missions, the daily reward, shop boosts, permanent
// upgrades and warung themes. Everything persists in localStorage under
// keys starting with 'dapur-kilat-', and nothing here ever touches the
// network. The best-score key 'dapur-kilat-best' stays untouched.

export const META_KEY = 'dapur-kilat-meta-v1';

export const THEMES = [
  {
    id: 'klasik', name: 'Warung Klasik', desc: 'Siang yang hangat di warung kampung', cost: 0,
    skyTop: '#ffd9a0', skyBot: '#ff9e7a', wall: '#f3e3c2', wallTrim: '#e0c79a',
    floor: ['#c06a44', '#c4744e', '#ba6440', '#c97a54'],
    awningA: '#b03a2e', awningB: '#f3e3c2', building: '#8a5a33', sign: '#b03a2e',
  },
  {
    id: 'pantai', name: 'Warung Pantai', desc: 'Angin laut, pasir, dan es kelapa', cost: 150,
    skyTop: '#bfe8f5', skyBot: '#fff3c4', wall: '#e0f0e8', wallTrim: '#b8d8c8',
    floor: ['#d9c08a', '#e0c996', '#cbb27a', '#e8d5a0'],
    awningA: '#2e7d8a', awningB: '#fdfdf8', building: '#7a6a4a', sign: '#2e7d8a',
  },
  {
    id: 'malam', name: 'Warung Malam', desc: 'Lampu kuning di bawah langit ungu', cost: 300,
    skyTop: '#1e2340', skyBot: '#7a4a8a', wall: '#cfc4e8', wallTrim: '#a898cc',
    floor: ['#5a4a6e', '#645578', '#524463', '#6e5f82'],
    awningA: '#4a2e6e', awningB: '#f2c14e', building: '#4a3560', sign: '#4a2e6e',
  },
];

export function themeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export const UPGRADES = [
  { id: 'knife', name: 'Pisau Tajam', desc: 'Cincang 2x ketuk, bukan 3x', cost: 120 },
  { id: 'stove', name: 'Kompor Turbo', desc: 'Goreng 3 detik, bukan 4 detik', cost: 150 },
  { id: 'heart', name: 'Hati Ekstra', desc: '+1 nyawa di setiap shift', cost: 200 },
  { id: 'service', name: 'Pelayanan Ramah', desc: 'Kesabaran pelanggan +20%', cost: 150 },
];

export const SHOP_ITEMS = [
  { id: 'life', name: 'Nyawa Tambahan', desc: '+1 nyawa untuk shift berikutnya', cost: 60 },
  { id: 'patience', name: 'Teh Manis Gratis', desc: 'Kesabaran +25% di shift berikutnya', cost: 50 },
  { id: 'double', name: 'Promo Koin Ganda', desc: 'Koin ganda di shift berikutnya', cost: 80 },
];

export const ACHIEVEMENTS = [
  { id: 'first-serve', name: 'Sajian Pertama', desc: 'Sajikan 1 hidangan', icon: '1' },
  { id: 'serve-10', name: 'Koki Sibuk', desc: 'Sajikan 10 hidangan', icon: '10' },
  { id: 'serve-25', name: 'Koki Legenda', desc: 'Sajikan 25 hidangan', icon: '25' },
  { id: 'combo-3', name: 'Kombo Panas', desc: 'Capai kombo x3', icon: 'x3' },
  { id: 'combo-5', name: 'Kombo Kilat', desc: 'Capai kombo x5', icon: 'x5' },
  { id: 'score-1000', name: 'Warung Ramai', desc: 'Raih skor 1.000', icon: '1K' },
  { id: 'score-3000', name: 'Warung Terkenal', desc: 'Raih skor 3.000', icon: '3K' },
  { id: 'perfect', name: 'Shift Sempurna', desc: 'Selesaikan shift tanpa pesanan gagal', icon: '★' },
];

export const MISSIONS = [
  { id: 'm-nasgor', name: 'Nasi Goreng x3', desc: 'Sajikan 3 Nasi Goreng Kilat', target: 3, reward: 40, track: 'nasi-goreng' },
  { id: 'm-combo', name: 'Kombo x3', desc: 'Capai kombo x3 dalam satu shift', target: 1, reward: 50, track: 'combo3' },
  { id: 'm-serve5', name: 'Lima Sajian', desc: 'Sajikan 5 hidangan dalam satu shift', target: 5, reward: 60, track: 'serveShift' },
];

export const DAILY_REWARD = 50;

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function defaultMeta() {
  return {
    coins: 0,
    settings: { music: true, sfx: true },
    upgrades: {},
    boosts: { life: 0, patience: 0, double: 0 },
    achievements: {},
    missions: {},
    daily: { lastClaim: '', streak: 0 },
    theme: 'klasik',
    ownedThemes: { klasik: true },
    stats: { totalServed: 0, bestCombo: 0, best: 0, perfectShifts: 0 },
  };
}

export function loadMeta() {
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw);
    const fresh = defaultMeta();
    return {
      ...fresh,
      ...parsed,
      settings: { ...fresh.settings, ...(parsed.settings || {}) },
      upgrades: { ...(parsed.upgrades || {}) },
      boosts: { ...fresh.boosts, ...(parsed.boosts || {}) },
      achievements: { ...(parsed.achievements || {}) },
      missions: { ...(parsed.missions || {}) },
      daily: { ...fresh.daily, ...(parsed.daily || {}) },
      ownedThemes: { klasik: true, ...(parsed.ownedThemes || {}) },
      stats: { ...fresh.stats, ...(parsed.stats || {}) },
    };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta) {
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // Storage can be off: meta then lasts this visit only.
  }
}

export function addCoins(meta, n) {
  meta.coins = Math.max(0, (meta.coins || 0) + n);
  saveMeta(meta);
  return meta.coins;
}

/** Buy a permanent upgrade. Returns { ok, reason? }. */
export function buyUpgrade(meta, id) {
  const def = UPGRADES.find((u) => u.id === id);
  if (!def) return { ok: false, reason: 'unknown' };
  if (meta.upgrades[id]) return { ok: false, reason: 'owned' };
  if (meta.coins < def.cost) return { ok: false, reason: 'poor' };
  meta.coins -= def.cost;
  meta.upgrades[id] = true;
  saveMeta(meta);
  return { ok: true };
}

/** Buy a one-shift boost. Returns { ok, reason? }. */
export function buyBoost(meta, id) {
  const def = SHOP_ITEMS.find((s) => s.id === id);
  if (!def) return { ok: false, reason: 'unknown' };
  if (meta.coins < def.cost) return { ok: false, reason: 'poor' };
  meta.coins -= def.cost;
  meta.boosts[id] = (meta.boosts[id] || 0) + 1;
  saveMeta(meta);
  return { ok: true };
}

/** What a shift starts with, after upgrades and boosts. Boosts are spent. */
export function shiftSetup(meta) {
  const setup = {
    lives: 3 + (meta.upgrades.heart ? 1 : 0) + (meta.boosts.life > 0 ? 1 : 0),
    patienceMult: (meta.upgrades.service ? 1.2 : 1) * (meta.boosts.patience > 0 ? 1.25 : 1),
    doubleCoins: meta.boosts.double > 0,
    chopTaps: meta.upgrades.knife ? 2 : 3,
    fryTime: meta.upgrades.stove ? 3 : 4,
  };
  meta.boosts.life = 0;
  meta.boosts.patience = 0;
  meta.boosts.double = 0;
  saveMeta(meta);
  return setup;
}

/** Claim today's reward. Returns { ok, coins?, streak?, reason? }. */
export function claimDaily(meta, now = new Date()) {
  const today = todayKey(now);
  if (meta.daily.lastClaim === today) return { ok: false, reason: 'claimed' };
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const streak = meta.daily.lastClaim === todayKey(yesterday) ? meta.daily.streak + 1 : 1;
  const coins = DAILY_REWARD + Math.min(50, (streak - 1) * 10);
  meta.daily.lastClaim = today;
  meta.daily.streak = streak;
  meta.coins += coins;
  saveMeta(meta);
  return { ok: true, coins, streak };
}

export function dailyAvailable(meta, now = new Date()) {
  return meta.daily.lastClaim !== todayKey(now);
}

/** Check achievements against fresh stats. Returns newly unlocked ids. */
export function checkAchievements(meta, stats) {
  const unlocked = [];
  const test = {
    'first-serve': stats.totalServed >= 1,
    'serve-10': stats.totalServed >= 10,
    'serve-25': stats.totalServed >= 25,
    'combo-3': stats.bestCombo >= 3,
    'combo-5': stats.bestCombo >= 5,
    'score-1000': stats.best >= 1000,
    'score-3000': stats.best >= 3000,
    perfect: stats.perfectShifts >= 1,
  };
  for (const a of ACHIEVEMENTS) {
    if (!meta.achievements[a.id] && test[a.id]) {
      meta.achievements[a.id] = true;
      unlocked.push(a.id);
    }
  }
  if (unlocked.length > 0) saveMeta(meta);
  return unlocked;
}

/** Record one served dish for missions. Returns the mission defs whose progress moved. */
export function recordServe(meta, recipeId, combo, servedThisShift) {
  const moved = [];
  for (const m of MISSIONS) {
    const state = meta.missions[m.id] || { progress: 0, claimed: false };
    let next = state.progress;
    if (m.track === 'nasi-goreng' && recipeId === 'nasi-goreng') next = Math.min(m.target, next + 1);
    if (m.track === 'combo3' && combo >= 3) next = 1;
    if (m.track === 'serveShift') next = Math.min(m.target, servedThisShift);
    if (next !== state.progress) {
      meta.missions[m.id] = { progress: next, claimed: state.claimed };
      moved.push(m.id);
    }
  }
  if (moved.length > 0) saveMeta(meta);
  return moved;
}

/** Claim a completed mission's reward. Returns { ok, coins?, reason? }. */
export function claimMission(meta, id) {
  const def = MISSIONS.find((m) => m.id === id);
  if (!def) return { ok: false, reason: 'unknown' };
  const state = meta.missions[id] || { progress: 0, claimed: false };
  if (state.claimed) return { ok: false, reason: 'claimed' };
  if (state.progress < def.target) return { ok: false, reason: 'incomplete' };
  meta.missions[id] = { progress: state.progress, claimed: true };
  meta.coins += def.reward;
  saveMeta(meta);
  return { ok: true, coins: def.reward };
}

/** Buy or select a warung theme. Returns { ok, reason? }. */
export function selectTheme(meta, id) {
  const def = THEMES.find((t) => t.id === id);
  if (!def) return { ok: false, reason: 'unknown' };
  if (!meta.ownedThemes[id]) {
    if (meta.coins < def.cost) return { ok: false, reason: 'poor' };
    meta.coins -= def.cost;
    meta.ownedThemes[id] = true;
  }
  meta.theme = id;
  saveMeta(meta);
  return { ok: true };
}
