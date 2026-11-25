// Dapur Kilat — render.js
// Drawing only: the game state in, pixels out. The kitchen is drawn with
// canvas shapes (its own look: warm warung walls, terracotta tiles, dark
// wood counters), every ingredient drawn so it looks worth serving, and the
// order board, timer and plates all readable at a glance when shrunk.

import { INGREDIENTS, FRY_TIME, BURN_AFTER } from './recipes.js';
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

/** The regulars at the serving window: skin, hair, outfit and hat differ. */
export const CUSTOMERS = [
  { name: 'Pak Budi', skin: '#d9a06b', hair: 'white', hairColor: '#e8e8e8', outfit: '#3f6b8a', hat: 'none', glasses: true },
  { name: 'Bu Sari', skin: '#e8b98a', hair: 'bun', hairColor: '#2b2b2b', outfit: '#b03a2e', hat: 'none', glasses: false },
  { name: 'Mas Dedi', skin: '#c98a5a', hair: 'peci', hairColor: '#1f1f1f', outfit: '#3f7a4a', hat: 'peci', glasses: false },
  { name: 'Mbak Rina', skin: '#a06a42', hair: 'curly', hairColor: '#2b2b2b', outfit: '#7a4a8a', hat: 'headband', glasses: false },
];

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
      ctx.fillStyle = '#b8452f';
      ellipse(0, 6, 17, 9);
      ctx.fill();
      ctx.fillStyle = fried ? '#e8b64c' : '#f7ecd0';
      ctx.beginPath();
      ctx.arc(0, 2, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = fried ? '#c98a2e' : '#e8d9b0';
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * 5, -2 + Math.abs(i), 1.6, 0, Math.PI * 2); ctx.fill(); }
      if (fried) { ctx.fillStyle = '#4da34d'; ctx.fillRect(-8, -6, 4, 2); ctx.fillRect(4, -8, 4, 2); }
    } else if (ingId === 'mie') {
      ctx.strokeStyle = fried ? '#c98a2e' : '#f2c14e';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 2, 12 - i * 4, Math.PI * 0.15, Math.PI * 1.15);
        ctx.stroke();
      }
      if (fried) { ctx.fillStyle = '#4da34d'; ctx.fillRect(-10, -10, 5, 3); ctx.fillRect(6, -12, 5, 3); }
    } else if (ingId === 'telur') {
      if (fried) {
        ctx.fillStyle = '#fff8e0';
        ellipse(0, 2, 17, 12);
        ctx.fill();
        ctx.fillStyle = '#f2a93b';
        ctx.beginPath(); ctx.arc(2, 2, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e08a1e';
        ctx.beginPath(); ctx.arc(2, 2, 4, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#fff3d6';
        ellipse(0, 2, 11, 14);
        ctx.fill();
        ctx.fillStyle = '#e8d9b0';
        ctx.beginPath(); ctx.arc(0, -12, 3, 0, Math.PI * 2); ctx.fill();
      }
    } else if (ingId === 'ayam') {
      ctx.fillStyle = fried ? '#a34d1e' : '#e08a5a';
      ctx.beginPath(); ctx.arc(-3, 0, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f7ecd0';
      ctx.fillRect(6, -2, 10, 4);
      ctx.beginPath(); ctx.arc(18, -4, 3, 0, Math.PI * 2); ctx.arc(18, 4, 3, 0, Math.PI * 2); ctx.fill();
      if (fried) { ctx.fillStyle = '#7a3410'; ctx.beginPath(); ctx.arc(-7, -4, 3, 0, Math.PI * 2); ctx.fill(); }
    } else if (ingId === 'cabai') {
      if (chopped) {
        ctx.fillStyle = '#d9382b';
        for (const [px, py, r] of [[-10, 4, 5], [0, -4, 6], [10, 5, 5], [2, 8, 4]]) { ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#8f1d14';
        ctx.beginPath(); ctx.arc(0, -4, 2, 0, Math.PI * 2); ctx.fill();
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
        ctx.fillStyle = '#4da34d';
        for (const [px, py] of [[-11, 3], [-2, -5], [8, 2], [0, 8], [11, -6]]) { ctx.fillRect(px, py, 7, 4); }
        ctx.fillStyle = '#2c6b2f';
        ctx.fillRect(-6, 2, 6, 3);
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
  }

  function drawFloor() {
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 168, W, 552);
    drawWall();
    // Terracotta tiles in four shades, with the odd sage or cream accent
    // tile, so the floor reads as worn kitchen tile, not a flat checker.
    const tile = 56;
    const shades = ['#c96f4a', '#b95f3d', '#cf7a52', '#b25a38'];
    for (let ty = 0; ty < 10; ty++) {
      for (let tx = 0; tx < 23; tx++) {
        const h = tileHash(tx, ty);
        if (h < 0.05) ctx.fillStyle = '#7a8b5a';
        else if (h < 0.09) ctx.fillStyle = '#e8d9b0';
        else ctx.fillStyle = shades[Math.floor(h * 4) % 4];
        ctx.fillRect(tx * tile, 176 + ty * tile, tile, tile);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    for (let ty = 0; ty < 10; ty++) ctx.fillRect(0, 176 + ty * tile, W, 2);
    for (let tx = 0; tx < 23; tx++) ctx.fillRect(tx * tile, 176, 2, 552);
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
    // Floor mats where the cook stands to work: stove, plates, window.
    drawMat(560, 436, 260, 42, '#4a5d3a', '#33402a');
    drawMat(380, 636, 340, 48, '#3f6b5e', '#2c4d43');
    drawMat(1000, 496, 156, 48, '#8a4a30', '#6b3822');
    // Wall band above the floor.
    ctx.fillStyle = C.wallTrim;
    ctx.fillRect(0, 168, W, 8);
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
      // The plate.
      ctx.fillStyle = '#fdfdf8';
      ellipse(cx, cy, 52, 34);
      ctx.fill();
      ctx.strokeStyle = '#d8cdb4';
      ctx.lineWidth = 2;
      ellipse(cx, cy, 44, 28);
      ctx.stroke();
      // Items on the plate.
      const n = plate.items.length;
      plate.items.forEach((ing, i) => {
        const px = cx + (i - (n - 1) / 2) * 32;
        drawFood(ing, px, cy - 2, 34, 'ready');
      });
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

  /** One customer at the window: skin, hair, hat and outfit all differ. */
  function drawCustomer(c, cx, cy) {
    // Shoulders and outfit, inside the opening.
    ctx.fillStyle = c.outfit;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 78, 52, 30, 0, Math.PI, 0);
    ctx.fill();
    // Head.
    ctx.fillStyle = c.skin;
    ctx.beginPath(); ctx.arc(cx, cy, 42, 0, Math.PI * 2); ctx.fill();
    // Hair and hats.
    if (c.hair === 'bun') {
      ctx.fillStyle = c.hairColor;
      ctx.beginPath(); ctx.arc(cx, cy - 34, 44, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy - 40, 13, 0, Math.PI * 2); ctx.fill();
    } else if (c.hair === 'white') {
      ctx.fillStyle = c.hairColor;
      ctx.beginPath(); ctx.arc(cx, cy - 30, 43, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    } else if (c.hair === 'curly') {
      ctx.fillStyle = c.hairColor;
      for (const [hx, hy, hr] of [[-30, -28, 12], [-10, -38, 13], [12, -38, 13], [30, -26, 12]]) {
        ctx.beginPath(); ctx.arc(cx + hx, cy + hy, hr, 0, Math.PI * 2); ctx.fill();
      }
      // Yellow headband.
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy - 6, 40, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
    if (c.hat === 'peci') {
      ctx.fillStyle = '#1f1f1f';
      ctx.beginPath(); ctx.arc(cx, cy - 26, 42, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 42, cy - 28, 84, 8);
    }
    // Eyes and smile.
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(cx - 16, cy - 4, 5, 0, Math.PI * 2); ctx.arc(cx + 16, cy - 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy + 8, 14, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    if (c.glasses) {
      ctx.strokeStyle = '#2b2b2b';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx - 16, cy - 4, 9, 0, Math.PI * 2); ctx.arc(cx + 16, cy - 4, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 7, cy - 4); ctx.lineTo(cx + 7, cy - 4); ctx.stroke();
    }
  }

  function drawWindow(game) {
    const s = game.stations.find((st) => st.id === 'window');
    const r = s.rect;
    // The wall opening.
    ctx.fillStyle = C.woodDark;
    roundRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 12);
    ctx.fill();
    ctx.fillStyle = '#2f2118';
    roundRect(r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    // A waiting customer, peeking in: whoever placed the first open order.
    const customerIndex = game.orders.length > 0
      ? (game.orders[0].customer ?? 0)
      : (game.customerIndex ?? 0);
    const customer = CUSTOMERS[customerIndex % CUSTOMERS.length];
    drawCustomer(customer, r.x + 120, r.y + 130);
    // Name tag on the right of the opening: the game-over panel covers the
    // centre of the screen, so a tag on the left would be half hidden.
    text(customer.name, r.x + r.w - 16, r.y + 130, 13, '#fff8e7', 'right');
    // The serving counter and bell.
    ctx.fillStyle = C.counterTop;
    roundRect(r.x, r.y + r.h - 70, r.w, 70, 10);
    ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.arc(r.x + 260, r.y + r.h - 84, 20, Math.PI, 0); ctx.fill();
    ctx.fillRect(r.x + 254, r.y + r.h - 84, 12, 6);
    ctx.fillStyle = '#8a6a1e';
    ctx.beginPath(); ctx.arc(r.x + 260, r.y + r.h - 108, 4, 0, Math.PI * 2); ctx.fill();
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
        game.hand.items.forEach((ing, i) => {
          const px = hx + (i - (game.hand.items.length - 1) / 2) * 14;
          drawFood(ing, px, hy, 16, 'ready');
        });
      } else {
        const prep = game.hand.prep === 'ready' ? 'ready' : 'raw';
        drawFood(game.hand.ing, hx, hy, 28, prep);
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
    // The board itself: tall enough that every line of a ticket (dish name,
    // ingredient icons, patience bar, seconds, points) sits inside its card
    // with clear padding — the points line used to ride the card's bottom
    // edge and read as clipped. It sits below the wall band (y 64–100).
    ctx.fillStyle = C.wood;
    roundRect(12, 100, W - 24, 106, 10);
    ctx.fill();
    ctx.fillStyle = C.woodDark;
    text('PAPAN', 32, 122, 14, '#e8d9b0');
    text('PESANAN', 32, 140, 14, '#e8d9b0');
    text('sajikan sebelum', 32, 164, 12, '#e8d9b0');
    text('sabar habis!', 32, 180, 12, '#e8d9b0');
    const slotW = 330;
    const slotX0 = 200;
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
      order.recipe.items.forEach((ing, j) => {
        drawFood(ing, x + 28 + j * 34, y + 50, 30, 'ready');
      });
      // Patience bar, right of the icons, with the seconds beside it.
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      roundRect(x + 128, y + 44, 140, 12, 6);
      ctx.fill();
      ctx.fillStyle = urgent ? C.red : frac < 0.6 ? '#e8a13a' : C.green;
      if (frac > 0) { roundRect(x + 128, y + 44, 140 * frac, 12, 6); ctx.fill(); }
      text(`${Math.ceil(order.patience)} dtk`, x + 276, y + 55, 13, C.ink);
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
