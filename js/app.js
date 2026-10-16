import { UNITS, ALL } from './curriculum.js';
import { EXERCISES } from './exercises.js';
import { load, save, blank, currentStreak, recordDay } from './storage.js';
import { pickItem, pickType, learn } from './scheduler.js';

const QUESTIONS = 10;      // questions par leçon
const XP_PER_ANSWER = 10;  // XP par bonne réponse
const PRACTICE_DAY = 10;   // réponses d'entraînement qui comptent comme une journée de série

const root = document.getElementById('app');
let S = load();
let L = null; // session en cours : leçon ou entraînement libre

const unlocked = i => i === 0 || !!S.lessons[ALL[i - 1].id]?.done;
const unlockedLessons = () => ALL.filter((_, i) => unlocked(i));
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const skillIcon = lesson => {
  const skill = EXERCISES[lesson.types[0]].skill;
  if (skill === 'read') return '𝄞';
  if (skill === 'play') return '♩';
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 4v16M15.5 4v16" stroke="currentColor" stroke-width="2"/><rect x="6.5" y="4" width="4" height="9" fill="currentColor"/><rect x="13.5" y="4" width="4" height="9" fill="currentColor"/></svg>';
};

/* Accueil */
function renderHome() {
  L = null;
  const cur = ALL.findIndex((l, i) => unlocked(i) && !S.lessons[l.id]?.done);
  const pool = unlockedLessons();
  let html = `<header class="top">
      <div><h1 class="brand">Note à Note</h1><p class="muted">Lire les notes sur la portée, puis les trouver au piano.</p></div>
      <div class="stats"><span class="pill" title="Jours d'affilée avec au moins une leçon ou 10 réponses d'entraînement">Série <b>${currentStreak(S)}</b> j</span><span class="pill">XP <b>${S.xp}</b></span></div>
    </header>
    <section class="practice">
      <div><h2>Entraînement libre</h2>
      <p class="muted">Des questions sans fin, tirées au hasard dans ${pool.length > 1 ? `tes ${pool.length} leçons débloquées` : 'ta première leçon'}. Les notes ratées reviennent plus souvent.${S.bestCombo ? ` Record : ${S.bestCombo} bonnes réponses d'affilée.` : ''}</p></div>
      <button class="primary" data-action="practice">S'entraîner</button>
    </section>`;
  UNITS.forEach((u, ui) => {
    html += `<section class="unit"><div class="uhead"><span class="unum">${ui + 1}</span><div><h2>${u.title}</h2><p class="muted">${u.sub}</p></div></div><ol class="path">`;
    u.lessons.forEach(l => {
      const i = ALL.indexOf(l), st = S.lessons[l.id], open = unlocked(i);
      const cls = st?.done ? 'done' : i === cur ? 'current' : '';
      const right = st?.done ? `<span class="tag">${st.best}/${QUESTIONS}</span>` : open ? '<span class="tag go">Commencer</span>' : '<span class="tag">Verrouillée</span>';
      const types = l.types.map(t => EXERCISES[t].title).join(' · ');
      html += `<li><button class="node ${cls}" data-action="start" data-id="${l.id}" ${open ? '' : 'disabled'}>`
        + `<span class="nicon" aria-hidden="true">${skillIcon(l)}</span><span class="ntitle">${l.title}<small>${types}</small></span>${right}</button></li>`;
    });
    html += '</ol></section>';
  });
  html += `<footer class="foot"><p class="muted">Ta progression est enregistrée dans ce navigateur, sur cet appareil uniquement.</p>
    <button class="link" id="reset" data-action="reset">Remettre à zéro</button></footer>`;
  root.innerHTML = html;
}

/* Séance : une leçon (10 questions) ou l'entraînement libre (sans fin) */
function start(lesson) {
  L = { lesson, practice: !lesson, n: 0, correct: 0, combo: 0, bestCombo: 0, xp: 0, type: null, lastItem: null };
  newQuestion();
  window.scrollTo(0, 0);
}

function newQuestion() {
  const lesson = L.practice ? rnd(unlockedLessons()) : L.lesson;
  const type = pickType(lesson.types, L.type);
  const ex = EXERCISES[type];
  const last = L.lastItem;
  Object.assign(L, { current: lesson, type, ex, answered: false });
  L.q = ex.make({ lesson, pick: (exclude = []) => pickItem(S, ex.skill, lesson.items, last === null ? exclude : [...exclude, last]) });
  L.lastItem = L.q.item;
  renderQuestion();
}

function renderQuestion() {
  const { prompt, body } = L.ex.render(L.q);
  const hint = L.current.hint ? `<p class="hint">${L.current.hint}</p>` : '';
  const bar = L.practice
    ? `<p class="count grow"><b>${L.correct}</b> bonne${L.correct > 1 ? 's' : ''} réponse${L.correct > 1 ? 's' : ''} sur ${L.n} · série <b>${L.combo}</b></p><button class="secondary small" data-action="end">Terminer</button>`
    : `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${QUESTIONS}" aria-valuenow="${L.n}"><i id="bar" style="width:${L.n / QUESTIONS * 100}%"></i></div><span class="count">${L.n + 1}/${QUESTIONS}</span>`;
  root.innerHTML = `<div class="lesson" id="lesson">
      <div class="lbar"><button class="icon" data-action="${L.practice ? 'end' : 'home'}" aria-label="Quitter">✕</button>${bar}</div>
      <div>${L.practice ? `<p class="eyebrow">${L.current.title}</p>` : ''}<p class="prompt">${prompt}</p>${hint}</div>
      ${body}
      <div class="feedback idle" id="fb" role="status" aria-live="polite"></div>
    </div>`;
}

