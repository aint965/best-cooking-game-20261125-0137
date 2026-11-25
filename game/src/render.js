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

  function drawFloor() {
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 168, W, 552);
    // Terracotta checker tiles.
    const tile = 56;
    for (let ty = 0; ty < 10; ty++) {
      for (let tx = 0; tx < 23; tx++) {
        ctx.fillStyle = (tx + ty) % 2 === 0 ? C.floorA : C.floorB;
        ctx.fillRect(tx * tile, 176 + ty * tile, tile, tile);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let ty = 0; ty < 10; ty++) ctx.fillRect(0, 176 + ty * tile, W, 2);
    for (let tx = 0; tx < 23; tx++) ctx.fillRect(tx * tile, 176, 2, 552);
    // Wall band above the floor.
    ctx.fillStyle = C.wallTrim;
    ctx.fillRect(0, 168, W, 8);
  }

  function drawCrates(game) {
    for (const s of game.stations) {
      if (s.kind !== 'crate') continue;
      const ing = INGREDIENTS[s.ing];
      const r = s.rect;
      ctx.fillStyle = C.wood;
      roundRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 8);
      ctx.fill();
      ctx.fillStyle = '#a9713f';
      roundRect(r.x, r.y, r.w, r.h, 6);
      ctx.fill();
      drawFood(s.ing, r.x + r.w / 2, r.y + 30, 44, 'ready');
      text(ing.name, r.x + r.w / 2, r.y + r.h - 8, 14, '#fff8e7', 'center');
    }
    ctx.fillStyle = C.paper;
    roundRect(72, 180, 80, 22, 11);
    ctx.fill();
    text('BAHAN', 112, 196, 15, C.ink, 'center');
  }

  function drawBoard(game) {
    const s = game.stations.find((st) => st.id === 'board');
    const r = s.rect;
    ctx.fillStyle = C.counter;
    roundRect(r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.fillStyle = C.counterTop;
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
    ctx.fillStyle = C.paper;
    roundRect(r.x + r.w / 2 - 52, r.y - 28, 104, 20, 10);
    ctx.fill();
    text('TALENAN', r.x + r.w / 2, r.y - 13, 13, C.ink, 'center');
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
    ctx.fillStyle = C.paper;
    roundRect(r.x + r.w / 2 - 46, r.y - 28, 92, 20, 10);
    ctx.fill();
    text('KOMPOR', r.x + r.w / 2, r.y - 13, 13, C.ink, 'center');
  }

  function drawPlates(game) {
    for (const s of game.stations) {
      if (s.kind !== 'plate') continue;
      const plate = game.plates[s.plate];
      const cx = s.rect.x + s.rect.w / 2;
      const cy = s.rect.y + s.rect.h / 2;
      // Counter under the plate.
      ctx.fillStyle = C.counter;
      roundRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h, 10);
      ctx.fill();
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
        text('SIAP SAJI!', cx, cy - 46, 15, C.gold, 'center');
      } else if (n > 0) {
        text(`${n} bahan`, cx, cy - 44, 12, C.muted, 'center');
      }
      text(`PIRING ${s.plate + 1}`, cx, s.rect.y + s.rect.h + 16, 13, C.ink, 'center');
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
    // A waiting customer, peeking in.
    const carryingPlate = game.hand && game.hand.kind === 'plate';
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath(); ctx.arc(r.x + 120, r.y + 130, 42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath(); ctx.arc(r.x + 120, r.y + 96, 44, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(r.x + 104, r.y + 126, 5, 0, Math.PI * 2); ctx.arc(r.x + 136, r.y + 126, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(r.x + 120, r.y + 138, 14, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    // The serving counter and bell.
    ctx.fillStyle = C.counterTop;
    roundRect(r.x, r.y + r.h - 70, r.w, 70, 10);
    ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.arc(r.x + 260, r.y + r.h - 84, 20, Math.PI, 0); ctx.fill();
    ctx.fillRect(r.x + 254, r.y + r.h - 84, 12, 6);
    ctx.fillStyle = '#8a6a1e';
    ctx.beginPath(); ctx.arc(r.x + 260, r.y + r.h - 108, 4, 0, Math.PI * 2); ctx.fill();
    if (carryingPlate) {
      const pulse = 0.6 + 0.4 * Math.sin(game.now * 6);
      ctx.strokeStyle = `rgba(242,193,78,${pulse})`;
      ctx.lineWidth = 5;
      roundRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8, 10);
      ctx.stroke();
    }
    text('JENDELA SAJI', r.x + r.w / 2, r.y - 12, 16, C.ink, 'center');
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
  }

  function drawOrderBoard(game) {
    // The board itself: tall enough that every line of a ticket (dish name,
    // ingredient icons, patience bar, seconds, points) sits inside its card
    // with clear padding — the points line used to ride the card's bottom
    // edge and read as clipped.
    ctx.fillStyle = C.wood;
    roundRect(12, 66, W - 24, 106, 10);
    ctx.fill();
    ctx.fillStyle = C.woodDark;
    text('PAPAN', 32, 88, 14, '#e8d9b0');
    text('PESANAN', 32, 106, 14, '#e8d9b0');
    text('sajikan sebelum', 32, 130, 12, '#e8d9b0');
    text('sabar habis!', 32, 146, 12, '#e8d9b0');
    const slotW = 330;
    const slotX0 = 200;
    for (let i = 0; i < 3; i++) {
      const x = slotX0 + i * (slotW + 12);
      const y = 74;
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
    roundRect(W / 2 - 200, 176, 400, 34, 17);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = `bold 16px ${FONT}`;
    text(game.toast.text, W / 2, 199, 16, '#fff8e7', 'center');
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
    if (game.screen === SCREEN_TITLE) drawTitle(game);
    else if (game.screen === SCREEN_PAUSED) drawPaused(game);
    else if (game.screen === SCREEN_OVER) drawOver(game);
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, resize };
}
