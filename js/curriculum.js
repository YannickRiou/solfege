import { range } from './notation.js';

/*
 * Programme. C'est le fichier à modifier pour ajouter, retirer ou réordonner des leçons.
 * Les leçons se débloquent dans l'ordre de ce fichier ; l'entraînement libre pioche dans les leçons débloquées.
 *
 *   id     : identifiant unique et stable (la progression enregistrée s'y réfère : ne pas renommer)
 *   title  : nom affiché
 *   types  : types d'exercices tirés au hasard dans la leçon (voir js/exercises.js)
 *   items  : notes travaillées
 *            — degrés pour les exercices 'step' : 28 = do3 (do central) … 34 = si3 … 40 = la4
 *            — lettres pour les exercices 'letter' (key, keyname) : 0 = do … 6 = si
 *            Tous les types d'une leçon doivent utiliser le même genre d'items (vérifié par npm test).
 *   hint   : facultatif, astuce affichée sous la consigne
 */
export const UNITS = [
  {
    title: 'La portée',
    sub: 'Lire les notes en clé de sol',
    lessons: [
      { id: 's1', title: 'Do, ré, mi', types: ['name', 'truefalse'], items: [28, 29, 30],
        hint: 'Le do se pose sur une petite ligne ajoutée sous la portée.' },
      { id: 's2', title: 'Fa, sol, la, si', types: ['name', 'truefalse', 'findstaff'], items: [31, 32, 33, 34],
        hint: 'La clé de sol s\'enroule autour de la 2e ligne : c\'est le sol.' },
      { id: 's3', title: 'Du do au sol aigus', types: ['name', 'findstaff', 'place'], items: [35, 36, 37, 38, 39],
        hint: 'Le do aigu est dans le 3e interligne.' },
      { id: 's4', title: 'Toute la portée', types: ['name', 'truefalse', 'findstaff', 'place'], items: range(28, 40) },
    ],
  },
  {
    title: 'Le clavier',
    sub: 'Trouver les notes sur les touches blanches',
    lessons: [
      { id: 'k1', title: 'Do, ré, mi', types: ['key', 'keyname'], items: [0, 1, 2],
        hint: 'Do, ré, mi entourent le groupe de 2 touches noires.' },
      { id: 'k2', title: 'Fa, sol, la, si', types: ['key', 'keyname'], items: [3, 4, 5, 6],
        hint: 'Fa, sol, la, si entourent le groupe de 3 touches noires.' },
      { id: 'k3', title: 'Toutes les touches blanches', types: ['key', 'keyname'], items: range(0, 6) },
    ],
  },
  {
    title: 'De la portée au clavier',
    sub: 'Lire une note et jouer la bonne touche',
    lessons: [
      { id: 'p1', title: 'Autour du do central', types: ['play', 'name'], items: range(28, 32),
        hint: 'Le do sous la portée est le do central (do3), marqué d\'un point sur le clavier.' },
      { id: 'p2', title: 'Toute la portée', types: ['play', 'findstaff'], items: range(28, 40) },
      { id: 'p3', title: 'Petites mélodies', types: ['melody', 'play'], items: range(28, 35) },
    ],
  },
];

export const ALL = UNITS.flatMap(u => u.lessons);
