// Dapur Kilat — menu.js
// The main menu and its sub-screens: screen ids, button geometry and the
// row layout every sub-screen shares. The renderer draws from these rects
// and main.js hit-tests against them, so what you see is what you click.

export const SCREEN_MENU = 'menu';
export const SCREEN_SHOP = 'shop';
export const SCREEN_MISSIONS = 'missions';
export const SCREEN_RESTAURANTS = 'restaurants';
export const SCREEN_UPGRADES = 'upgrades';
export const SCREEN_ACHIEVEMENTS = 'achievements';
export const SCREEN_DAILY = 'daily';
export const SCREEN_SETTINGS = 'settings';

export const MENU_SCREENS = [
  SCREEN_MENU, SCREEN_SHOP, SCREEN_MISSIONS, SCREEN_RESTAURANTS,
  SCREEN_UPGRADES, SCREEN_ACHIEVEMENTS, SCREEN_DAILY, SCREEN_SETTINGS,
];

export function isMenuScreen(screen) {
  return MENU_SCREENS.includes(screen);
}

// The eight home-screen buttons: two rows of four, big and thumb-friendly.
export const MENU_BUTTONS = [
  { id: 'play', label: 'MAIN', sub: 'Mulai shift', icon: 'play', screen: null },
  { id: 'shop', label: 'TOKO', sub: 'Boost sekali shift', icon: 'shop', screen: SCREEN_SHOP },
  { id: 'missions', label: 'MISI', sub: 'Tugas & hadiah', icon: 'missions', screen: SCREEN_MISSIONS },
  { id: 'restaurants', label: 'WARUNG', sub: 'Ganti tema dapur', icon: 'restaurants', screen: SCREEN_RESTAURANTS },
  { id: 'upgrades', label: 'UPGRADE', sub: 'Alat lebih hebat', icon: 'upgrades', screen: SCREEN_UPGRADES },
  { id: 'achievements', label: 'PRESTASI', sub: 'Pencapaianmu', icon: 'achievements', screen: SCREEN_ACHIEVEMENTS },
  { id: 'daily', label: 'HADIAH', sub: 'Hadiah harian', icon: 'daily', screen: SCREEN_DAILY },
  { id: 'settings', label: 'PENGATURAN', sub: 'Musik & suara', icon: 'settings', screen: SCREEN_SETTINGS },
].map((b, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  return { ...b, x: 56 + col * 296, y: 492 + row * 84, w: 280, h: 68 };
});

export function menuButtonAt(x, y) {
  return MENU_BUTTONS.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) || null;
}

export const BACK_BUTTON = { x: 24, y: 20, w: 132, h: 44 };
export const DAILY_CLAIM_BUTTON = { x: 490, y: 470, w: 300, h: 64 };

export function inRect(r, x, y) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

// Sub-screen list geometry: one shared panel, rows stacked inside it.
export const SUB_PANEL = { x: 200, y: 92, w: 880, h: 560 };
export const SUB_TITLE_Y = 150;

/**
 * Rows for a sub-screen: { id, rect, action, data }. The renderer draws
 * them and main.js acts on a click in the same rect. Row height adapts so
 * a long list (achievements) still fits the panel.
 */
export function subRows(screen, meta) {
  const rows = [];
  const panel = SUB_PANEL;
  const x = panel.x + 28;
  const w = panel.w - 56;
  let list = [];
  if (screen === SCREEN_SETTINGS) {
    list = [
      { id: 'music', kind: 'toggle', value: meta.settings.music },
      { id: 'sfx', kind: 'toggle', value: meta.settings.sfx },
    ];
  } else if (screen === SCREEN_SHOP) {
    list = [0, 1, 2].map((i) => ({ id: `shop-${i}`, kind: 'buy' }));
  } else if (screen === SCREEN_UPGRADES) {
    list = [0, 1, 2, 3].map((i) => ({ id: `upgrade-${i}`, kind: 'buy' }));
  } else if (screen === SCREEN_ACHIEVEMENTS) {
    list = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ id: `ach-${i}`, kind: 'info' }));
  } else if (screen === SCREEN_MISSIONS) {
    list = [0, 1, 2].map((i) => ({ id: `mission-${i}`, kind: 'claim' }));
  } else if (screen === SCREEN_RESTAURANTS) {
    list = [0, 1, 2].map((i) => ({ id: `theme-${i}`, kind: 'select' }));
  }
  const h = list.length > 4 ? 48 : 72;
  const gap = list.length > 4 ? 8 : 14;
  const y0 = SUB_TITLE_Y + 34;
  list.forEach((row, i) => {
    rows.push({ ...row, rect: { x, y: y0 + i * (h + gap), w, h } });
  });
  return rows;
}

export function subRowAt(screen, meta, x, y) {
  return subRows(screen, meta).find((r) => inRect(r.rect, x, y)) || null;
}
