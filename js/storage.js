// Progression enregistrée dans le navigateur (localStorage), sur cet appareil uniquement.
// Changer la forme des données ? Incrémenter SCHEMA et ajouter une migration (voir docs/handbook.html).
const KEY = 'solfege.progress';
export const SCHEMA = 1;

export const blank = () => ({ v: SCHEMA, xp: 0, streak: 0, lastDay: null, bestCombo: 0, lessons: {}, items: {} });

export function load(storage = globalThis.localStorage) {
  try {
    const raw = JSON.parse(storage.getItem(KEY));
    if (raw && raw.v === SCHEMA) return { ...blank(), ...raw };
  } catch (e) { /* navigation privée, données illisibles… on repart de zéro */ }
  return blank();
}

export function save(state, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible */ }
}

export function dayKey(now = new Date(), offset = 0) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// La série est perdue si aucune leçon n'a été terminée ni hier ni aujourd'hui.
export function currentStreak(state, now = new Date()) {
  return state.lastDay === dayKey(now) || state.lastDay === dayKey(now, -1) ? state.streak : 0;
}

export function recordDay(state, now = new Date()) {
  const today = dayKey(now);
  if (state.lastDay === today) return;
  state.streak = state.lastDay === dayKey(now, -1) ? state.streak + 1 : 1;
  state.lastDay = today;
}
