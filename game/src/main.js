// Dapur Kilat — main.js
// Boot and the one loop: input every frame, the kitchen advances in fixed
// 1/60 s steps, the renderer paints what is there. Screens: title, play,
// paused, game over. ?shot=cover|play|rush|end stages one frozen scene for
// a screenshot; ?selftest=1 plays a full dish through real input events and
// writes its report into the page.

import { RECIPES, INGREDIENTS } from './recipes.js';
import { MAX_ACTIVE_ORDERS, makeOrder, tickOrders, findOrderForPlate, scoreForServe, spawnGapForRound } from './orders.js';
import { SoundFX } from './audio.js';
import { Input } from './input.js';
import { buildStations, buildObstacles, stationAtPoint, nearestUsableStation, movePlayer, interact, burnerState, PLAYER_SPEED } from './kitchen.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, MUTE_BUTTON } from './render.js';

const SHIFT_LENGTH = 150; // seconds per shift
const COMBO_WINDOW = 15; // seconds between serves to keep the combo alive
const BEST_KEY = 'dapur-kilat-best';
const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : (Math.random() * 4294967296) >>> 0;
const selftest = params.get('selftest') === '1';

/** Small seeded RNG (mulberry32) so ?seed=N replays the same orders. */
function mulberry32(a) {
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every error the page hits, collected for the self-test report. */
window.__errors = [];
window.addEventListener('error', (e) => window.__errors.push(String(e.message || e.error)));
window.addEventListener('unhandledrejection', (e) => window.__errors.push(`rejection: ${String(e.reason)}`));

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const sfx = new SoundFX();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function freshGame(rng) {
  const stations = buildStations();
  return {
    screen: SCREEN_TITLE,
    rng,
    stations,
    obstacles: buildObstacles(stations),
    now: 0,
    elapsed: 0,
    timeLeft: SHIFT_LENGTH,
    round: 1,
    score: 0,
    combo: 1,
    bestCombo: 1,
    lastServeAt: -999,
    lives: 3,
    served: 0,
    failed: 0,
    best: readBest(),
    muted: false,
    orders: [],
    spawnIn: 2,
    customerIndex: 0,
    plates: [{ items: [] }, { items: [] }],
    burners: [{ item: null, t: 0 }, { item: null, t: 0 }],
    board: { item: null, taps: 0 },
    player: { x: 640, y: 660, target: null, pending: null, facing: 1 },
    hand: null,
    floats: [],
    particles: [],
    toast: null,
    nearestStation: null,
    overStats: null,
    pausedByTab: false,
  };
}

const game = freshGame(mulberry32(seed));

// ------------------------------------------------------------ helpers

function announce(message) {
  status.textContent = message;
}

function toast(text) {
  game.toast = { text, until: game.now + 2.2 };
}

function addFloat(x, y, text, color, size = 22) {
  game.floats.push({ x, y, text, color, size, life: 1.2 });
}

function burst(x, y, color, n = 14) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 90;
    game.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.7, maxLife: 0.7, color, size: 2 + Math.random() * 3 });
  }
}

function loseLife(reason) {
  game.lives -= 1;
  game.combo = 1;
  sfx.error();
  toast(reason);
  addFloat(640, 268, '−1 NYAWA', '#d9382b', 26);
  if (game.lives <= 0) endGame(true);
}

function endGame(livesOut) {
  game.screen = SCREEN_OVER;
  game.overStats = {
    score: game.score,
    served: game.served,
    bestCombo: game.bestCombo,
    failed: game.failed,
    best: Math.max(game.best, game.score),
    livesOut,
  };
  if (game.score > game.best) {
    game.best = game.score;
    saveBest(game.best);
  }
  sfx.stopSizzle();
  sfx.stopMusic();
  sfx.gameOver();
  announce(`Shift selesai. Skor ${game.score}.`);
}

