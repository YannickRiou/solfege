// Répétition espacée minimale : chaque couple (compétence, note) a un poids.
// Une erreur double le poids (+1, plafonné à 8), une réussite le réduit (×0,7, plancher 0,4).
// Plus le poids est fort, plus la note a de chances d'être tirée.
const DEFAULT = 1, MIN = 0.4, MAX = 8;

export const weightOf = (state, skill, item) => state.items[`${skill}:${item}`]?.w ?? DEFAULT;

export function learn(state, skill, item, ok) {
  const w = weightOf(state, skill, item);
  state.items[`${skill}:${item}`] = { w: ok ? Math.max(MIN, w * 0.7) : Math.min(MAX, w * 2 + 1) };
}

export function pickItem(state, skill, items, exclude = [], rand = Math.random) {
  let pool = items.filter(x => !exclude.includes(x));
  if (!pool.length) pool = items;
  const ws = pool.map(x => weightOf(state, skill, x));
  let r = rand() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) if ((r -= ws[i]) <= 0) return pool[i];
  return pool[pool.length - 1];
}

// Alterne les types d'exercices d'une leçon sans répéter deux fois de suite le même.
export function pickType(types, prev, rand = Math.random) {
  const pool = types.length > 1 ? types.filter(t => t !== prev) : types;
  return pool[Math.floor(rand() * pool.length)];
}
