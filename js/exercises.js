import {
  NAMES, STAFF_LOW, STAFF_HIGH, KEY_LOW, KEY_HIGH,
  range, letter, noteName, frName, midiOf, staffSVG, keyboardHTML,
} from './notation.js';
import { tone } from './audio.js';

/*
 * Types d'exercices. Chacun déclare :
 *   title  : nom affiché dans le parcours
 *   skill  : compétence suivie par la répétition espacée ('read' lire, 'key' clavier, 'play' lire et jouer)
 *   items  : ce que contiennent les items de la leçon — 'step' (degré, 28 = do3) ou 'letter' (0 = do … 6 = si)
 *   make({ lesson, pick })   → question { item, … }   (pick(exclude?) tire un item de la leçon)
 *   render(q)                → { prompt, body }       (HTML)
 *   input(q, el, root)       → null tant que l'exercice continue, sinon { ok, msg, results? }
 *                              results = [{ item, ok }] si plusieurs notes sont notées (sinon q.item)
 *   onKey(q, event, root)    → facultatif, raccourcis clavier
 * Tout élément cliquable de l'exercice porte data-input="…" ; l'app transmet le clic à input().
 */

const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const paper = svg => `<div class="paper">${svg}</div>`;
const nameChoices = () => `<div class="choices">${NAMES.map((n, i) => `<button class="choice" data-input="name" data-v="${i}">${n}</button>`).join('')}</div>`;
const keyEl = (root, step) => root.querySelector(`.wk[data-step="${step}"]`);
const add = (el, cls) => el && el.classList.add(cls);
const flash = el => { add(el, 'hit'); setTimeout(() => el && el.classList.remove('hit'), 250); };
const clampStaff = s => Math.min(STAFF_HIGH, Math.max(STAFF_LOW, s));
const keyTone = el => tone(midiOf(+el.dataset.step) + (el.dataset.black ? 1 : 0));

const placeStaff = q => staffSVG({ notes: [{ step: q.sel, x: 150, cls: 'ghost' }], zones: range(STAFF_LOW, STAFF_HIGH), label: 'Portée où placer la note' });
function moveGhost(q, root, sel) {
  q.sel = clampStaff(sel);
  tone(midiOf(q.sel));
  root.querySelector('[data-place]').innerHTML = placeStaff(q);
}

