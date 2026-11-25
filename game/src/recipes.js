// Dapur Kilat — recipes.js
// The menu: every ingredient, what it needs before it can be plated, and every
// dish on the order board. Recipes combine the same seven ingredients in
// different ways, so the player has to plan which station each dish needs.

export const FRY_TIME = 4.0; // seconds on a burner before an item is fried
export const BURN_AFTER = 9.0; // seconds on a burner before an item burns

export const INGREDIENTS = {
  nasi: { id: 'nasi', name: 'Nasi', prep: 'fry', color: '#f7ecd0', dark: '#c9b183', blurb: 'goreng di wajan' },
  mie: { id: 'mie', name: 'Mie', prep: 'fry', color: '#f2c14e', dark: '#b98a1e', blurb: 'goreng di wajan' },
  telur: { id: 'telur', name: 'Telur', prep: 'fry', color: '#fff3d6', dark: '#d9a441', blurb: 'goreng di wajan' },
  ayam: { id: 'ayam', name: 'Ayam', prep: 'fry', color: '#e08a5a', dark: '#9c4a22', blurb: 'goreng di wajan' },
  cabai: { id: 'cabai', name: 'Cabai', prep: 'chop', color: '#d9382b', dark: '#8f1d14', blurb: 'cincang di talenan' },
  sayur: { id: 'sayur', name: 'Sayur', prep: 'chop', color: '#4da34d', dark: '#2c6b2f', blurb: 'cincang di talenan' },
  kecap: { id: 'kecap', name: 'Kecap', prep: 'none', color: '#6b4423', dark: '#3d2412', blurb: 'langsung tuang' },
};

export const INGREDIENT_IDS = Object.keys(INGREDIENTS);

/** What a raw ingredient becomes after its prep step. */
export function prepVerb(prep) {
  if (prep === 'chop') return 'dicincang';
  if (prep === 'fry') return 'digoreng';
  return 'siap';
}

/** A dish: a name, the ingredients it needs (each exactly once), and a base tip. */
export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng Kilat', items: ['nasi', 'telur', 'cabai'], tip: 30 },
  { id: 'mie-ayam', name: 'Mie Ayam Pedas', items: ['mie', 'ayam', 'sayur'], tip: 30 },
  { id: 'ayam-geprek', name: 'Ayam Geprek', items: ['ayam', 'cabai', 'nasi'], tip: 40 },
  { id: 'telur-balado', name: 'Telur Balado', items: ['telur', 'cabai', 'sayur'], tip: 30 },
  { id: 'mie-goreng', name: 'Mie Goreng Sayur', items: ['mie', 'sayur', 'telur'], tip: 30 },
  { id: 'nasi-kecap', name: 'Nasi Ayam Kecap', items: ['nasi', 'ayam', 'kecap'], tip: 40 },
  { id: 'mie-pedas', name: 'Mie Pedas Kilat', items: ['mie', 'cabai', 'telur'], tip: 35 },
  { id: 'nasi-sayur', name: 'Nasi Sayur Telur', items: ['nasi', 'sayur', 'telur'], tip: 30 },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? null;
}

/** True when a plate's items are exactly one recipe's items, in any order. */
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.items.length) return false;
  const have = new Set(plateItems);
  return recipe.items.every((ing) => have.has(ing));
}
