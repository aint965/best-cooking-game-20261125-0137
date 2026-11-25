// Dapur Kilat — orders.js
// The order board: which dishes customers want, how long each one waits, and
// what a served plate is worth. Pressure grows with the round: new orders
// arrive sooner and patience shrinks, but no new chore is ever added.

import { RECIPES, plateMatchesRecipe } from './recipes.js';

export const MAX_ACTIVE_ORDERS = 3;
export const ORDER_POINTS_PER_ITEM = 40;

let nextOrderId = 1;

/** Patience for a fresh order in this round, in seconds. */
export function patienceForRound(round) {
  return Math.max(30, 52 - round * 3);
}

/** Seconds between new orders in this round. */
export function spawnGapForRound(round) {
  return Math.max(9, 17 - round);
}

export function makeOrder(round, rng, patienceMult = 1) {
  const recipe = RECIPES[Math.floor(rng() * RECIPES.length)];
  const patience = patienceForRound(round) * patienceMult;
  return {
    id: nextOrderId++,
    recipe,
    patience,
    maxPatience: patience,
    bornAt: 0,
    // Who is waiting at the window for this dish: an index into the
    // renderer's CUSTOMERS, so the window shows different faces.
    customer: Math.floor(rng() * 6),
  };
}

/**
 * Tick the board: age every order, expire the ones whose patience ran out.
 * Returns the expired orders (the caller docks a life for each).
 */
export function tickOrders(orders, dt) {
  const expired = [];
  for (let i = orders.length - 1; i >= 0; i--) {
    orders[i].patience -= dt;
    if (orders[i].patience <= 0) expired.push(orders.splice(i, 1)[0]);
  }
  return expired;
}

/** The open order a finished plate matches, or null when the plate fits none. */
export function findOrderForPlate(orders, plateItems) {
  for (const order of orders) {
    if (plateMatchesRecipe(plateItems, order.recipe)) return order;
  }
  return null;
}

/**
 * Score for serving an order: per-item points plus a patience bonus and the
 * recipe tip, all scaled by the combo multiplier.
 */
export function scoreForServe(order, combo) {
  const itemPoints = order.recipe.items.length * ORDER_POINTS_PER_ITEM;
  const patienceBonus = Math.round(60 * Math.max(0, order.patience / order.maxPatience));
  const multiplier = 1 + 0.25 * (combo - 1);
  return Math.round((itemPoints + patienceBonus + order.recipe.tip) * multiplier);
}
