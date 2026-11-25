// Dapur Kilat — kitchen.js
// The kitchen itself: where every station stands, how the cook walks between
// them, and what happens when the cook uses one. The loop is pick → prep
// (chop on the board, fry on a burner) → plate → serve at the window, and
// the route the player plans through these stations is the game.

import { FRY_TIME, BURN_AFTER, INGREDIENTS, INGREDIENT_IDS } from './recipes.js';
import { findOrderForPlate } from './orders.js';

export const PLAYER_SPEED = 280; // px per second
export const PLAYER_RADIUS = 18;
export const INTERACT_RANGE = 130; // px from a station's approach point
export let CHOP_TAPS = 3; // taps to finish chopping one ingredient

/** The Pisau Tajam upgrade chops in 2 taps; a plain shift restores 3. */
export function setChopTaps(taps) {
  CHOP_TAPS = taps;
}

/** A station: where it is drawn, where the cook stands to use it, what it is. */
function station(id, kind, label, rect, approach, extra = {}) {
  return { id, kind, label, rect, approach, ...extra };
}

export function buildStations() {
  const stations = [];
  // Ingredient crates, two columns on the left wall.
  const crateSize = { w: 86, h: 76 };
  const crateGap = 10;
  INGREDIENT_IDS.forEach((ing, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 28 + col * (crateSize.w + crateGap);
    // Crates sit below the order board (which ends at y 206) with a gap
    // for the BAHAN label pill painted above them.
    const y = 212 + row * (crateSize.h + crateGap);
    stations.push(station(`crate-${ing}`, 'crate', INGREDIENTS[ing].name, { x, y, w: crateSize.w, h: crateSize.h }, { x: 246, y: y + crateSize.h / 2 }, { ing }));
  });
  // Chopping board, centre-left.
  stations.push(station('board', 'board', 'Talenan', { x: 280, y: 300, w: 220, h: 120 }, { x: 390, y: 452 }));
  // Stove with two burners, centre-right.
  stations.push(station('burner-0', 'burner', 'Kompor 1', { x: 620, y: 318, w: 92, h: 76 }, { x: 666, y: 452 }, { burner: 0 }));
  stations.push(station('burner-1', 'burner', 'Kompor 2', { x: 728, y: 318, w: 92, h: 76 }, { x: 774, y: 452 }, { burner: 1 }));
  stations.push(station('stove', 'stove', 'Kompor', { x: 540, y: 290, w: 300, h: 130 }, { x: 690, y: 452 }));
  // Plating counter, two plates, bottom centre.
  stations.push(station('plate-0', 'plate', 'Piring 1', { x: 356, y: 540, w: 128, h: 88 }, { x: 420, y: 505 }, { plate: 0 }));
  stations.push(station('plate-1', 'plate', 'Piring 2', { x: 616, y: 540, w: 128, h: 88 }, { x: 680, y: 505 }, { plate: 1 }));
  // Serving window, right wall — below the order board so its label pill
  // fits in the gap between board and window.
  stations.push(station('window', 'window', 'Jendela Saji', { x: 900, y: 236, w: 356, h: 260 }, { x: 1078, y: 520 }));
  // Trash bin, bottom right.
  stations.push(station('trash', 'trash', 'Sampah', { x: 900, y: 560, w: 110, h: 90 }, { x: 955, y: 538 }));
  return stations;
}

/** The solid counters the cook walks around (crates, board, stove, plates, window, trash). */
export function buildObstacles(stations) {
  return stations
    .filter((s) => s.kind !== 'burner')
    .map((s) => s.rect);
}

export function stationAtPoint(stations, x, y) {
  // Burners are part of the stove rect: check them first so a click on a
  // burner reaches the burner, not the stove body.
  for (const s of stations) {
    if (s.kind === 'burner' && x >= s.rect.x && x < s.rect.x + s.rect.w && y >= s.rect.y && y < s.rect.y + s.rect.h) return s;
  }
  for (const s of stations) {
    if (s.kind === 'burner' || s.kind === 'stove') continue;
    if (x >= s.rect.x && x < s.rect.x + s.rect.w && y >= s.rect.y && y < s.rect.y + s.rect.h) return s;
  }
  for (const s of stations) {
    if (s.kind === 'stove' && x >= s.rect.x && x < s.rect.x + s.rect.w && y >= s.rect.y && y < s.rect.y + s.rect.h) return s;
  }
  return null;
}

