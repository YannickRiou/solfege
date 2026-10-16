import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UNITS, ALL } from '../js/curriculum.js';
import { EXERCISES } from '../js/exercises.js';
import { STAFF_LOW, STAFF_HIGH, midiOf, frName, staffY, ledgerSteps } from '../js/notation.js';
import { blank, load, save, recordDay, currentStreak } from '../js/storage.js';
import { pickItem, learn, weightOf, pickType } from '../js/scheduler.js';

test('notation : do central, la 440, positions sur la portée', () => {
  assert.equal(midiOf(28), 60);
  assert.equal(frName(28), 'do3');
  assert.equal(midiOf(33), 69);
  assert.equal(frName(33), 'la3');
  assert.equal(staffY(30), 104);           // mi3 sur la ligne du bas
  assert.deepEqual(ledgerSteps(28), [28]); // do3 : une ligne ajoutée
  assert.deepEqual(ledgerSteps(40), [40]); // la4 : une ligne ajoutée
  assert.deepEqual(ledgerSteps(34), []);
});

test('programme : identifiants uniques, types connus, items valides', () => {
  const ids = ALL.map(l => l.id);
  assert.equal(new Set(ids).size, ids.length, 'deux leçons ont le même id');
  for (const u of UNITS) assert.ok(u.title && u.lessons.length, `unité vide : ${u.title}`);
  for (const l of ALL) {
    assert.ok(l.title, `${l.id} : titre manquant`);
    assert.ok(l.types.length, `${l.id} : aucun type d'exercice`);
    assert.ok(l.items.length >= 2, `${l.id} : il faut au moins 2 notes`);
    const kinds = new Set(l.types.map(t => {
      assert.ok(EXERCISES[t], `${l.id} : type d'exercice inconnu « ${t} »`);
      return EXERCISES[t].items;
    }));
    assert.equal(kinds.size, 1, `${l.id} : mélange d'exercices sur degrés et sur lettres`);
    const [lo, hi] = kinds.has('letter') ? [0, 6] : [STAFF_LOW, STAFF_HIGH];
    for (const x of l.items) assert.ok(Number.isInteger(x) && x >= lo && x <= hi, `${l.id} : item hors limites ${x}`);
  }
});

test('exercices : chaque type de chaque leçon produit une question affichable', () => {
  const S = blank();
  for (const l of ALL) for (const t of l.types) {
    const ex = EXERCISES[t];
    for (let k = 0; k < 20; k++) {
      const q = ex.make({ lesson: l, pick: (ex2 = []) => pickItem(S, ex.skill, l.items, ex2) });
      assert.ok(l.items.includes(q.item), `${l.id}/${t} : item hors leçon`);
      const { prompt, body } = ex.render(q);
      assert.ok(typeof prompt === 'string' && prompt.length, `${l.id}/${t} : consigne vide`);
      assert.ok(typeof body === 'string' && body.includes('data-input'), `${l.id}/${t} : aucun élément cliquable`);
    }
  }
});

test('répétition espacée : une note ratée pèse plus lourd, une réussie moins', () => {
  const S = blank();
  learn(S, 'read', 30, false);
  assert.ok(weightOf(S, 'read', 30) > 1);
  learn(S, 'read', 31, true);
  assert.ok(weightOf(S, 'read', 31) < 1);
  assert.equal(pickItem(S, 'read', [30, 31], [30]), 31);
  assert.equal(pickItem(S, 'read', [30], [30]), 30); // rien d'autre : on garde la seule note
  assert.equal(pickItem(S, 'read', [30, 31], [], () => 0.99), 31);
  assert.notEqual(pickType(['a', 'b'], 'a'), 'a');
});

test('stockage : aller-retour et série de jours', () => {
  const mem = { data: {}, getItem(k) { return this.data[k] ?? null; }, setItem(k, v) { this.data[k] = v; } };
  const S = blank();
  S.xp = 40;
  save(S, mem);
  assert.equal(load(mem).xp, 40);
  assert.equal(load({ getItem() { return '{oups'; } }).xp, 0); // données illisibles → départ à zéro

  const d1 = new Date(2026, 0, 1), d2 = new Date(2026, 0, 2), d4 = new Date(2026, 0, 4);
  recordDay(S, d1); assert.equal(S.streak, 1);
  recordDay(S, d1); assert.equal(S.streak, 1);
  recordDay(S, d2); assert.equal(S.streak, 2);
  assert.equal(currentStreak(S, d4), 0);
  recordDay(S, d4); assert.equal(S.streak, 1);
});