function startGame() {
  const rng = mulberry32((Math.random() * 4294967296) >>> 0);
  const fresh = freshGame(rng);
  fresh.screen = SCREEN_PLAY;
  fresh.best = game.best;
  Object.keys(game).forEach((k) => delete game[k]);
  Object.assign(game, fresh);
  sfx.ensure();
  sfx.start();
  sfx.startMusic(); // Music starts here, on the player's own gesture — never on load.
  announce('Masak! Ambil bahan pertama dari rak.');
}

// ------------------------------------------------------------ interactions

function applyInteractResult(result, station) {
  if (!result.ok) {
    const hints = {
      'hand-full': 'Tangan sudah penuh — taruh dulu!',
      'board-needs-chop': 'Talenan butuh cabai atau sayur mentah.',
      'still-cooking': 'Masih dimasak — tunggu sebentar.',
      'burner-needs-fry': 'Kompor butuh bahan mentah untuk digoreng.',
      'already-on-plate': 'Bahan itu sudah ada di piring.',
      'plate-needs-ready': 'Bahan harus dicincang / digoreng dulu.',
      'holding-plate': 'Tangan memegang piring — antar ke jendela.',
      'window-needs-plate': 'Bawa piring lengkap ke jendela saji.',
      'plate-empty': 'Piring masih kosong.',
      'hand-empty': 'Tidak ada yang dibuang.',
    };
    if (hints[result.reason]) toast(hints[result.reason]);
    sfx.error();
    return;
  }
  const st = station;
  switch (result.action) {
    case 'pick':
      sfx.pick();
      break;
    case 'chop':
      sfx.chop();
      burst(st.approach.x, st.approach.y - 40, '#4da34d', 6);
      break;
    case 'chop-done':
      sfx.chopDone();
      addFloat(st.approach.x, st.approach.y - 60, 'DICINCANG!', '#4da34d', 18);
      break;
    case 'chop-start':
      sfx.place();
      toast('Cincang 3x dengan E / klik!');
      break;
    case 'place-fry':
      sfx.place();
      sfx.startSizzle();
      break;
    case 'take-fry':
      sfx.pick();
      break;
    case 'discard-burnt':
      sfx.burn();
      toast('Bahan gosong dibuang.');
      break;
    case 'plate-add': {
      sfx.plate();
      const plate = game.plates[result.plate];
      const cx = 420 + result.plate * 260;
      addFloat(cx, 500, '+1', '#3d8a3d', 18);
      const order = game.orders.find((o) => o.recipe.items.length === plate.items.length && o.recipe.items.every((ing) => plate.items.includes(ing)));
      if (order) toast(`Piring lengkap — angkat dan antar ke jendela! (${order.recipe.name})`);
      break;
    }
    case 'plate-takeback':
      sfx.pick();
      break;
    case 'plate-pickup':
      sfx.plate();
      toast('Piring lengkap! Antar ke Jendela Saji.');
      break;
    case 'trash':
      sfx.place();
      break;
    case 'serve': {
      const order = findOrderForPlate(game.orders, result.items);
      if (order) {
        game.orders.splice(game.orders.indexOf(order), 1);
        const gap = game.elapsed - game.lastServeAt;
        game.combo = gap <= COMBO_WINDOW ? Math.min(5, game.combo + 1) : 1;
        game.bestCombo = Math.max(game.bestCombo, game.combo);
        game.lastServeAt = game.elapsed;
        const points = scoreForServe(order, game.combo);
        game.score += points;
        game.served += 1;
        sfx.serve();
        addFloat(1150, 250, `+${points}`, '#f2c14e', 30);
        if (game.combo > 1) addFloat(1150, 288, `KOMBO x${game.combo}!`, '#d9382b', 22);
        burst(1078, 320, '#f2c14e', 22);
        toast(`${order.recipe.name} tersaji! +${points} poin`);
        announce(`Tersaji: ${order.recipe.name}, ${points} poin.`);
      } else {
        // The order expired while the plate was carried: a wrong serve.
        game.failed += 1;
        sfx.error();
        addFloat(1150, 250, 'PESANAN SUDAH HANGUS', '#d9382b', 20);
        loseLife('Pesanan itu sudah tidak ada — pelanggan pergi!');
      }
      break;
    }
    default:
      break;
  }
}