function conclude({ ok, msg, results }) {
  L.answered = true;
  (results || [{ item: L.q.item, ok }]).forEach(r => learn(S, L.ex.skill, r.item, r.ok));
  L.n++;
  if (ok) {
    L.correct++; L.combo++; L.xp += XP_PER_ANSWER; S.xp += XP_PER_ANSWER;
    L.bestCombo = Math.max(L.bestCombo, L.combo);
  } else L.combo = 0;
  if (L.practice) {
    S.bestCombo = Math.max(S.bestCombo || 0, L.bestCombo);
    if (L.n === PRACTICE_DAY) recordDay(S);
  }
  save(S);
  document.getElementById('lesson').classList.add('locked');
  const bar = document.getElementById('bar');
  if (bar) bar.style.width = L.n / QUESTIONS * 100 + '%';
  const fb = document.getElementById('fb');
  const last = !L.practice && L.n >= QUESTIONS;
  fb.className = 'feedback ' + (ok ? 'ok' : 'ko');
  fb.innerHTML = `<p><b>${ok ? 'Bravo !' : 'Raté.'}</b> ${msg}</p><button class="primary" data-action="next">${last ? 'Voir le résultat' : 'Continuer'}</button>`;
  fb.querySelector('button').focus();
}

function next() {
  if (!L.practice && L.n >= QUESTIONS) return finish();
  newQuestion();
}

function finish() {
  if (!L.practice) {
    const prev = S.lessons[L.lesson.id];
    S.lessons[L.lesson.id] = { done: true, best: Math.max(prev?.best || 0, L.correct) };
    recordDay(S);
  }
  save(S);
  const total = L.practice ? L.n : QUESTIONS, c = L.correct;
  const ratio = total ? c / total : 0;
  const msg = ratio === 1 ? 'Sans faute !' : ratio >= 0.8 ? 'Très bien.' : ratio >= 0.5 ? 'Pas mal. Continue pour ancrer les notes.' : 'Les notes ratées reviendront plus souvent. Réessaie !';
  const extra = L.practice ? `<span class="pill">Meilleure série <b>${L.bestCombo}</b></span><span class="pill">Record <b>${S.bestCombo || 0}</b></span>` : '';
  const again = L.practice ? '<button class="secondary" data-action="practice">Continuer à s\'entraîner</button>'
    : `<button class="secondary" data-action="start" data-id="${L.lesson.id}">Refaire la leçon</button>`;
  root.innerHTML = `<div class="result">
      <p class="eyebrow">${L.practice ? 'Entraînement terminé' : `Leçon terminée · ${L.lesson.title}`}</p>
      <p class="big">${c}<span>/${total}</span></p>
      <h1>${msg}</h1>
      <div class="stats"><span class="pill">+${L.xp} XP</span><span class="pill">Série <b>${currentStreak(S)}</b> j</span>${extra}</div>
      <div class="actions"><button class="primary" data-action="home">Retour au parcours</button>${again}</div>
    </div>`;
  L = null;
}

/* Événements */
root.addEventListener('click', e => {
  const input = e.target.closest('[data-input]');
  if (input && L && !L.answered) {
    const res = L.ex.input(L.q, input, root);
    if (res) conclude(res);
    return;
  }
  const t = e.target.closest('[data-action]');
  if (!t || t.disabled) return;
  const a = t.dataset.action;
  if (a === 'start') start(ALL.find(l => l.id === t.dataset.id));
  else if (a === 'practice') start(null);
  else if (a === 'next') next();
  else if (a === 'home') renderHome();
  else if (a === 'end') L && L.n > 0 ? finish() : renderHome();
  else if (a === 'reset') {
    if (t.dataset.armed) { S = blank(); save(S); renderHome(); return; }
    t.dataset.armed = '1';
    t.textContent = 'Confirmer : tout effacer';
    setTimeout(() => { if (t.isConnected) { delete t.dataset.armed; t.textContent = 'Remettre à zéro'; } }, 4000);
  }
});

document.addEventListener('keydown', e => {
  if (L && !L.answered && L.ex.onKey) L.ex.onKey(L.q, e, root);
});

renderHome();