/** The station the cook can use from where they stand, nearest first. */
export function nearestUsableStation(stations, px, py) {
  let best = null;
  let bestDist = Infinity;
  for (const s of stations) {
    if (s.kind === 'stove') continue; // the stove body is not usable; its burners are
    const d = Math.hypot(px - s.approach.x, py - s.approach.y);
    if (d <= INTERACT_RANGE && d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return best;
}

/** Move the cook, sliding along solid counters instead of passing through them. */
export function movePlayer(player, dx, dy, dt, obstacles) {
  const step = (axis, delta) => {
    if (delta === 0) return;
    player[axis] += delta * dt;
    for (const r of obstacles) {
      const cx = Math.max(r.x, Math.min(player.x, r.x + r.w));
      const cy = Math.max(r.y, Math.min(player.y, r.y + r.h));
      const ddx = player.x - cx;
      const ddy = player.y - cy;
      const dist = Math.hypot(ddx, ddy);
      if (dist < PLAYER_RADIUS) {
        if (dist === 0) {
          player[axis] += axis === 'x' ? PLAYER_RADIUS : -PLAYER_RADIUS;
        } else {
          const push = (PLAYER_RADIUS - dist) / dist;
          player.x += ddx * push;
          player.y += ddy * push;
        }
      }
    }
    player.x = Math.max(24 + PLAYER_RADIUS, Math.min(1256 - PLAYER_RADIUS, player.x));
    // The cook stays inside the warung: the street band below y 640 is
    // for seated customers and passing traffic, not for walking.
    player.y = Math.max(186 + PLAYER_RADIUS, Math.min(624 - PLAYER_RADIUS, player.y));
  };
  step('x', dx);
  step('y', dy);
}

/** A burner's state from its timer: cooking, done, or burnt. */
export function burnerState(burner) {
  if (!burner.item) return 'empty';
  if (burner.t >= BURN_AFTER) return 'burnt';
  if (burner.t >= FRY_TIME) return 'done';
  return 'cooking';
}

/** A raw hand item becomes ready once its prep is done (or needs none). */
export function itemReady(item) {
  return item && item.prep === 'ready';
}

/**
 * Use a station. `game` is the live state (hand, board, burners, plates).
 * Returns { ok, action, order? } — the caller scores, sounds and announces.
 */
export function interact(game, stationId) {
  const gameState = game;
  const hand = gameState.hand;
  const station = gameState.stations.find((s) => s.id === stationId);
  if (!station) return { ok: false, reason: 'no-station' };

  if (station.kind === 'crate') {
    if (hand) return { ok: false, reason: 'hand-full' };
    const ing = INGREDIENTS[station.ing];
    gameState.hand = { kind: 'item', ing: ing.id, prep: ing.prep === 'none' ? 'ready' : 'raw' };
    return { ok: true, action: 'pick' };
  }

  if (station.kind === 'board') {
    const board = gameState.board;
    if (board.item) {
      board.taps += 1;
      if (board.taps >= CHOP_TAPS) {
        const done = { kind: 'item', ing: board.item.ing, prep: 'ready' };
        board.item = null;
        board.taps = 0;
        gameState.hand = done;
        return { ok: true, action: 'chop-done', item: done };
      }
      return { ok: true, action: 'chop', taps: board.taps };
    }
    if (hand && hand.kind === 'item' && hand.prep === 'raw' && INGREDIENTS[hand.ing].prep === 'chop') {
      board.item = hand;
      board.taps = 0;
      gameState.hand = null;
      return { ok: true, action: 'chop-start', item: hand };
    }
    return { ok: false, reason: 'board-needs-chop' };
  }

  if (station.kind === 'burner') {
    const burner = gameState.burners[station.burner];
    const state = burnerState(burner);
    if (state === 'burnt') {
      burner.item = null;
      burner.t = 0;
      return { ok: true, action: 'discard-burnt' };
    }
    if (state === 'done') {
      if (hand) return { ok: false, reason: 'hand-full' };
      gameState.hand = { kind: 'item', ing: burner.item.ing, prep: 'ready' };
      burner.item = null;
      burner.t = 0;
      return { ok: true, action: 'take-fry' };
    }
    if (state === 'cooking') return { ok: false, reason: 'still-cooking' };
    // Empty burner.
    if (hand && hand.kind === 'item' && hand.prep === 'raw' && INGREDIENTS[hand.ing].prep === 'fry') {
      burner.item = hand;
      burner.t = 0;
      gameState.hand = null;
      return { ok: true, action: 'place-fry', item: hand };
    }
    return { ok: false, reason: 'burner-needs-fry' };
  }

  if (station.kind === 'plate') {
    const plate = gameState.plates[station.plate];
    if (hand && hand.kind === 'item' && itemReady(hand)) {
      if (plate.items.includes(hand.ing)) return { ok: false, reason: 'already-on-plate' };
      plate.items.push(hand.ing);
      gameState.hand = null;
      return { ok: true, action: 'plate-add', plate: station.plate };
    }
    if (hand && hand.kind === 'plate') return { ok: false, reason: 'holding-plate' };
    if (!hand) {
      if (plate.items.length === 0) return { ok: false, reason: 'plate-empty' };
      // A finished plate (it matches an open order) is picked up whole to
      // carry to the window; an unfinished one gives its last item back so
      // a mistake can be fixed.
      if (findOrderForPlate(gameState.orders, plate.items)) {
        gameState.hand = { kind: 'plate', items: [...plate.items] };
        plate.items = [];
        return { ok: true, action: 'plate-pickup', plate: station.plate, items: gameState.hand.items };
      }
      const taken = plate.items.pop();
      gameState.hand = { kind: 'item', ing: taken, prep: 'ready' };
      return { ok: true, action: 'plate-takeback', plate: station.plate, item: gameState.hand };
    }
    return { ok: false, reason: 'plate-needs-ready' };
  }

  if (station.kind === 'window') {
    if (hand && hand.kind === 'plate') {
      gameState.hand = null;
      return { ok: true, action: 'serve', items: hand.items };
    }
    return { ok: false, reason: 'window-needs-plate' };
  }

  if (station.kind === 'trash') {
    if (!hand) return { ok: false, reason: 'hand-empty' };
    gameState.hand = null;
    return { ok: true, action: 'trash' };
  }

  return { ok: false, reason: 'not-usable' };
}