function useStation(station) {
  if (!station || game.screen !== SCREEN_PLAY) return;
  const result = interact(game, station.id);
  applyInteractResult(result, station);
}

function useNearestStation() {
  const st = nearestUsableStation(game.stations, game.player.x, game.player.y);
  if (st) useStation(st);
  else toast('Dekati alat dapur dulu, lalu tekan E.');
}

// ------------------------------------------------------------ update

function update(dt) {
  window.__ticks = (window.__ticks || 0) + 1;
  game.now += dt;
  if (game.screen !== SCREEN_PLAY) return;
  game.elapsed += dt;
  game.timeLeft = Math.max(0, SHIFT_LENGTH - game.elapsed);
  game.round = 1 + Math.floor(game.elapsed / 40);

  // Movement: held keys win over a click target.
  const vec = input.moveVector();
  const p = game.player;
  if (vec) {
    p.target = null;
    p.pending = null;
    p.facing = vec.x !== 0 ? Math.sign(vec.x) : p.facing;
    movePlayer(p, vec.x * PLAYER_SPEED, vec.y * PLAYER_SPEED, dt, game.obstacles);
  } else if (p.target) {
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      p.target = null;
      if (p.pending) {
        const st = game.stations.find((s) => s.id === p.pending);
        p.pending = null;
        if (st && Math.hypot(p.x - st.approach.x, p.y - st.approach.y) <= 140) useStation(st);
      }
    } else {
      p.facing = dx !== 0 ? Math.sign(dx) : p.facing;
      movePlayer(p, (dx / dist) * PLAYER_SPEED, (dy / dist) * PLAYER_SPEED, dt, game.obstacles);
    }
  }

  // Burners cook; a finished fry dings, an overcooked one burns.
  let anyFrying = false;
  for (const burner of game.burners) {
    if (!burner.item) continue;
    anyFrying = true;
    const before = burner.t;
    burner.t += dt;
    if (before < 4 && burner.t >= 4) {
      sfx.ding();
      addFloat(690, 260, 'MATANG!', '#f2c14e', 18);
    }
    if (before < 9 && burner.t >= 9) {
      sfx.burn();
      addFloat(690, 260, 'GOSONG!', '#d9382b', 20);
      burst(690, 320, '#888888', 10);
    }
  }
  if (anyFrying) sfx.startSizzle();
  else sfx.stopSizzle();

  // New orders arrive; old ones expire.
  game.spawnIn -= dt;
  if (game.spawnIn <= 0 && game.orders.length < MAX_ACTIVE_ORDERS) {
    game.orders.push(makeOrder(game.round, game.rng));
    game.spawnIn = spawnGapForRound(game.round) * (0.85 + game.rng() * 0.3);
    sfx.click();
  }
  const expired = tickOrders(game.orders, dt);
  for (const order of expired) {
    game.failed += 1;
    addFloat(640, 232, `${order.recipe.name} hangus!`, '#d9382b', 20);
    loseLife(`Pesanan ${order.recipe.name} keburu dingin!`);
    if (game.screen !== SCREEN_PLAY) break;
  }

  // Combo fades when the cook idles too long.
  if (game.combo > 1 && game.elapsed - game.lastServeAt > COMBO_WINDOW) game.combo = 1;

  // The last ten seconds tick out loud.
  if (game.timeLeft <= 10 && game.timeLeft > 0 && Math.floor(game.timeLeft) !== Math.floor(game.timeLeft + dt)) sfx.tick();

  // Floats and particles age.
  for (let i = game.floats.length - 1; i >= 0; i--) {
    const f = game.floats[i];
    f.life -= dt;
    f.y -= 34 * dt;
    if (f.life <= 0) game.floats.splice(i, 1);
  }
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const pt = game.particles[i];
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 120 * dt;
    if (pt.life <= 0) game.particles.splice(i, 1);
  }

  game.nearestStation = nearestUsableStation(game.stations, p.x, p.y);
  if (game.timeLeft <= 0) endGame(false);
}

// ------------------------------------------------------------ input wiring

