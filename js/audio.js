// Petit piano synthétisé (Web Audio). Les navigateurs n'autorisent le son qu'après un clic :
// on crée le contexte au premier appel, qui vient toujours d'un clic.
let ctx = null;

export function tone(midi) {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    out.connect(ctx.destination);
    // fondamentale + deux harmoniques pour un timbre un peu plus « piano »
    [[1, 'triangle', 1], [2, 'sine', 0.25], [3, 'sine', 0.08]].forEach(([mult, type, amp]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f * mult;
      g.gain.value = amp;
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 1.5);
    });
  } catch (e) { /* pas de son : l'exercice reste utilisable */ }
}
