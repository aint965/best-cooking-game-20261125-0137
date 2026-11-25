// Dapur Kilat — render.js
// Drawing only: the game state in, pixels out. The kitchen is drawn with
// canvas shapes (its own look: warm warung walls, terracotta tiles, dark
// wood counters), every ingredient drawn so it looks worth serving, and the
// order board, timer and plates all readable at a glance when shrunk.

import { INGREDIENTS, RECIPES, FRY_TIME, BURN_AFTER } from './recipes.js';
import { burnerState } from './kitchen.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const W = 1280;
const H = 720;
const FONT = '"Trebuchet MS", Verdana, sans-serif';

const C = {
  wall: '#f3e3c2',
  wallTrim: '#e0c79a',
  floorA: '#c96f4a',
  floorB: '#b95f3d',
  wood: '#7a4a2b',
  woodDark: '#5d3620',
  counter: '#8a5a33',
  counterTop: '#a9713f',
  steel: '#9aa5ad',
  steelDark: '#6e7a82',
  paper: '#fff8e7',
  paperDark: '#f0e2c0',
  ink: '#3a2a1a',
  muted: '#7a6a55',
  red: '#d9382b',
  green: '#3d8a3d',
  gold: '#f2c14e',
  cream: '#fff3d6',
};

export const MUTE_BUTTON = { x: 1208, y: 672, w: 56, h: 36 };

/**
 * The regulars at the serving window — six different people, not one face
 * with different hats. Each has a face shape of their own (round, oval,
 * square jaw, long, wide), a skin tone, a hair style and colour, and an
 * outfit. The renderer draws their expression from their patience: calm
 * while they wait, worried as it runs down, angry when it is nearly gone.
 */
export const CUSTOMERS = [
  { name: 'Pak Budi', skin: '#d9a06b', face: 'round', hair: 'grey-side', hairColor: '#e8e8e8', outfit: '#3f6b8a', glasses: true, moustache: true, moustacheColor: '#a8a8a8' },
  { name: 'Bu Sari', skin: '#e8b98a', face: 'oval', hair: 'bun', hairColor: '#2b2b2b', outfit: '#b03a2e', earrings: true },
  { name: 'Mas Dedi', skin: '#c98a5a', face: 'square', hair: 'peci', hairColor: '#1f1f1f', outfit: '#3f7a4a', hat: 'peci', stubble: true },
  { name: 'Mbak Rina', skin: '#a06a42', face: 'long', hair: 'curly', hairColor: '#2b2b2b', outfit: '#7a4a8a', hat: 'headband' },
  { name: 'Bang Jono', skin: '#8a5a34', face: 'wide', hair: 'bald', hairColor: '#1f1f1f', outfit: '#8a6a2e', moustache: true, moustacheColor: '#1f1f1f', beard: true },
  { name: 'Teh Dewi', skin: '#f0c8a0', face: 'oval', hair: 'hijab', hairColor: '#b03a6e', outfit: '#b03a6e', hijab: true },
];

/** The menu board's four dishes of the day, with their prices. */
const MENU_TODAY = ['nasi-goreng', 'mie-ayam', 'ayam-geprek', 'telur-balado'];

/** The money box sits on the serving counter, at the window's right end. */
const MONEY_BOX = { x: 1222, y: 404, w: 30, h: 22 };