const input = new Input(canvas);
input.onKey = (code) => {
  if (code === 'KeyM') {
    game.muted = sfx.toggleMute();
    return;
  }
  if (game.screen === SCREEN_TITLE && (code === 'Enter' || code === 'Space')) startGame();
  else if (game.screen === SCREEN_OVER && (code === 'KeyR' || code === 'Enter' || code === 'Space')) startGame();
  else if (game.screen === SCREEN_PLAY && (code === 'KeyP' || code === 'Escape')) {
    game.screen = SCREEN_PAUSED;
    announce('Jeda.');
  } else if (game.screen === SCREEN_PAUSED && (code === 'KeyP' || code === 'Escape' || code === 'Enter')) {
    game.screen = SCREEN_PLAY;
    announce('Lanjut masak.');
  }
};
input.onInteract = () => {
  if (game.screen === SCREEN_PLAY) useNearestStation();
};
input.onClick = (x, y) => {
  // The on-screen music button answers before anything else, on any screen.
  if (x >= MUTE_BUTTON.x && x < MUTE_BUTTON.x + MUTE_BUTTON.w && y >= MUTE_BUTTON.y && y < MUTE_BUTTON.y + MUTE_BUTTON.h) {
    game.muted = sfx.toggleMute();
    return;
  }
  if (game.screen === SCREEN_TITLE || game.screen === SCREEN_OVER) {
    startGame();
    return;
  }
  if (game.screen !== SCREEN_PLAY) return;
  let station = stationAtPoint(game.stations, x, y);
  if (station) {
    if (station.kind === 'stove') {
      // A click on the stove body means the nearer burner.
      const b0 = game.stations.find((s) => s.id === 'burner-0');
      const b1 = game.stations.find((s) => s.id === 'burner-1');
      station = Math.hypot(x - b0.rect.x, y - b0.rect.y) <= Math.hypot(x - b1.rect.x, y - b1.rect.y) ? b0 : b1;
    }
    const d = Math.hypot(game.player.x - station.approach.x, game.player.y - station.approach.y);
    if (d <= 140) {
      useStation(station);
      return;
    }
    game.player.target = { x: station.approach.x, y: station.approach.y };
    game.player.pending = station.id;
    return;
  }
  game.player.target = { x, y };
  game.player.pending = null;
};

let everVisible = document.visibilityState === 'visible';
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    everVisible = true;
    return;
  }
  // Only auto-pause a game the player has actually seen: a page that loads
  // hidden (a background tab, a headless run) never pauses on its own.
  if (document.hidden && everVisible && game.screen === SCREEN_PLAY) {
    game.screen = SCREEN_PAUSED;
    game.pausedByTab = true;
    announce('Jeda — tab disembunyikan.');
  }
});

// ------------------------------------------------------------ staged shots

function orderForShot(recipeId, patience) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  return { id: 900 + Math.floor(Math.random() * 100), recipe, patience, maxPatience: patience + 14 };
}