export const EXERCISES = {
  name: {
    title: 'Nommer la note', skill: 'read', items: 'step',
    make: ({ pick }) => ({ item: pick() }),
    render: q => ({ prompt: 'Quelle est cette note ?', body: paper(staffSVG({ notes: [{ step: q.item }] })) + nameChoices() }),
    input(q, el, root) {
      if (el.dataset.input !== 'name') return null;
      const v = +el.dataset.v, ok = v === letter(q.item);
      tone(midiOf(q.item));
      add(el, ok ? 'hit' : 'miss');
      if (!ok) add(root.querySelector(`.choice[data-v="${letter(q.item)}"]`), 'hit');
      return { ok, msg: ok ? `C'est bien un ${noteName(q.item)}.` : `C'était un ${noteName(q.item)}, pas un ${NAMES[v]}.` };
    },
  },

  truefalse: {
    title: 'Vrai ou faux', skill: 'read', items: 'step',
    make({ lesson, pick }) {
      const item = pick();
      const others = [...new Set(lesson.items.map(letter))].filter(l => l !== letter(item));
      const pool = others.length ? others : range(0, 6).filter(l => l !== letter(item));
      return { item, asked: Math.random() < 0.5 ? letter(item) : rnd(pool) };
    },
    render: q => ({
      prompt: `Cette note est-elle un ${NAMES[q.asked]} ?`,
      body: paper(staffSVG({ notes: [{ step: q.item }] }))
        + `<div class="choices two"><button class="choice" data-input="yesno" data-v="1">Oui</button><button class="choice" data-input="yesno" data-v="0">Non</button></div>`,
    }),
    input(q, el, root) {
      if (el.dataset.input !== 'yesno') return null;
      const truth = q.asked === letter(q.item), ok = (el.dataset.v === '1') === truth;
      tone(midiOf(q.item));
      add(el, ok ? 'hit' : 'miss');
      if (!ok) add(root.querySelector(`.choice[data-v="${truth ? 1 : 0}"]`), 'hit');
      return { ok, msg: truth ? `Oui, c'est un ${noteName(q.item)}.` : `Non, c'est un ${noteName(q.item)}.` };
    },
  },

  findstaff: {
    title: 'Trouver la portée', skill: 'read', items: 'step',
    make({ lesson, pick }) {
      const item = pick();
      let pool = lesson.items.filter(s => letter(s) !== letter(item));
      if (pool.length < 2) pool = range(STAFF_LOW, STAFF_HIGH).filter(s => letter(s) !== letter(item) && Math.abs(s - item) <= 3);
      const others = shuffle(pool).filter((s, i, a) => a.findIndex(x => letter(x) === letter(s)) === i).slice(0, 2);
      return { item, options: shuffle([item, ...others]) };
    },
    render: q => ({
      prompt: `Où est le ${noteName(q.item)} ?`,
      body: `<div class="options">${q.options.map((s, i) => `<button class="option" data-input="staff" data-step="${s}" aria-label="Choix ${i + 1}">${staffSVG({ notes: [{ step: s, x: 60 }], clef: false, width: 120, label: `Choix ${i + 1}` })}</button>`).join('')}</div>`,
    }),
    input(q, el, root) {
      if (el.dataset.input !== 'staff') return null;
      const v = +el.dataset.step, ok = v === q.item;
      tone(midiOf(v));
      add(el, ok ? 'hit' : 'miss');
      if (!ok) add(root.querySelector(`.option[data-step="${q.item}"]`), 'hit');
      return { ok, msg: ok ? `C'est bien le ${noteName(q.item)}.` : `Tu as choisi un ${noteName(v)}. Le ${noteName(q.item)} est encadré.` };
    },
  },

  place: {
    title: 'Placer la note', skill: 'read', items: 'step',
    // La note fantôme démarre sur la ligne du milieu (si), ou juste en dessous si on demande un si.
    make: ({ pick }) => { const item = pick(); return { item, sel: letter(item) === 6 ? 33 : 34 }; },
    render: q => ({
      prompt: `Place un ${noteName(q.item)} sur la portée`,
      body: `<div class="paper" data-place>${placeStaff(q)}</div>
        <div class="placebar"><button class="secondary" data-input="move" data-d="-1" aria-label="Descendre la note">↓</button><button class="secondary" data-input="move" data-d="1" aria-label="Monter la note">↑</button><button class="primary" data-input="validate">Valider</button></div>
        <p class="hint">Touche la portée ou utilise les flèches, puis valide.</p>`,
    }),
    input(q, el, root) {
      const t = el.dataset.input;
      if (t === 'pos') { moveGhost(q, root, +el.dataset.step); return null; }
      if (t === 'move') { moveGhost(q, root, q.sel + +el.dataset.d); return null; }
      if (t !== 'validate') return null;
      // n'importe quelle octave est acceptée : un do grave ou aigu est un do
      const ok = letter(q.sel) === letter(q.item);
      const notes = [{ step: q.sel, x: 150, cls: ok ? 'good' : 'bad' }];
      if (!ok) notes.push({ step: q.item, x: 240, cls: 'good' });
      root.querySelector('[data-place]').innerHTML = staffSVG({ notes });
      root.querySelector('.placebar').hidden = true;
      return { ok, msg: ok ? `C'est bien un ${noteName(q.item)}.` : `Tu as placé un ${noteName(q.sel)}. Le ${noteName(q.item)} est affiché à droite.` };
    },
    onKey(q, e, root) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      moveGhost(q, root, q.sel + (e.key === 'ArrowUp' ? 1 : -1));
    },
  },

  key: {
    title: 'Trouver la touche', skill: 'key', items: 'letter',
    make: ({ pick }) => ({ item: pick() }),
    render: q => ({ prompt: 'Touche cette note sur le clavier', body: `<div class="bigname">${NAMES[q.item]}</div>` + keyboardHTML() }),
    input(q, el, root) {
      if (el.dataset.input !== 'key') return null;
      keyTone(el);
      const step = +el.dataset.step, black = !!el.dataset.black;
      const ok = !black && letter(step) === q.item;
      range(KEY_LOW, KEY_HIGH).filter(s => letter(s) === q.item).forEach(s => add(keyEl(root, s), 'hit'));
      if (!ok) add(el, 'miss');
      const name = NAMES[q.item];
      if (ok) return { ok, msg: `C'est bien un ${name}.` };
      return { ok, msg: black ? `C'est une touche noire. Les ${name} sont surlignés.` : `Tu as touché un ${noteName(step)}. Les ${name} sont surlignés.` };
    },
  },

  keyname: {
    title: 'Nommer la touche', skill: 'key', items: 'letter',
    make: ({ pick }) => { const item = pick(); return { item, step: rnd(range(KEY_LOW, KEY_HIGH).filter(s => letter(s) === item)) }; },
    render: q => ({ prompt: 'Comment s\'appelle cette touche ?', body: keyboardHTML({ target: q.step, interactive: false }) + nameChoices() }),
    input(q, el, root) {
      if (el.dataset.input !== 'name') return null;
      const v = +el.dataset.v, ok = v === q.item;
      tone(midiOf(q.step));
      add(el, ok ? 'hit' : 'miss');
      if (!ok) add(root.querySelector(`.choice[data-v="${q.item}"]`), 'hit');
      return { ok, msg: ok ? `C'est bien un ${NAMES[q.item]}.` : `C'était un ${NAMES[q.item]}, pas un ${NAMES[v]}.` };
    },
  },

  play: {
    title: 'Jouer la note', skill: 'play', items: 'step',
    make: ({ pick }) => ({ item: pick() }),
    render: q => ({ prompt: 'Joue cette note sur le clavier', body: paper(staffSVG({ notes: [{ step: q.item }] })) + keyboardHTML({ mark: 28 }) }),
    input(q, el, root) {
      if (el.dataset.input !== 'key') return null;
      keyTone(el);
      const step = +el.dataset.step, black = !!el.dataset.black, ok = !black && step === q.item;
      add(keyEl(root, q.item), 'hit');
      if (!ok) add(el, 'miss');
      const name = frName(q.item);
      if (ok) return { ok, msg: `C'est un ${name}.` };
      return { ok, msg: black ? `C'est une touche noire. Le ${name} est surligné.` : `Tu as joué un ${frName(step)}. Le ${name} est surligné.` };
    },
  },

  melody: {
    title: 'Petite mélodie', skill: 'play', items: 'step',
    make({ pick }) {
      const seq = [pick()];
      while (seq.length < 4) seq.push(pick([seq[seq.length - 1]]));
      return { item: seq[0], seq, idx: 0 };
    },
    render: q => ({
      prompt: 'Joue ces 4 notes dans l\'ordre',
      body: paper(staffSVG({ notes: q.seq.map((step, i) => ({ step, x: 100 + i * 55, cls: i === 0 ? 'current' : '', i })), label: 'Mélodie de 4 notes' })) + keyboardHTML({ mark: 28 }),
    }),
    input(q, el, root) {
      if (el.dataset.input !== 'key') return null;
      keyTone(el);
      const step = +el.dataset.step, black = !!el.dataset.black, expected = q.seq[q.idx];
      const notes = root.querySelectorAll('.note[data-i]');
      const before = q.seq.slice(0, q.idx).map(item => ({ item, ok: true }));
      if (!black && step === expected) {
        notes[q.idx].classList.replace('current', 'done');
        flash(el);
        q.idx++;
        if (q.idx === q.seq.length) return { ok: true, msg: 'Mélodie jouée sans faute.', results: [...before, { item: expected, ok: true }] };
        notes[q.idx].classList.add('current');
        return null;
      }
      notes[q.idx].classList.replace('current', 'bad');
      add(keyEl(root, expected), 'hit');
      add(el, 'miss');
      const played = black ? 'tu as touché une touche noire' : `tu as joué un ${frName(step)}`;
      return { ok: false, msg: `Note ${q.idx + 1} : il fallait un ${frName(expected)}, ${played}.`, results: [...before, { item: expected, ok: false }] };
    },
  },
};
