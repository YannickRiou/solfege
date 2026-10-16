// Notation : une note est un « degré » diatonique = octave * 7 + lettre (0 = do … 6 = si).
// 28 = do central : do3 en notation française (C4 en notation anglo-saxonne).
// Les touches noires ne sont pas des degrés : on les repère par la touche blanche à leur gauche.

export const NAMES = ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'];
const SEMITONES = [0, 2, 4, 5, 7, 9, 11];

export const STAFF_LOW = 28;  // do3 : une ligne supplémentaire sous la portée
export const STAFF_HIGH = 40; // la4 : une ligne supplémentaire au-dessus
export const KEY_LOW = 28;    // clavier affiché : do3 …
export const KEY_HIGH = 41;   // … si4, soit 14 touches blanches

export const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const letter = step => step % 7;
export const noteName = step => NAMES[step % 7];
export const frName = step => NAMES[step % 7] + (Math.floor(step / 7) - 1);
export const midiOf = step => 12 * (Math.floor(step / 7) + 1) + SEMITONES[step % 7];
export const hasBlackAfter = step => [0, 1, 3, 4, 5].includes(step % 7);

/* Portée en clé de sol */
const GAP = 14;     // écart entre deux lignes, en unités SVG
const BOTTOM = 104; // ordonnée de la ligne du bas (mi3)
const MI3 = 30;
const FA4 = 38;     // ligne du haut

export const staffY = step => BOTTOM - (step - MI3) * GAP / 2;

export function ledgerSteps(step) {
  const out = [];
  for (let s = MI3 - 2; s >= step; s -= 2) out.push(s);
  for (let s = FA4 + 2; s <= step; s += 2) out.push(s);
  return out;
}

function noteSVG({ step, x = 190, cls = '', i = null }) {
  const ledgers = ledgerSteps(step)
    .map(s => `<line x1="${x - 16}" x2="${x + 16}" y1="${staffY(s)}" y2="${staffY(s)}"/>`).join('');
  return `<g class="note ${cls}"${i === null ? '' : ` data-i="${i}"`}>${ledgers}`
    + `<g transform="translate(${x} ${staffY(step)})"><g class="pop">`
    + `<ellipse class="head" rx="9.5" ry="6.6"/><ellipse class="hole" rx="5" ry="3.4" transform="rotate(-35)"/>`
    + `</g></g></g>`;
}

/**
 * notes : [{ step, x?, cls?, i? }]  — rondes à dessiner
 * zones : liste de degrés cliquables (exercice « placer la note »)
 */
export function staffSVG({ notes = [], zones = null, clef = true, width = 300, label = 'Portée en clé de sol' } = {}) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const y = BOTTOM - i * GAP;
    s += `<line x1="8" x2="${width - 8}" y1="${y}" y2="${y}"/>`;
  }
  if (clef) s += `<text class="clef" x="14" y="${staffY(32)}">𝄞</text>`;
  s += notes.map(noteSVG).join('');
  if (zones) {
    s += zones.map(st => `<rect class="zone" data-input="pos" data-step="${st}" x="60" width="${width - 68}" y="${staffY(st) - GAP / 4}" height="${GAP / 2}"/>`).join('');
  }
  return `<svg class="staff" viewBox="0 0 ${width} 150" role="img" aria-label="${label}">${s}</svg>`;
}

/* Clavier */
export function keyboardHTML({ mark = null, target = null, interactive = true } = {}) {
  const n = KEY_HIGH - KEY_LOW + 1;
  const tag = interactive ? 'button' : 'div';
  let whites = '', blacks = '';
  for (let s = KEY_LOW; s <= KEY_HIGH; s++) {
    const i = s - KEY_LOW;
    const input = interactive ? ` data-input="key" aria-label="Touche blanche ${i + 1}"` : '';
    whites += `<${tag} class="wk${s === target ? ' target' : ''}" data-step="${s}"${input}>`
      + `${s === mark ? '<span class="dot" aria-hidden="true"></span>' : ''}</${tag}>`;
    if (hasBlackAfter(s) && s < KEY_HIGH) {
      const binput = interactive ? ` data-input="key" data-black="1" aria-label="Touche noire"` : '';
      blacks += `<${tag} class="bk" data-step="${s}"${binput} style="left:calc(${(i + 1) / n * 100}% - var(--bkw) / 2)"></${tag}>`;
    }
  }
  return `<div class="kbd${interactive ? '' : ' static'}" style="--keys:${n}">${whites}${blacks}</div>`;
}