function stageShot(name) {
  const g = game;
  g.screen = SCREEN_PLAY;
  g.now = 12.5;
  g.elapsed = 0;
  g.best = 4280;
  if (name === 'cover') {
    g.timeLeft = 151;
    g.round = 2;
    g.score = 1240;
    g.combo = 3;
    g.lives = 3;
    g.orders = [
      orderForShot('nasi-goreng', 38),
      orderForShot('mie-ayam', 24),
      orderForShot('ayam-geprek', 12),
    ];
    g.orders[0].maxPatience = 52;
    g.orders[1].maxPatience = 49;
    g.orders[2].maxPatience = 46;
    g.plates = [{ items: ['nasi', 'telur'] }, { items: ['mie', 'ayam', 'sayur'] }];
    g.burners = [{ item: { ing: 'nasi', prep: 'raw' }, t: 2.5 }, { item: { ing: 'telur', prep: 'raw' }, t: 4.2 }];
    g.board = { item: { ing: 'cabai', prep: 'raw' }, taps: 2 };
    g.hand = { kind: 'item', ing: 'cabai', prep: 'ready' };
    g.player = { x: 390, y: 500, target: null, pending: null, facing: 1 };
    g.floats = [{ x: 1150, y: 250, text: '+180', color: '#f2c14e', size: 30, life: 1.2 }];
    g.nearestStation = g.stations.find((s) => s.id === 'board');
  } else if (name === 'play') {
    g.timeLeft = 125;
    g.round = 1;
    g.score = 320;
    g.combo = 1;
    g.lives = 3;
    g.orders = [orderForShot('mie-goreng', 34), orderForShot('telur-balado', 26)];
    g.orders[0].maxPatience = 52;
    g.orders[1].maxPatience = 49;
    g.plates = [{ items: ['mie'] }, { items: [] }];
    g.burners = [{ item: { ing: 'mie', prep: 'raw' }, t: 2.0 }, { item: null, t: 0 }];
    g.board = { item: { ing: 'sayur', prep: 'raw' }, taps: 2 };
    g.hand = null;
    g.player = { x: 390, y: 470, target: null, pending: null, facing: -1 };
    g.nearestStation = g.stations.find((s) => s.id === 'board');
  } else if (name === 'rush') {
    g.timeLeft = 42;
    g.round = 4;
    g.score = 3860;
    g.combo = 4;
    g.lives = 1;
    g.orders = [
      orderForShot('nasi-goreng', 8),
      orderForShot('telur-balado', 14),
      orderForShot('mie-pedas', 19),
    ];
    g.orders[0].maxPatience = 40;
    g.orders[1].maxPatience = 40;
    g.orders[2].maxPatience = 40;
    g.plates = [{ items: ['nasi', 'telur'] }, { items: [] }];
    g.burners = [{ item: { ing: 'ayam', prep: 'raw' }, t: 3.4 }, { item: { ing: 'mie', prep: 'raw' }, t: 1.2 }];
    g.board = { item: null, taps: 0 };
    g.hand = { kind: 'item', ing: 'ayam', prep: 'ready' };
    g.player = { x: 620, y: 500, target: null, pending: null, facing: 1 };
    g.floats = [{ x: 640, y: 240, text: 'SERVICE RUSH!', color: '#d9382b', size: 28, life: 1.2 }];
    g.nearestStation = g.stations.find((s) => s.id === 'plate-0');
  } else if (name === 'end') {
    g.screen = SCREEN_OVER;
    g.timeLeft = 0;
    g.score = 4280;
    g.overStats = { score: 4280, served: 9, bestCombo: 4, failed: 2, best: 4280, livesOut: false };
  }
  // A different face at the window in every shot: the window shows the
  // customer of the first open order (or customerIndex when there is none).
  const shotCustomers = { cover: [1, 2, 0], play: [2, 0], rush: [0, 3, 1] };
  if (shotCustomers[name]) {
    g.orders.forEach((o, i) => { o.customer = shotCustomers[name][i % shotCustomers[name].length]; });
  }
  if (name === 'end') g.customerIndex = 3;
  g.nearestStation = g.nearestStation ?? null;
  announce(`Dapur Kilat — ${name}.`);
}

// ------------------------------------------------------------ self-test

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitFor(cond, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      let ok = false;
      try {
        ok = cond();
      } catch (e) {
        ok = false;
      }
      if (ok) {
        clearInterval(timer);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`timeout waiting for: ${label}`));
      }
    }, 60);
  });
}

/** Dispatch a real mouse click on the canvas at game coordinates. */
function clickAt(x, y) {
  const r = canvas.getBoundingClientRect();
  const clientX = r.left + (x / 1280) * r.width;
  const clientY = r.top + (y / 720) * r.height;
  canvas.dispatchEvent(new MouseEvent('mousedown', { clientX, clientY, bubbles: true }));
}

/** Click a station by id, walking there first if needed. */
async function clickStation(id) {
  const st = game.stations.find((s) => s.id === id);
  clickAt(st.rect.x + st.rect.w / 2, st.rect.y + st.rect.h / 2);
}