/** A customer's spot at the window, one per open order, left to right. */
function customerSpot(index) {
  return { x: 972 + index * 106, y: 354 };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / W, height / H);
    view.x = (width - W * view.scale) / 2;
    view.y = (height - H * view.scale) / 2;
  }

  function text(value, x, y, size, color, align = 'left', weight = 'bold') {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ellipse(x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  }

  // ------------------------------------------------------------ food icons

  /** One ingredient, drawn with shapes, at (x, y) with the given size. */
  function drawFood(ingId, x, y, size, prep = 'ready') {
    const ing = INGREDIENTS[ingId];
    const s = size / 40; // icons are drawn in a 40px box
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const chopped = prep === 'chopped';
    const fried = prep === 'fried';
    if (ingId === 'nasi') {
      // A mound of rice: a shaded dome, grain flecks, fried shallots and
      // green onion when fried, a krupuk shard leaning on it.
      ctx.fillStyle = '#b8452f';
      ellipse(0, 6, 17, 9);
      ctx.fill();
      ctx.fillStyle = fried ? '#eec25e' : '#f7ecd0';
      ctx.beginPath();
      ctx.arc(0, 2, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = fried ? '#d9a441' : '#e8d9b0';
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * 5, -2 + Math.abs(i), 1.6, 0, Math.PI * 2); ctx.fill(); }
      if (fried) {
        ctx.fillStyle = '#a34d1e';
        for (const [sx, sy] of [[-7, -4], [2, -8], [8, -2]]) { ctx.beginPath(); ctx.arc(sx, sy, 1.8, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#4da34d';
        ctx.fillRect(-9, -7, 5, 2);
        ctx.fillRect(4, -10, 5, 2);
        ctx.fillStyle = '#e8823a';
        ctx.beginPath(); ctx.moveTo(12, -2); ctx.lineTo(19, -12); ctx.lineTo(16, -1); ctx.closePath(); ctx.fill();
      }
    } else if (ingId === 'mie') {
      // A nest of noodles: wavy strands, shallots, chilli slices, a lime
      // wedge, and a sheen when fried.
      ctx.strokeStyle = fried ? '#d9a441' : '#f2c14e';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 3, 13 - i * 3.4, Math.PI * 0.1, Math.PI * 1.2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#b98a1e';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 3, 8, Math.PI * 0.4, Math.PI * 0.9); ctx.stroke();
      if (fried) {
        ctx.fillStyle = '#4da34d';
        ctx.fillRect(-11, -11, 5, 3);
        ctx.fillRect(7, -13, 5, 3);
        ctx.fillStyle = '#d9382b';
        ctx.beginPath(); ctx.arc(-2, -12, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7a9b4a';
        ctx.beginPath(); ctx.moveTo(12, 8); ctx.lineTo(18, 4); ctx.lineTo(16, 11); ctx.closePath(); ctx.fill();
      }
    } else if (ingId === 'telur') {
      if (fried) {
        // A fried egg with a crispy, wavy edge and a glossy yolk.
        ctx.fillStyle = '#f7e8c0';
        ctx.beginPath();
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          const rr = 15 + (a % 2 === 0 ? 3 : 0);
          const px = Math.cos(ang) * rr;
          const py = 2 + Math.sin(ang) * rr * 0.75;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff8e0';
        ellipse(0, 2, 14, 10);
        ctx.fill();
        ctx.fillStyle = '#f2a93b';
        ctx.beginPath(); ctx.arc(2, 2, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e08a1e';
        ctx.beginPath(); ctx.arc(2, 2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#fff3d6';
        ellipse(0, 2, 11, 14);
        ctx.fill();
        ctx.fillStyle = '#e8d9b0';
        ctx.beginPath(); ctx.arc(0, -12, 3, 0, Math.PI * 2); ctx.fill();
      }
    } else if (ingId === 'ayam') {
      // A chicken drumstick: golden-brown crispy skin with dark speckles,
      // a pale bone with two knobs.
      ctx.fillStyle = fried ? '#8a3d12' : '#c96a3a';
      ctx.beginPath(); ctx.arc(-3, 0, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = fried ? '#c96a2e' : '#e08a5a';
      ctx.beginPath(); ctx.arc(-3, 0, 11, 0, Math.PI * 2); ctx.fill();
      if (fried) {
        ctx.fillStyle = '#7a3410';
        for (const [sx, sy] of [[-9, -5], [-1, -8], [-8, 4], [3, 3]]) { ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#e8823a';
        ctx.beginPath(); ctx.arc(-6, -3, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#f7ecd0';
      ctx.fillRect(6, -2, 10, 4);
      ctx.beginPath(); ctx.arc(18, -4, 3, 0, Math.PI * 2); ctx.arc(18, 4, 3, 0, Math.PI * 2); ctx.fill();
    } else if (ingId === 'cabai') {
      if (chopped) {
        // Chilli rings: red circles with pale seeds in the middle.
        for (const [px, py, r] of [[-10, 4, 6], [0, -5, 7], [10, 5, 6], [2, 8, 5]]) {
          ctx.fillStyle = '#d9382b';
          ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f7ecd0';
          ctx.beginPath(); ctx.arc(px, py, r * 0.4, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        ctx.strokeStyle = '#d9382b';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(2, 4, 13, Math.PI * 1.1, Math.PI * 2.05); ctx.stroke();
        ctx.strokeStyle = '#4da34d';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(12, -8); ctx.lineTo(18, -13); ctx.stroke();
      }
    } else if (ingId === 'sayur') {
      if (chopped) {
        // Chopped greens with a tomato slice for colour.
        ctx.fillStyle = '#4da34d';
        for (const [px, py] of [[-11, 3], [-2, -5], [8, 2], [0, 8], [11, -6]]) { ctx.fillRect(px, py, 7, 4); }
        ctx.fillStyle = '#2c6b2f';
        ctx.fillRect(-6, 2, 6, 3);
        ctx.fillStyle = '#d9382b';
        ctx.beginPath(); ctx.arc(11, -8, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e8a13a';
        ctx.beginPath(); ctx.arc(11, -8, 2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#4da34d';
        ellipse(-6, 0, 9, 13);
        ctx.fill();
        ellipse(7, -2, 8, 12);
        ctx.fill();
        ctx.strokeStyle = '#2c6b2f';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-6, 10); ctx.moveTo(7, -11); ctx.lineTo(7, 8); ctx.stroke();
      }
    } else if (ingId === 'kecap') {
      ctx.fillStyle = '#3d2412';
      roundRect(-8, -6, 16, 22, 4);
      ctx.fill();
      ctx.fillRect(-5, -16, 10, 11);
      ctx.fillStyle = '#d9382b';
      ctx.fillRect(-8, 2, 16, 8);
      ctx.fillStyle = '#fff8e7';
      text('K', 0, 10, 8, '#fff8e7', 'center');
    }
    ctx.restore();
    void ing;
  }

  /** Two steam wisps rising from something hot, swaying with the clock. */
  function drawSteam(x, y, now, scale = 1) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2 * scale;
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const wob = Math.sin(now * 3 + i * 2.1) * 3 * scale;
      ctx.beginPath();
      ctx.moveTo(x - 8 * scale + i * 16 * scale + wob, y);
      ctx.quadraticCurveTo(x - 6 * scale + i * 16 * scale, y - 10 * scale, x - 8 * scale + i * 16 * scale + wob, y - 18 * scale);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * A finished dish on a plate: the ingredients composed into one meal —
   * rice or noodles as the base, chicken and egg on top, greens at the
   * side, chilli slices, a cucumber slice and a krupuk shard for garnish,
   * kecap drizzled over it, and steam while it is hot.
   */
  function drawPlatedDish(items, x, y, size, now, steam = true) {
    const s = size / 100; // dishes are drawn in a 100px box
    // The plate itself: white with a blue rim.
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#fdfdf8';
    ellipse(0, 0, 50, 33);
    ctx.fill();
    ctx.strokeStyle = '#7a9bb8';
    ctx.lineWidth = 3;
    ellipse(0, 0, 44, 28);
    ctx.stroke();
    ctx.restore();
    const has = (id) => items.includes(id);
    // Food positions and sizes scale with the dish, so a small etalase
    // plate composes the same way as a full-size serving plate.
    if (has('nasi')) drawFood('nasi', x - 8 * s, y - 2 * s, 52 * s, 'fried');
    if (has('mie')) drawFood('mie', x - 6 * s, y - 2 * s, 52 * s, 'fried');
    if (has('ayam')) drawFood('ayam', x + 22 * s, y - 6 * s, 40 * s, 'fried');
    if (has('telur')) drawFood('telur', x + 6 * s, y - 12 * s, 34 * s, 'fried');
    if (has('sayur')) drawFood('sayur', x - 26 * s, y + 8 * s, 30 * s, 'chopped');
    if (has('cabai')) drawFood('cabai', x + 24 * s, y + 10 * s, 26 * s, 'chopped');
    // Garnish, drawn in the dish's own 100px box so it scales with it:
    // a kecap drizzle over the rice or noodles when the dish has kecap,
    // always a cucumber slice and a krupuk shard at the plate's edge.
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (has('kecap')) {
      ctx.strokeStyle = '#3d2412';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-22, -8);
      ctx.lineTo(-10, -2);
      ctx.lineTo(2, -9);
      ctx.lineTo(14, -3);
      ctx.stroke();
    }
    ctx.fillStyle = '#7a9b4a';
    ctx.beginPath(); ctx.arc(-34, 12, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9e0a0';
    ctx.beginPath(); ctx.arc(-34, 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8823a';
    ctx.beginPath();
    ctx.moveTo(32, 14);
    ctx.lineTo(42, 2);
    ctx.lineTo(40, 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (steam && items.length > 0) drawSteam(x - 6 * s, y - 28 * s, now, 0.9 * s);
  }

  // ------------------------------------------------------------ the kitchen

  /** A small deterministic hash, so the floor pattern is the same every run. */
  function tileHash(tx, ty) {
    let h = (tx * 374761393 + ty * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function drawWall() {
    // The wall band between the top bar and the order board: subway tiles,
    // a shelf with jars on the left, hanging pans on the right.
    ctx.fillStyle = '#efe0bd';
    ctx.fillRect(0, 64, W, 36);
    const tw = 64;
    const th = 18;
    for (let row = 0; row < 2; row++) {
      for (let col = -1; col < 21; col++) {
        const off = row % 2 === 0 ? 0 : tw / 2;
        ctx.fillStyle = (col + row) % 2 === 0 ? '#f3e3c2' : '#e7d3a8';
        ctx.fillRect(col * tw + off, 64 + row * th, tw - 2, th - 2);
      }
    }
    // Shelf with jars, left.
    ctx.fillStyle = '#5d3620';
    ctx.fillRect(48, 88, 252, 8);
    const jars = [
      { x: 66, color: '#7a9b4a', lid: '#5d3620' },
      { x: 128, color: '#d9382b', lid: '#5d3620' },
      { x: 190, color: '#3d2412', lid: '#d9382b' },
      { x: 246, color: '#e8b64c', lid: '#5d3620' },
    ];
    for (const jar of jars) {
      ctx.fillStyle = jar.color;
      roundRect(jar.x, 66, 30, 22, 5);
      ctx.fill();
      ctx.fillStyle = jar.lid;
      ctx.fillRect(jar.x + 4, 62, 22, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(jar.x + 6, 70, 4, 14);
    }
    // Hanging rail with pans and a ladle, right.
    ctx.fillStyle = '#6e7a82';
    ctx.fillRect(1000, 68, 240, 4);
    for (const hx of [1024, 1080, 1136, 1192]) {
      ctx.fillStyle = '#4a545a';
      ctx.fillRect(hx - 1, 72, 2, 6);
    }
    for (const px of [1024, 1080, 1136]) {
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath(); ctx.arc(px, 90, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9aa5ad';
      ctx.beginPath(); ctx.arc(px, 90, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(px - 1, 76, 2, 6);
    }
    // Ladle: bowl and handle.
    ctx.strokeStyle = '#9aa5ad';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(1192, 78); ctx.lineTo(1192, 94); ctx.stroke();
    ctx.fillStyle = '#9aa5ad';
    ctx.beginPath(); ctx.arc(1192, 96, 5, 0, Math.PI * 2); ctx.fill();
    // A wall clock in the middle of the band, hands at ten past ten.
    ctx.fillStyle = '#fdfdf8';
    ctx.beginPath(); ctx.arc(640, 82, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(640, 82, 15, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(640, 82); ctx.lineTo(635, 73); ctx.moveTo(640, 82); ctx.lineTo(648, 78); ctx.stroke();
    // A framed picture of a steaming bowl of noodles, next to the clock.
    ctx.fillStyle = C.woodDark;
    ctx.fillRect(838, 66, 46, 30);
    ctx.fillStyle = '#f3e3c2';
    ctx.fillRect(842, 70, 38, 22);
    ctx.fillStyle = '#b8452f';
    ellipse(861, 86, 13, 5);
    ctx.fill();
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(861, 82, 8, Math.PI * 0.2, Math.PI * 1.1); ctx.stroke();
  }

  function drawFloor() {
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 168, W, 472);
    drawWall();
    // Terracotta tiles in close warm tones, so the floor reads as worn
    // kitchen tile instead of a flat checkerboard: the shades stay within
    // one family, with only the odd sage or cream accent tile.
    const tile = 58;
    const shades = ['#c06a44', '#c4744e', '#ba6440', '#c97a54'];
    for (let ty = 0; ty < 8; ty++) {
      for (let tx = 0; tx < 23; tx++) {
        const h = tileHash(tx, ty);
        if (h < 0.03) ctx.fillStyle = '#7a8b5a';
        else if (h < 0.06) ctx.fillStyle = '#e8d9b0';
        else ctx.fillStyle = shades[Math.floor(h * 4) % 4];
        ctx.fillRect(tx * tile, 176 + ty * tile, tile, tile);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    for (let ty = 0; ty < 8; ty++) ctx.fillRect(0, 176 + ty * tile, W, 2);
    for (let tx = 0; tx < 23; tx++) ctx.fillRect(tx * tile, 176, 2, 464);
    // Wear: faint stains and scuffs on the open floor, never under a counter.
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (const [sx, sy, rx, ry] of [[300, 660, 46, 18], [980, 660, 54, 20], [520, 240, 40, 14], [1120, 600, 36, 14], [180, 620, 30, 12]]) {
      ellipse(sx, sy, rx, ry);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 3;
    for (const [sx, sy] of [[420, 700], [860, 700], [1050, 250]]) {
      ctx.beginPath(); ctx.arc(sx, sy, 26, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
    }
    // Woven round rugs on the open floor, where the cook crosses the room.
    drawRug(190, 598, 70);
    drawRug(1080, 592, 58);
    // Floor mats where the cook stands to work: stove, plates, window.
    drawMat(560, 436, 260, 42, '#4a5d3a', '#33402a');
    drawMat(380, 600, 340, 32, '#3f6b5e', '#2c4d43');
    drawMat(1000, 496, 156, 48, '#8a4a30', '#6b3822');
    // Wall band above the floor.
    ctx.fillStyle = C.wallTrim;
    ctx.fillRect(0, 168, W, 8);
    drawStreet();
  }

  /** A round woven rug: concentric rings in terracotta and cream. */
  function drawRug(x, y, r) {
    ctx.fillStyle = '#8a4a30';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a9713f';
    ctx.beginPath(); ctx.arc(x, y, r * 0.82, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8d9b0';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c96f4a';
    ctx.beginPath(); ctx.arc(x, y, r * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8d9b0';
    ctx.beginPath(); ctx.arc(x, y, r * 0.16, 0, Math.PI * 2); ctx.fill();
  }

  /**
   * The street below the warung: a striped awning edge, a sidewalk where
   * two regulars sit eating at small tables, and the road with a parked
   * motorbike, a cat, and a dashed centre line. The cook never walks here.
   */
  function drawStreet() {
    // Striped awning edge across the warung's front, in the two stretches
    // not covered by a counter (the stations draw over any overlap).
    drawAwning(24, 360);
    drawAwning(760, 496);
    // Sidewalk.
    ctx.fillStyle = '#d8cbb2';
    ctx.fillRect(0, 646, W, 40);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 646, W, 3);
    ctx.fillRect(0, 683, W, 3);
    // Road.
    ctx.fillStyle = '#3d3a38';
    ctx.fillRect(0, 686, W, 34);
    ctx.fillStyle = '#f2c14e';
    for (let x = 20; x < W; x += 56) ctx.fillRect(x, 701, 30, 4);
    // A parked motorbike on the road, left.
    drawMotorbike(150, 712);
    // A cat sitting on the road, right.
    ctx.fillStyle = '#4a4a4a';
    ellipse(1000, 712, 12, 7);
    ctx.fill();
    ctx.beginPath(); ctx.arc(1008, 702, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1003, 696); ctx.lineTo(1005, 690); ctx.lineTo(1008, 696); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1009, 696); ctx.lineTo(1012, 690); ctx.lineTo(1014, 697); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(989, 712); ctx.quadraticCurveTo(980, 706, 984, 698); ctx.stroke();
    // Potted plants flanking the sidewalk.
    drawPlant(52, 686);
    drawPlant(1236, 686);
    // Two regulars eating at small tables on the sidewalk, clear of the
    // awning stripes above them and of the plate labels overhead.
    drawSeatedCustomer(CUSTOMERS[4], 300, 656);
    drawSeatedCustomer(CUSTOMERS[5], 860, 656);
    // Hanging lamps under the awning, glowing warm.
    drawLamp(200, 646);
    drawLamp(1100, 646);
  }

  /** One striped awning segment: red and cream vertical stripes. */
  function drawAwning(x, w) {
    for (let i = 0; i < w / 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#b03a2e' : '#f3e3c2';
      ctx.fillRect(x + i * 16, 636, 16, 12);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x, 646, w, 2);
  }

  /** A small scooter, parked: two wheels, a body, a handlebar. */
  function drawMotorbike(x, y) {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(x - 24, y, 9, 0, Math.PI * 2); ctx.arc(x + 26, y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a2f26';
    ctx.beginPath();
    ctx.moveTo(x - 30, y - 4);
    ctx.lineTo(x - 18, y - 16);
    ctx.lineTo(x + 8, y - 16);
    ctx.lineTo(x + 22, y - 6);
    ctx.lineTo(x + 30, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5d3620';
    ctx.fillRect(x - 14, y - 22, 16, 6);
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 20, y - 14); ctx.lineTo(x + 28, y - 24); ctx.stroke();
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath(); ctx.arc(x + 30, y - 8, 3, 0, Math.PI * 2); ctx.fill();
  }

  /** A potted plant: a terracotta pot with green leaves. */
  function drawPlant(x, y) {
    ctx.fillStyle = '#4da34d';
    for (const [lx, ly, lr] of [[-8, -14, 7], [0, -20, 8], [8, -14, 7], [-3, -10, 6]]) {
      ctx.beginPath(); ctx.arc(x + lx, y + ly, lr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#b95f3d';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 8);
    ctx.lineTo(x + 12, y - 8);
    ctx.lineTo(x + 8, y + 4);
    ctx.lineTo(x - 8, y + 4);
    ctx.closePath();
    ctx.fill();
  }

  /** A pendant lamp hanging from the awning, with a warm glow. */
  function drawLamp(x, y) {
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke();
    ctx.fillStyle = 'rgba(242,193,78,0.25)';
    ctx.beginPath(); ctx.arc(x, y + 26, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 16);
    ctx.lineTo(x + 9, y + 16);
    ctx.lineTo(x + 6, y + 26);
    ctx.lineTo(x - 6, y + 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath(); ctx.arc(x, y + 28, 4, 0, Math.PI * 2); ctx.fill();
  }

  /** One regular seated at a sidewalk table, eating a plate of food. */
  function drawSeatedCustomer(c, x, y) {
    drawCustomer(c, x, y, 0, 0.42);
    // The table, drawn over the customer's body: round top, one leg.
    ctx.fillStyle = '#7a4a2b';
    ctx.fillRect(x - 3, y + 16, 6, 16);
    ctx.fillStyle = '#a9713f';
    ellipse(x, y + 16, 36, 10);
    ctx.fill();
    ctx.strokeStyle = '#5d3620';
    ctx.lineWidth = 2;
    ellipse(x, y + 16, 36, 10);
    ctx.stroke();
    // A small plate of food on the table, steaming.
    drawPlatedDish(['nasi', 'ayam', 'sayur'], x + 8, y + 12, 26, 0, true);
    ctx.fillStyle = '#7a9b4a';
    ctx.beginPath(); ctx.arc(x - 20, y + 12, 5, 0, Math.PI * 2); ctx.fill();
  }

  /** A woven-look floor mat: dark base, lighter border, dashed centre line. */
  function drawMat(x, y, w, h, color, border) {
    ctx.fillStyle = color;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    roundRect(x + 3, y + 3, w - 6, h - 6, 6);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(x + 10, y + h / 2);
    ctx.lineTo(x + w - 10, y + h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawCrates(game) {
    for (const s of game.stations) {
      if (s.kind !== 'crate') continue;
      const ing = INGREDIENTS[s.ing];
      const r = s.rect;
      // Crates alternate two wood tones, so the row reads less flat.
      const tone = (game.stations.indexOf(s) % 2 === 0) ? '#a9713f' : '#96603a';
      ctx.fillStyle = C.wood;
      roundRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 8);
      ctx.fill();
      ctx.fillStyle = tone;
      roundRect(r.x, r.y, r.w, r.h, 6);
      ctx.fill();
      drawFood(s.ing, r.x + r.w / 2, r.y + 30, 44, 'ready');
      text(ing.name, r.x + r.w / 2, r.y + r.h - 8, 14, '#fff8e7', 'center');
    }
  }

  function drawBoard(game) {
    const s = game.stations.find((st) => st.id === 'board');
    const r = s.rect;
    ctx.fillStyle = C.counter;
    roundRect(r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    // Sage-green counter top, so the board reads apart from the wood crates.
    ctx.fillStyle = '#7a8b5a';
    roundRect(r.x, r.y, r.w, 26, 10);
    ctx.fill();
    // The wooden board itself.
    ctx.fillStyle = '#d9b380';
    roundRect(r.x + 30, r.y + 36, 160, 62, 8);
    ctx.fill();
    ctx.fillStyle = '#c9a06a';
    roundRect(r.x + 30, r.y + 36, 160, 10, 8);
    ctx.fill();
    const board = game.board;
    if (board.item) {
      drawFood(board.item.ing, r.x + 110, r.y + 62, 40, 'chopped');
      // Chop progress: three knife marks fill in, counted on the counter top.
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < board.taps ? C.red : 'rgba(0,0,0,0.18)';
        ctx.fillRect(r.x + 52 + i * 36, r.y + 104, 28, 8);
      }
      text(`CINCANG ${board.taps}/3`, r.x + r.w / 2, r.y + 19, 12, '#fff8e7', 'center');
    } else {
      // Empty-board hint in a dark brown, so it stays readable on the tan
      // board instead of washing out.
      text('TALENAN', r.x + r.w / 2, r.y + 62, 16, '#6b4a26', 'center');
      text('bawa cabai / sayur ke sini', r.x + r.w / 2, r.y + 84, 11, '#6b4a26', 'center');
    }
  }

  function drawStove(game) {
    const stove = game.stations.find((st) => st.id === 'stove');
    const r = stove.rect;
    ctx.fillStyle = C.steelDark;
    roundRect(r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.fillStyle = C.steel;
    roundRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12, 8);
    ctx.fill();
    for (const s of game.stations) {
      if (s.kind !== 'burner') continue;
      const b = game.burners[s.burner];
      const state = burnerState(b);
      const cx = s.rect.x + s.rect.w / 2;
      const cy = s.rect.y + s.rect.h / 2;
      // Burner ring.
      ctx.fillStyle = state === 'burnt' ? '#3a3a3a' : '#2b2b2b';
      ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = state === 'cooking' ? '#e8823a' : '#444';
      ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
      if (b.item) {
        // The pan and its contents.
        ctx.fillStyle = '#1f1f1f';
        ellipse(cx, cy, 30, 22);
        ctx.fill();
        drawFood(b.item.ing, cx, cy - 2, 36, state === 'done' || state === 'burnt' ? 'fried' : 'ready');
        if (state === 'cooking') {
          const frac = Math.min(1, b.t / FRY_TIME);
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(cx - 30, cy + 26, 60, 6);
          ctx.fillStyle = C.gold;
          ctx.fillRect(cx - 30, cy + 26, 60 * frac, 6);
          // Steam wisps.
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 2;
          for (let i = 0; i < 2; i++) {
            const wob = Math.sin((game.now * 3 + i * 2)) * 3;
            ctx.beginPath();
            ctx.moveTo(cx - 10 + i * 20 + wob, cy - 18);
            ctx.quadraticCurveTo(cx - 8 + i * 20, cy - 30, cx - 10 + i * 20 + wob, cy - 40);
            ctx.stroke();
          }
        } else if (state === 'done') {
          ctx.fillStyle = C.gold;
          text('SIAP!', cx, cy - 42, 14, C.gold, 'center');
        } else if (state === 'burnt') {
          ctx.fillStyle = '#111';
          ctx.beginPath(); ctx.arc(cx, cy - 30, 5, 0, Math.PI * 2); ctx.fill();
          text('GOSONG!', cx, cy - 42, 13, '#222', 'center');
        }
      } else {
        ctx.fillStyle = '#5a646c';
        ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function drawPlates(game) {
    for (const s of game.stations) {
      if (s.kind !== 'plate') continue;
      const plate = game.plates[s.plate];
      const cx = s.rect.x + s.rect.w / 2;
      const cy = s.rect.y + s.rect.h / 2;
      // Counter under the plate, with a checker tile trim along its top.
      ctx.fillStyle = C.counter;
      roundRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h, 10);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#e8d9b0' : '#b95f3d';
        ctx.fillRect(s.rect.x + 6 + i * 15, s.rect.y + 4, 13, 8);
      }
      // The plate, composed into one dish with garnish and steam.
      if (plate.items.length > 0) {
        drawPlatedDish(plate.items, cx, cy, 104, game.now, true);
      } else {
        ctx.fillStyle = '#fdfdf8';
        ellipse(cx, cy, 52, 34);
        ctx.fill();
        ctx.strokeStyle = '#d8cdb4';
        ctx.lineWidth = 2;
        ellipse(cx, cy, 44, 28);
        ctx.stroke();
      }
      const n = plate.items.length;
      const complete = game.orders.some((o) => o.recipe.items.length === n && o.recipe.items.every((ing) => plate.items.includes(ing)));
      if (n > 0 && complete) {
        const pulse = 0.6 + 0.4 * Math.sin(game.now * 5);
        ctx.strokeStyle = `rgba(242,193,78,${pulse})`;
        ctx.lineWidth = 4;
        ellipse(cx, cy, 58, 40);
        ctx.stroke();
      }
    }
  }

  /**
   * One customer: a face shape of their own (round, oval, square jaw, long
   * or wide), their skin tone and hair, and an expression that follows
   * their patience — mood 0 calm (a smile), 1 worried (raised brows, a
   * sweat drop), 2 angry (angled brows, a frown, flushed cheeks, steam).
   * Drawn at (cx, cy) — the centre of the head — at the given scale.
   */
  function drawCustomer(c, cx, cy, mood = 0, scale = 1) {
    const r = 40 * scale;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    // Shoulders and outfit.
    ctx.fillStyle = c.outfit;
    ctx.beginPath();
    ctx.ellipse(0, 78, 52, 30, 0, Math.PI, 0);
    ctx.fill();
    // A hijab frames the face and drapes to the shoulders.
    if (c.hijab) {
      ctx.fillStyle = c.hairColor;
      ctx.beginPath(); ctx.arc(0, 6, 50, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-50, 0, 100, 60);
    }
    // The face itself, shaped per person.
    ctx.fillStyle = c.skin;
    if (c.face === 'round') {
      ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
    } else if (c.face === 'oval') {
      ctx.beginPath(); ctx.ellipse(0, 2, 37, 45, 0, 0, Math.PI * 2); ctx.fill();
    } else if (c.face === 'square') {
      // A square jaw, but softly rounded so it still reads as a face.
      roundRect(-36, -42, 72, 84, 20);
      ctx.fill();
    } else if (c.face === 'long') {
      ctx.beginPath(); ctx.ellipse(0, 2, 34, 49, 0, 0, Math.PI * 2); ctx.fill();
    } else if (c.face === 'wide') {
      ctx.beginPath(); ctx.ellipse(0, 0, 47, 38, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Flushed cheeks when angry, before the features go on.
    if (mood === 2) {
      ctx.fillStyle = 'rgba(217,56,43,0.28)';
      ctx.beginPath(); ctx.arc(-22, 12, 10, 0, Math.PI * 2); ctx.arc(22, 12, 10, 0, Math.PI * 2); ctx.fill();
    }
    // Hair and hats.
    if (c.hair === 'bun') {
      ctx.fillStyle = c.hairColor;
      ctx.beginPath(); ctx.arc(0, -34, 44, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -40, 13, 0, Math.PI * 2); ctx.fill();
    } else if (c.hair === 'grey-side') {
      // Grey hair swept to the side: a low cap, not a tall bowl.
      ctx.fillStyle = c.hairColor;
      ctx.beginPath(); ctx.arc(0, -26, 40, Math.PI * 1.1, Math.PI * 1.9); ctx.fill();
      ctx.beginPath(); ctx.arc(-36, -6, 7, 0, Math.PI * 2); ctx.fill();
    } else if (c.hair === 'curly') {
      ctx.fillStyle = c.hairColor;
      for (const [hx, hy, hr] of [[-30, -28, 12], [-10, -38, 13], [12, -38, 13], [30, -26, 12]]) {
        ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, -6, 40, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else if (c.hair === 'bald') {
      ctx.fillStyle = c.hairColor;
      ctx.beginPath(); ctx.arc(-40, -6, 7, 0, Math.PI * 2); ctx.arc(40, -6, 7, 0, Math.PI * 2); ctx.fill();
    }
    if (c.hat === 'peci') {
      // A peci sits on top of the head like a small cap, not a slab over
      // the forehead.
      ctx.fillStyle = '#1f1f1f';
      ctx.beginPath(); ctx.arc(0, -38, 30, Math.PI, 0); ctx.fill();
      ctx.fillRect(-30, -40, 60, 6);
    }
    // Stubble along the jaw, and a beard for Bang Jono.
    if (c.stubble) {
      ctx.fillStyle = 'rgba(31,31,31,0.22)';
      ctx.beginPath(); ctx.arc(0, 22, 30, Math.PI * 0.15, Math.PI * 0.85); ctx.fill();
    }
    if (c.beard) {
      ctx.fillStyle = c.hairColor;
      ctx.beginPath(); ctx.arc(0, 24, 30, Math.PI * 0.1, Math.PI * 0.9); ctx.fill();
      ctx.fillStyle = c.skin;
      ctx.beginPath(); ctx.arc(0, 14, 20, 0, Math.PI * 2); ctx.fill();
    }
    // Moustache, in its own colour so a grey moustache still reads on a
    // pale face.
    if (c.moustache) {
      ctx.fillStyle = c.moustacheColor || c.hairColor;
      ctx.beginPath(); ctx.ellipse(-9, 16, 10, 4, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(9, 16, 10, 4, 0.2, 0, Math.PI * 2); ctx.fill();
    }
    // Brows: raised when worried, angled down toward the nose when angry.
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    if (mood === 2) {
      ctx.beginPath(); ctx.moveTo(-24, -16); ctx.lineTo(-8, -9); ctx.moveTo(24, -16); ctx.lineTo(8, -9); ctx.stroke();
    } else if (mood === 1) {
      ctx.beginPath(); ctx.arc(-16, -14, 8, Math.PI * 1.15, Math.PI * 1.85); ctx.arc(16, -14, 8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-22, -13); ctx.lineTo(-10, -14); ctx.moveTo(22, -13); ctx.lineTo(10, -14); ctx.stroke();
    }
    // Eyes: dots when calm or worried, narrowed slits when angry.
    ctx.fillStyle = '#2b2b2b';
    if (mood === 2) {
      ctx.fillRect(-21, -6, 10, 3);
      ctx.fillRect(11, -6, 10, 3);
    } else {
      ctx.beginPath(); ctx.arc(-16, -4, 5, 0, Math.PI * 2); ctx.arc(16, -4, 5, 0, Math.PI * 2); ctx.fill();
    }
    // Mouth: a smile, a flat worried line, or a frown.
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 3;
    if (mood === 2) {
      ctx.beginPath(); ctx.arc(0, 26, 12, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    } else if (mood === 1) {
      ctx.beginPath(); ctx.moveTo(-8, 16); ctx.lineTo(8, 16); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, 8, 14, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    }
    // A sweat drop at the temple while worried; steam over the head when angry.
    if (mood === 1) {
      ctx.fillStyle = '#7ab8e0';
      ctx.beginPath(); ctx.arc(-34, -20, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-34, -26); ctx.lineTo(-31, -19); ctx.lineTo(-37, -19); ctx.closePath(); ctx.fill();
    }
    if (mood === 2) {
      ctx.strokeStyle = 'rgba(120,120,120,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(6, -48); ctx.quadraticCurveTo(2, -56, 6, -62); ctx.stroke();
    }
    // Earrings.
    if (c.earrings) {
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath(); ctx.arc(-36, 6, 3, 0, Math.PI * 2); ctx.arc(36, 6, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (c.glasses) {
      ctx.strokeStyle = '#2b2b2b';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-16, -4, 9, 0, Math.PI * 2); ctx.arc(16, -4, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(7, -4); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWindow(game) {
    const s = game.stations.find((st) => st.id === 'window');
    const r = s.rect;
    // The wall opening, warm inside: a gradient from the lit back wall
    // down to the darker counter shadow.
    ctx.fillStyle = C.woodDark;
    roundRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 12);
    ctx.fill();
    const glow = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    glow.addColorStop(0, '#5d4128');
    glow.addColorStop(1, '#2f2118');
    ctx.fillStyle = glow;
    roundRect(r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    // The etalase shelf on the back wall: three dishes under glass, a
    // teapot and two glasses of iced tea. It sits high, clear of the
    // customers' hair below it.
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(r.x + 16, r.y + 50, 250, 8);
    drawPlatedDish(['nasi', 'ayam', 'cabai'], r.x + 56, r.y + 36, 40, game.now, false);
    drawPlatedDish(['mie', 'telur', 'sayur'], r.x + 128, r.y + 36, 40, game.now, false);
    drawPlatedDish(['nasi', 'telur', 'sayur'], r.x + 200, r.y + 36, 40, game.now, false);
    ctx.fillStyle = '#9aa5ad';
    ctx.beginPath(); ctx.arc(r.x + 248, r.y + 36, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a858d';
    ctx.fillRect(r.x + 244, r.y + 22, 8, 6);
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(r.x + 222, r.y + 26, 10, 20);
    ctx.fillRect(r.x + 238, r.y + 26, 10, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(r.x + 224, r.y + 28, 3, 14);
    ctx.fillRect(r.x + 240, r.y + 28, 3, 14);
    // A glass shine across the opening.
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(r.x + 60, r.y);
    ctx.lineTo(r.x + 120, r.y);
    ctx.lineTo(r.x + 40, r.y + r.h);
    ctx.lineTo(r.x - 20, r.y + r.h);
    ctx.closePath();
    ctx.fill();
    // The queue at the counter: one customer per open order, each with the
    // expression their order's patience calls for; when nobody waits, the
    // next regular stands by, calm.
    const queue = game.orders.length > 0
      ? game.orders.map((o) => ({ customer: o.customer ?? 0, frac: Math.max(0, o.patience / o.maxPatience) }))
      : [{ customer: game.customerIndex ?? 0, frac: 1 }];
    queue.forEach((q, i) => {
      const spot = customerSpot(i);
      const mood = q.frac > 0.6 ? 0 : q.frac > 0.3 ? 1 : 2;
      drawCustomer(CUSTOMERS[q.customer % CUSTOMERS.length], spot.x, spot.y, mood, 0.85);
    });
    // A "BUKA" (open) sign hanging at the window's top-right corner.
    ctx.fillStyle = '#3d8a3d';
    roundRect(r.x + r.w - 62, r.y + 8, 50, 24, 5);
    ctx.fill();
    ctx.strokeStyle = '#2c6b2f';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(r.x + r.w - 52, r.y + 8); ctx.lineTo(r.x + r.w - 52, r.y); ctx.moveTo(r.x + r.w - 22, r.y + 8); ctx.lineTo(r.x + r.w - 22, r.y); ctx.stroke();
    text('BUKA', r.x + r.w - 37, r.y + 25, 13, '#fff8e7', 'center');
    // The serving counter and bell.
    ctx.fillStyle = C.counterTop;
    roundRect(r.x, r.y + r.h - 70, r.w, 70, 10);
    ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.arc(r.x + 260, r.y + r.h - 84, 20, Math.PI, 0); ctx.fill();
    ctx.fillRect(r.x + 254, r.y + r.h - 84, 12, 6);
    ctx.fillStyle = '#8a6a1e';
    ctx.beginPath(); ctx.arc(r.x + 260, r.y + r.h - 108, 4, 0, Math.PI * 2); ctx.fill();
    drawMoneyBox(game);
    const carryingPlate = game.hand && game.hand.kind === 'plate';
    if (carryingPlate) {
      const pulse = 0.6 + 0.4 * Math.sin(game.now * 6);
      ctx.strokeStyle = `rgba(242,193,78,${pulse})`;
      ctx.lineWidth = 5;
      roundRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8, 10);
      ctx.stroke();
    }
    text('antar piring lengkap ke sini', r.x + r.w / 2, r.y + r.h - 26, 13, '#fff8e7', 'center');
  }

  /** The wooden money box on the counter, with the coins paid in so far. */
  function drawMoneyBox(game) {
    const b = MONEY_BOX;
    // Coins already in the box: a small pile on its lid, capped at ten.
    const n = Math.min(10, game.coins || 0);
    for (let i = 0; i < n; i++) {
      const px = b.x + 6 + (i % 3) * 9;
      const py = b.y - 3 - Math.floor(i / 3) * 6;
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9a441';
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#6b4423';
    roundRect(b.x, b.y, b.w, b.h, 4);
    ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(b.x + 8, b.y + 2, 14, 3);
    ctx.fillStyle = '#f2c14e';
    text('Rp', b.x + b.w / 2, b.y + b.h - 5, 9, '#f2c14e', 'center');
    // Coins flying in from a paying customer, on an arc.
    for (const c of game.coinAnims) {
      if (c.t < 0) continue;
      const f = Math.min(1, c.t / c.dur);
      const mx = (c.x0 + c.x1) / 2;
      const my = Math.min(c.y0, c.y1) - 60;
      const x = (1 - f) * (1 - f) * c.x0 + 2 * (1 - f) * f * mx + f * f * c.x1;
      const y = (1 - f) * (1 - f) * c.y0 + 2 * (1 - f) * f * my + f * f * c.y1;
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath(); ctx.arc(x - 1.5, y - 1.5, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawTrash(game) {
    const s = game.stations.find((st) => st.id === 'trash');
    const r = s.rect;
    ctx.fillStyle = '#5a646c';
    roundRect(r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.fillStyle = '#7a858d';
    roundRect(r.x, r.y, r.w, 14, 8);
    ctx.fill();
    text('SAMPAH', r.x + r.w / 2, r.y + 52, 13, '#fff', 'center');
    text('buang bahan di sini', r.x + r.w / 2, r.y + 70, 10, '#e8e8e8', 'center');
  }

  function drawHighlight(game) {
    const st = game.nearestStation;
    if (!st || game.screen !== SCREEN_PLAY) return;
    const pulse = 0.5 + 0.3 * Math.sin(game.now * 6);
    ctx.strokeStyle = `rgba(242,193,78,${pulse})`;
    ctx.lineWidth = 4;
    const r = st.rect;
    roundRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 12);
    ctx.stroke();
    // The E key hint: a badge beside the station's approach point, clear of
    // the station art and of anything the cook carries.
    const bx = st.approach.x + 48;
    const by = st.approach.y - 6;
    ctx.fillStyle = '#3a2a1a';
    roundRect(bx - 16, by - 13, 32, 26, 6);
    ctx.fill();
    text('E', bx, by + 6, 16, '#fff8e7', 'center');
  }

  function drawPlayer(game) {
    const p = game.player;
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ellipse(p.x, p.y + 16, 22, 8);
    ctx.fill();
    // Body: apron.
    ctx.fillStyle = '#f5f0e6';
    roundRect(p.x - 16, p.y - 6, 32, 30, 10);
    ctx.fill();
    ctx.fillStyle = '#d9382b';
    ctx.fillRect(p.x - 16, p.y + 8, 32, 5);
    // Head.
    ctx.fillStyle = '#f2c49b';
    ctx.beginPath(); ctx.arc(p.x, p.y - 16, 13, 0, Math.PI * 2); ctx.fill();
    // Chef hat.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(p.x - 8, p.y - 26, 8, 0, Math.PI * 2); ctx.arc(p.x, p.y - 30, 9, 0, Math.PI * 2); ctx.arc(p.x + 8, p.y - 26, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(p.x - 13, p.y - 28, 26, 6);
    // Eyes.
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(p.x - 5, p.y - 16, 2, 0, Math.PI * 2); ctx.arc(p.x + 5, p.y - 16, 2, 0, Math.PI * 2); ctx.fill();
    // What the cook carries, floating above the hat.
    if (game.hand) {
      const hx = p.x;
      const hy = p.y - 52;
      ctx.fillStyle = 'rgba(255,248,231,0.95)';
      ellipse(hx, hy, 24, 18);
      ctx.fill();
      ctx.strokeStyle = '#d8cdb4';
      ctx.lineWidth = 1.5;
      ellipse(hx, hy, 24, 18);
      ctx.stroke();
      if (game.hand.kind === 'plate') {
        drawPlatedDish(game.hand.items, hx, hy, 40, game.now, true);
      } else {
        const prep = game.hand.prep === 'ready' ? 'ready' : 'raw';
        drawFood(game.hand.ing, hx, hy, 28, prep);
        // A fried ingredient in hand is still hot: steam over it.
        if (prep === 'ready' && INGREDIENTS[game.hand.ing].prep === 'fry') drawSteam(hx, hy - 16, game.now, 0.7);
      }
    }
    // Click target marker.
    if (p.target) {
      ctx.strokeStyle = 'rgba(58,42,26,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.target.x, p.target.y, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.target.x - 12, p.target.y); ctx.lineTo(p.target.x + 12, p.target.y); ctx.moveTo(p.target.x, p.target.y - 12); ctx.lineTo(p.target.x, p.target.y + 12); ctx.stroke();
    }
  }

  function drawFloats(game) {
    for (const f of game.floats) {
      const alpha = Math.max(0, Math.min(1, f.life / 0.5));
      ctx.globalAlpha = alpha;
      text(f.text, f.x, f.y, f.size, f.color, 'center');
      ctx.globalAlpha = 1;
    }
  }

  function drawParticles(game) {
    for (const pt of game.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ HUD + board

  function fmtTime(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function drawHud(game) {
    // Top bar.
    ctx.fillStyle = C.woodDark;
    ctx.fillRect(0, 0, W, 64);
    ctx.fillStyle = C.wood;
    ctx.fillRect(0, 60, W, 4);
    text('DAPUR KILAT', 24, 42, 28, '#fff8e7');
    // Lives as hearts.
    for (let i = 0; i < 3; i++) {
      const hx = 250 + i * 34;
      const hy = 32;
      ctx.fillStyle = i < game.lives ? C.red : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 12, hy - 4, hx - 6, hy - 12, hx, hy - 4);
      ctx.bezierCurveTo(hx + 6, hy - 12, hx + 12, hy - 4, hx, hy + 8);
      ctx.fill();
    }
    // Shift timer, big in the middle; it turns red and pulses under 30 s.
    const urgent = game.timeLeft <= 30;
    const pulse = urgent ? 0.7 + 0.3 * Math.sin(game.now * 6) : 1;
    ctx.globalAlpha = pulse;
    text(fmtTime(game.timeLeft), W / 2, 44, 32, urgent ? '#ff6b5e' : '#fff8e7', 'center');
    ctx.globalAlpha = 1;
    text(`RONDE ${game.round}`, W / 2, 60, 12, '#e8d9b0', 'center');
    // Score and combo, right.
    text(`SKOR ${game.score}`, W - 24, 34, 24, '#fff8e7', 'right');
    if (game.combo > 1) {
      text(`KOMBO x${game.combo}`, W - 24, 58, 16, C.gold, 'right');
    } else {
      text(`TERBAIK ${game.best}`, W - 24, 58, 14, '#c9b183', 'right');
    }
    if (game.muted) text('SUARA MATI (M)', W - 24, 12, 11, '#c9b183', 'right');
    drawMuteButton(game);
  }

  /** The on-screen music mute button, bottom-right (M key does the same). */
  function drawMuteButton(game) {
    const b = MUTE_BUTTON;
    ctx.fillStyle = game.muted ? '#8a2f26' : '#3f6b5e';
    roundRect(b.x, b.y, b.w, b.h, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,248,231,0.6)';
    ctx.lineWidth = 2;
    roundRect(b.x, b.y, b.w, b.h, 8);
    ctx.stroke();
    text(game.muted ? 'SENYAP' : 'MUSIK', b.x + b.w / 2, b.y + 23, 12, '#fff8e7', 'center');
  }

  function drawOrderBoard(game) {
    // The board itself: a menu chalkboard on the left, three order tickets
    // to its right. Every line of a ticket (dish name, customer, ingredient
    // icons, patience bar, seconds, points) sits inside its card with
    // clear padding.
    ctx.fillStyle = C.wood;
    roundRect(12, 100, W - 24, 106, 10);
    ctx.fill();
    // The menu board: today's dishes with their prices, on a chalkboard.
    ctx.fillStyle = C.woodDark;
    roundRect(20, 106, 196, 94, 8);
    ctx.fill();
    ctx.fillStyle = '#2c4636';
    roundRect(24, 110, 188, 86, 6);
    ctx.fill();
    text('MENU WARUNG', 118, 128, 13, '#f2c14e', 'center');
    ctx.strokeStyle = 'rgba(255,248,231,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(32, 134); ctx.lineTo(204, 134); ctx.stroke();
    MENU_TODAY.forEach((id, i) => {
      const recipe = RECIPES.find((r) => r.id === id);
      const y = 147 + i * 13;
      text(recipe.name.replace(' Kilat', '').replace(' Pedas', ''), 32, y, 11, '#fff8e7');
      text(recipe.price, 204, y, 11, '#f2c14e', 'right');
    });
    const slotW = 336;
    const slotX0 = 234;
    for (let i = 0; i < 3; i++) {
      const x = slotX0 + i * (slotW + 12);
      const y = 108;
      const order = game.orders[i];
      if (!order) {
        ctx.strokeStyle = 'rgba(255,248,231,0.35)';
        ctx.lineWidth = 1.5;
        roundRect(x, y, slotW, 92, 8);
        ctx.stroke();
        text('menunggu pesanan', x + slotW / 2, y + 52, 14, 'rgba(255,248,231,0.5)', 'center');
        continue;
      }
      const frac = Math.max(0, order.patience / order.maxPatience);
      const urgent = frac < 0.35;
      ctx.fillStyle = C.paper;
      roundRect(x, y, slotW, 92, 8);
      ctx.fill();
      if (urgent) {
        ctx.strokeStyle = `rgba(217,56,43,${0.5 + 0.5 * Math.sin(game.now * 6)})`;
        ctx.lineWidth = 3;
        roundRect(x, y, slotW, 92, 8);
        ctx.stroke();
      }
      text(order.recipe.name, x + 12, y + 22, 16, C.ink);
      // Who ordered it, top-right of the ticket.
      text(CUSTOMERS[(order.customer ?? 0) % CUSTOMERS.length].name, x + slotW - 12, y + 20, 11, C.muted, 'right');
      order.recipe.items.forEach((ing, j) => {
        drawFood(ing, x + 28 + j * 34, y + 50, 30, 'ready');
      });
      // Patience bar, right of the icons, with the seconds beside it.
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      roundRect(x + 128, y + 44, 140, 12, 6);
      ctx.fill();
      ctx.fillStyle = urgent ? C.red : frac < 0.6 ? '#e8a13a' : C.green;
      if (frac > 0) { roundRect(x + 128, y + 44, 140 * frac, 12, 6); ctx.fill(); }
      text(`${Math.ceil(order.patience)} dtk`, x + 324, y + 55, 13, C.ink, 'right');
      // Points line: baseline 12 px above the card's bottom edge, so the
      // whole line (descenders included) stays inside the card.
      text(`+${order.recipe.items.length * 40 + order.recipe.tip} poin`, x + 12, y + 80, 11, C.muted);
    }
  }

  // ------------------------------------------------------------ screens

  function drawPanel(title, lines, prompt, accent) {
    const w = 640;
    const h = 150 + lines.length * 34 + 60;
    const x = (W - w) / 2;
    const y = (H - h) / 2;
    ctx.fillStyle = 'rgba(30,18,10,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.paper;
    roundRect(x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = C.wood;
    ctx.lineWidth = 4;
    roundRect(x, y, w, h, 16);
    ctx.stroke();
    text(title, W / 2, y + 64, 44, accent || C.ink, 'center');
    lines.forEach((line, i) => text(line, W / 2, y + 118 + i * 34, 20, C.ink, 'center'));
    text(prompt, W / 2, y + h - 28, 18, C.red, 'center');
  }

  function drawTitle(game) {
    drawPanel(
      'DAPUR KILAT',
      [
        'Masak cepat, sajikan panas!',
        'Ambil bahan → cincang / goreng → tata di piring → antar ke jendela.',
        'WASD / panah untuk jalan, E atau klik untuk memakai alat.',
        'Shift 2½ menit — 3 nyawa. Sajikan cepat untuk kombo!',
        `Skor terbaik: ${game.best}`,
      ],
      'Tekan Enter atau klik untuk mulai',
      C.red,
    );
  }

  function drawPaused(game) {
    drawPanel('JEDA', ['Istirahat sebentar — kompor menunggu.', `Skor ${game.score} · Ronde ${game.round}`], 'Tekan P untuk lanjut', C.ink);
  }

  function drawOver(game) {
    const s = game.overStats;
    drawPanel(
      s.livesOut ? 'DAPUR TUTUP!' : 'SHIFT SELESAI!',
      [
        `Skor akhir: ${s.score}`,
        `Hidangan tersaji: ${s.served}  ·  Kombo terbaik: x${s.bestCombo}`,
        `Pesanan gagal: ${s.failed}`,
        s.score >= s.best && s.score > 0 ? 'Skor terbaik baru!' : `Skor terbaik: ${s.best}`,
      ],
      'Tekan R atau klik untuk masak lagi',
      C.red,
    );
  }

  function drawToast(game) {
    if (!game.toast || game.now > game.toast.until) return;
    ctx.fillStyle = '#3a2a1a';
    roundRect(W / 2 - 200, 216, 400, 34, 17);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = `bold 16px ${FONT}`;
    text(game.toast.text, W / 2, 239, 16, '#fff8e7', 'center');
  }

  /**
   * Every station label, painted last — after the cook, the floats, the
   * board and the HUD — so no sprite can ever cover a label. Plate counts
   * sit above-left of their plate, clear of the cook's approach point.
   */
  function drawStationLabels(game) {
    const pill = (cx, y, w, label, size = 13) => {
      ctx.fillStyle = C.paper;
      roundRect(cx - w / 2, y - 16, w, 20, 10);
      ctx.fill();
      text(label, cx, y - 1, size, C.ink, 'center');
    };
    pill(112, 208, 80, 'BAHAN', 15);
    const board = game.stations.find((st) => st.id === 'board');
    pill(board.rect.x + board.rect.w / 2, board.rect.y - 12, 104, 'TALENAN');
    const stove = game.stations.find((st) => st.id === 'stove');
    pill(stove.rect.x + stove.rect.w / 2, stove.rect.y - 12, 92, 'KOMPOR');
    const win = game.stations.find((st) => st.id === 'window');
    pill(win.rect.x + win.rect.w / 2, win.rect.y - 12, 130, 'JENDELA SAJI', 16);
    for (const s of game.stations) {
      if (s.kind !== 'plate') continue;
      const plate = game.plates[s.plate];
      const cx = s.rect.x + s.rect.w / 2;
      const cy = s.rect.y + s.rect.h / 2;
      const n = plate.items.length;
      const complete = n > 0 && game.orders.some((o) => o.recipe.items.length === n && o.recipe.items.every((ing) => plate.items.includes(ing)));
      const count = complete ? 'SIAP SAJI!' : `${n} bahan`;
      const countW = complete ? 104 : 76;
      ctx.fillStyle = complete ? C.gold : C.paper;
      roundRect(cx - 58 - countW / 2, cy - 62, countW, 20, 10);
      ctx.fill();
      text(count, cx - 58, cy - 47, complete ? 14 : 12, complete ? '#3a2a1a' : C.muted, 'center');
      pill(cx, s.rect.y + s.rect.h + 16, 84, `PIRING ${s.plate + 1}`);
    }
  }

  /** Customers who stormed off: small, angry, walking along the sidewalk. */
  function drawLeaving(game) {
    for (const l of game.leaving) {
      const c = CUSTOMERS[(l.customer ?? 0) % CUSTOMERS.length];
      const alpha = Math.max(0, 1 - l.t / l.life);
      ctx.save();
      ctx.globalAlpha = alpha;
      // A little storm puff over their head while they go.
      ctx.fillStyle = 'rgba(90,90,90,0.85)';
      ctx.beginPath(); ctx.arc(l.x - 8, 640, 9, 0, Math.PI * 2); ctx.arc(l.x + 4, 636, 11, 0, Math.PI * 2); ctx.arc(l.x + 14, 641, 8, 0, Math.PI * 2); ctx.fill();
      drawCustomer(c, l.x, 668, 2, 0.45);
      ctx.restore();
    }
  }

  /** Paint one frame of the game. */
  function draw(game) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#2b1d12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawFloor();
    drawCrates(game);
    drawBoard(game);
    drawStove(game);
    drawPlates(game);
    drawWindow(game);
    drawTrash(game);
    drawHighlight(game);
    drawPlayer(game);
    drawLeaving(game);
    drawParticles(game);
    drawFloats(game);
    drawOrderBoard(game);
    drawHud(game);
    drawToast(game);
    // Station labels paint last, so no sprite ever covers one.
    drawStationLabels(game);
    if (game.screen === SCREEN_TITLE) drawTitle(game);
    else if (game.screen === SCREEN_PAUSED) drawPaused(game);
    else if (game.screen === SCREEN_OVER) drawOver(game);
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, resize };
}