function key(code, type = 'keydown') {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

async function runSelftest() {
  const report = { steps: [], errors: window.__errors, passed: false };
  const log = (s) => report.steps.push(s);
  try {
    // Start from the title screen with a real key press.
    key('Enter');
    await waitFor(() => game.screen === SCREEN_PLAY, 5000, 'game starts');
    log('started');
    // Music starts with the game (on the player's own gesture) and the
    // mute toggle answers from the keyboard and the on-screen button.
    report.music = { timer: !!sfx.musicTimer, ctxState: sfx.ctx ? sfx.ctx.state : 'none' };
    log(`music: timer=${sfx.musicTimer ? 'on' : 'off'} ctx=${sfx.ctx ? sfx.ctx.state : 'none'}`);
    if (!sfx.musicTimer) throw new Error('background music did not start');
    key('KeyM');
    await sleep(100);
    if (!game.muted) throw new Error('M key did not mute');
    log('M key mutes');
    key('KeyM');
    await sleep(100);
    if (game.muted) throw new Error('M key did not unmute');
    log('M key unmutes');
    clickAt(MUTE_BUTTON.x + 10, MUTE_BUTTON.y + 10);
    await sleep(100);
    if (!game.muted) throw new Error('on-screen mute button did not mute');
    log('on-screen mute button mutes');
    clickAt(MUTE_BUTTON.x + 10, MUTE_BUTTON.y + 10);
    await sleep(100);
    if (game.muted) throw new Error('on-screen mute button did not unmute');
    log('on-screen mute button unmutes');

    // Keyboard movement really moves the cook.
    const x0 = game.player.x;
    key('KeyD');
    await sleep(500);
    key('KeyD', 'keyup');
    if (game.player.x <= x0 + 20) throw new Error('keyboard movement did not move the cook');
    log(`keyboard move: x ${Math.round(x0)} -> ${Math.round(game.player.x)}`);

    // Clear the cook's hands and plate 0: take every item back off the
    // plate and throw it away, so a fresh order starts from empty.
    async function clearPlate() {
      if (game.hand) {
        await clickStation('trash');
        await waitFor(() => !game.hand, 10000, 'trash hand item');
      }
      while (game.plates[0].items.length > 0) {
        await clickStation('plate-0');
        await waitFor(() => game.hand && (game.hand.kind === 'item' || game.hand.kind === 'plate'), 10000, 'take item back off plate');
        await clickStation('trash');
        await waitFor(() => !game.hand, 10000, 'trash plate item');
      }
    }

    // Serve one order, ingredient by ingredient, through real clicks.
    // Throws when the order expires mid-serve, so the caller can recover.
    async function serveOrder(target) {
      const stillThere = () => game.orders[0] && game.orders[0].id === target.id;
      log(`serving order: ${target.recipe.name} (${target.recipe.items.join('+')})`);
      for (const ing of target.recipe.items) {
        if (!stillThere()) throw new Error('order expired mid-serve');
        const prep = INGREDIENTS[ing].prep;
        await clickStation(`crate-${ing}`);
        await waitFor(() => game.hand && game.hand.ing === ing, 15000, `pick ${ing}`);
        log(`picked ${ing}`);
        if (prep === 'chop') {
          await clickStation('board');
          await waitFor(() => game.board.item && game.board.item.ing === ing, 15000, `place ${ing} on board`);
          for (let t = 0; t < 3; t++) {
            await clickStation('board');
            await sleep(150);
          }
          await waitFor(() => game.hand && game.hand.ing === ing && game.hand.prep === 'ready', 15000, `chop ${ing} done`);
          log(`chopped ${ing}`);
        } else if (prep === 'fry') {
          await clickStation('burner-0');
          await waitFor(() => game.burners[0].item && game.burners[0].item.ing === ing, 15000, `place ${ing} on burner`);
          await waitFor(() => burnerState(game.burners[0]) === 'done', 15000, `fry ${ing} done`);
          await clickStation('burner-0');
          await waitFor(() => game.hand && game.hand.ing === ing && game.hand.prep === 'ready', 15000, `take fried ${ing}`);
          log(`fried ${ing}`);
        }
        if (!stillThere()) throw new Error('order expired mid-serve');
        await clickStation('plate-0');
        await waitFor(() => game.plates[0].items.includes(ing), 15000, `plate ${ing}`);
        log(`plated ${ing}`);
      }
      if (!stillThere()) throw new Error('order expired mid-serve');
      // Pick the finished plate up and serve it at the window.
      await clickStation('plate-0');
      await waitFor(() => game.hand && game.hand.kind === 'plate', 15000, 'pick up finished plate');
      log('picked up finished plate');
      const servedBefore = game.served;
      await clickStation('window');
      await waitFor(() => game.served > servedBefore, 15000, 'serve at window');
      log(`served! score=${game.score} served=${game.served}`);
    }

    // Serve three different recipes end to end; an order that expires
    // mid-serve is abandoned (plate cleared) and the next one is served.
    const servedRecipes = [];
    let attempts = 0;
    while (servedRecipes.length < 3 && attempts < 6) {
      attempts += 1;
      if (!game.orders.length) {
        await waitFor(() => game.orders.length > 0, 20000, 'next order appears');
      }
      const target = game.orders[0];
      try {
        await serveOrder(target);
        servedRecipes.push(target.recipe.name);
      } catch (e) {
        const gone = !game.orders.some((o) => o.id === target.id);
        if (String(e.message) === 'order expired mid-serve' || gone) {
          log(`order ${target.recipe.name} expired mid-serve — clearing plate`);
          await clearPlate();
          continue;
        }
        throw e;
      }
    }
    if (servedRecipes.length < 3) throw new Error(`only served ${servedRecipes.length} orders`);
    log(`served 3 orders: ${servedRecipes.join(', ')}`);
    report.recipes = servedRecipes;

    // The shift timer really counts down and the game ends.
    if (game.score <= 0) throw new Error('score did not increase after serving');
    if (window.__errors.length > 0) throw new Error(`page errors: ${window.__errors.join(' | ')}`);
    report.passed = true;
    report.score = game.score;
    report.served = game.served;
    report.ordersLeft = game.orders.length;
    report.timeLeft = Math.round(game.timeLeft);
  } catch (e) {
    report.error = String(e && e.message ? e.message : e);
    report.screen = game.screen;
    report.score = game.score;
    report.served = game.served;
    report.hand = game.hand;
    report.plate0 = game.plates[0].items;
    report.orders = game.orders.map((o) => o.recipe.name);
    report.elapsed = Math.round(game.elapsed * 10) / 10;
    report.spawnIn = Math.round(game.spawnIn * 10) / 10;
    report.hidden = document.hidden;
    report.ticks = window.__ticks || 0;
  }
  const pre = document.createElement('pre');
  pre.id = 'selftest-report';
  pre.textContent = JSON.stringify(report, null, 2);
  document.body.appendChild(pre);
  document.title = report.passed ? 'SELFTEST PASS' : `SELFTEST FAIL: ${report.error || 'unknown'}`;
  window.__selftestDone = true;
}

// ------------------------------------------------------------ loop

function runGame() {
  let accumulator = 0;
  let last = performance.now();
  let lastFrameAt = last;
  function stepFrame(now) {
    if (now < last) now = last;
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }
    renderer.draw(game);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    lastFrameAt = performance.now();
    stepFrame(now);
  }
  // A watchdog for environments where requestAnimationFrame rarely fires
  // (a headless dump): it drives the loop on a timer instead. In a live
  // browser frames arrive every ~16 ms and the watchdog never fires.
  setInterval(() => {
    if (performance.now() - lastFrameAt > 100) stepFrame(performance.now());
  }, 50);
  announce('Dapur Kilat. Tekan Enter atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shotName) {
  stageShot(shotName);
  // Paint synchronously (twice, like a frame pair) so the shot is ready
  // even where requestAnimationFrame rarely fires.
  renderer.draw(game);
  renderer.draw(game);
  window.__shotReady = true;
} else if (selftest) {
  runGame();
  runSelftest();
} else {
  runGame();
}
