# Handbook développeur

Ce document permet de faire évoluer Note à Note sans aide extérieure. Il suppose de savoir éditer du HTML, du CSS et un peu de JavaScript.

## 1. Principes

- **Pas de build, pas de dépendance.** Le navigateur charge directement `index.html`, `css/style.css` et les modules de `js/`. Ce que vous voyez dans le dépôt est exactement ce qui est publié.
- **JavaScript moderne** (modules ES, `import`/`export`), sans framework. Chaque écran est une chaîne HTML injectée dans `<main id="app">`.
- **Aucune donnée ne quitte le navigateur.** Pas de serveur, pas de compte, pas de mesure d'audience.
- **Le programme est une donnée.** Ajouter une leçon, c'est modifier un tableau dans `js/curriculum.js`, sans toucher au reste.

## 2. Arborescence

```
index.html            page unique : charge la police, le CSS et js/app.js
css/style.css         toute l'apparence ; variables de couleur en tête de fichier
js/app.js             écrans (accueil, séance, résultat), déroulé d'une séance, événements
js/curriculum.js      le programme : unités et leçons            ← le plus souvent modifié
js/exercises.js       les 8 types d'exercices                    ← pour ajouter un type
js/notation.js        modèle des notes, dessin de la portée et du clavier
js/scheduler.js       répétition espacée et tirage aléatoire
js/storage.js         sauvegarde de la progression (localStorage)
js/audio.js           son de piano synthétisé
tests/solfege.test.js tests automatiques (node --test)
docs/HANDBOOK.md      ce document
```

Dépendances entre modules : `app` → `curriculum`, `exercises`, `scheduler`, `storage` ; `exercises` → `notation`, `audio`. Seul `app.js` touche au DOM au chargement ; les autres modules sont importables dans Node, ce qui permet de les tester.

## 3. Travailler en local

```bash
python -m http.server 8000      # ou : npm start
```

Ouvrir http://localhost:8000. Après une modification, recharger la page (Ctrl+Maj+R pour ignorer le cache).

Pour repartir d'une progression vierge : bouton **Remettre à zéro** en bas de l'accueil, ou dans la console du navigateur `localStorage.removeItem('solfege.progress')`.

## 4. Le modèle des notes

Une note est un **degré** : `octave × 7 + lettre`, avec lettre 0 = do, 1 = ré … 6 = si.

| Degré | Note | Position en clé de sol |
|---|---|---|
| 28 | do3 (do central) | 1re ligne ajoutée sous la portée |
| 29 | ré3 | sous la ligne du bas |
| 30 | mi3 | ligne du bas |
| 32 | sol3 | 2e ligne (celle de la clé) |
| 34 | si3 | ligne du milieu |
| 38 | fa4 | ligne du haut |
| 40 | la4 | 1re ligne ajoutée au-dessus |

Fonctions utiles dans `js/notation.js` : `noteName(28)` → `"do"`, `frName(28)` → `"do3"`, `midiOf(28)` → `60`, `letter(35)` → `0`.

Les bornes sont des constantes : `STAFF_LOW`/`STAFF_HIGH` (notes affichables sur la portée) et `KEY_LOW`/`KEY_HIGH` (clavier de 14 touches blanches, do3 → si4).

Les exercices de clavier « nom → touche » (`key`, `keyname`) travaillent sur des **lettres** (0 à 6) : l'octave n'a pas d'importance. Tous les autres travaillent sur des **degrés**.

## 5. Recettes

### Ajouter ou modifier une leçon

Dans `js/curriculum.js`, ajouter un objet dans le tableau `lessons` d'une unité :

```js
{ id: 's5', title: 'Les notes sur les lignes', types: ['name', 'place'], items: [30, 32, 34, 36, 38],
  hint: 'Mi, sol, si, ré, fa : de bas en haut.' },
```

Règles (vérifiées par `npm test`) :
- `id` unique. **Ne jamais renommer l'id d'une leçon publiée** : la progression des utilisateurs y est rattachée.
- `types` : des clés de `EXERCISES` (voir le tableau du README). Tous les types d'une leçon doivent utiliser le même genre d'items : degrés ou lettres.
- `items` : au moins 2 notes, dans les bornes (28 à 40 pour les degrés, 0 à 6 pour les lettres).
- `hint` : facultatif.

L'ordre du fichier est l'ordre du parcours : une leçon se débloque quand la précédente est terminée. Insérer une leçon au milieu la rend verrouillée pour ceux qui ont déjà passé ce point, jusqu'à ce qu'ils la terminent.

### Ajouter une unité

Ajouter un objet `{ title, sub, lessons: [...] }` dans `UNITS`. Le numéro affiché est calculé automatiquement.

### Changer la durée d'une leçon ou les points

En tête de `js/app.js` : `QUESTIONS` (questions par leçon), `XP_PER_ANSWER`, `PRACTICE_DAY` (réponses d'entraînement libre qui comptent pour la série de jours).

### Régler la répétition espacée

Dans `js/scheduler.js` : chaque couple (compétence, note) a un poids, 1 au départ. Une erreur fait `poids × 2 + 1` (plafond `MAX`), une réussite `poids × 0,7` (plancher `MIN`). Le tirage est proportionnel au poids. Pour que les erreurs reviennent plus vite, augmenter `MAX` ; pour plus de variété, réduire l'écart entre `MIN` et `MAX`.

### Comprendre l'entraînement libre

Il tourne sans fin : à chaque question, `app.js` tire une leçon au hasard parmi les leçons débloquées, puis un type d'exercice de cette leçon, puis une note selon les poids. Il s'enrichit donc automatiquement à mesure que le parcours avance. Pour l'élargir à tout le programme, remplacer `unlockedLessons()` par `ALL` dans `newQuestion()`.

### Ajouter un type d'exercice

1. Dans `js/exercises.js`, ajouter une entrée à `EXERCISES` :

```js
octave: {
  title: 'Grave ou aigu ?',          // affiché sous le titre des leçons
  skill: 'read',                     // 'read', 'key' ou 'play' : sert à la répétition espacée
  items: 'step',                     // 'step' (degrés) ou 'letter' (0 à 6)
  make: ({ lesson, pick }) => ({ item: pick() }),
  render: q => ({
    prompt: 'Ce do est-il grave ou aigu ?',
    body: paper(staffSVG({ notes: [{ step: q.item }] }))
      + `<div class="choices two">
           <button class="choice" data-input="octave" data-v="0">Grave</button>
           <button class="choice" data-input="octave" data-v="1">Aigu</button>
         </div>`,
  }),
  input(q, el, root) {
    if (el.dataset.input !== 'octave') return null;   // clic ignoré
    const ok = (+el.dataset.v === 1) === (q.item >= 35);
    add(el, ok ? 'hit' : 'miss');
    return { ok, msg: ok ? 'Exact.' : 'Regarde où se trouve la note par rapport à la clé.' };
  },
},
```

2. L'utiliser dans une leçon (`types: ['name', 'octave']`).
3. Lancer `npm test` : le test « chaque type produit une question affichable » essaie votre exercice sur toutes les leçons qui l'utilisent.

Le contrat, résumé en tête de `exercises.js` :
- `make` reçoit `pick(exclude?)`, qui tire une note de la leçon selon les poids. Ajoutez dans la question tout ce dont l'affichage a besoin (options, séquence…).
- `render` renvoie la consigne et le HTML. **Tout élément cliquable porte `data-input`** : l'app transmet le clic à `input`.
- `input` renvoie `null` tant que l'exercice continue (exercices en plusieurs gestes comme `place` ou `melody`), sinon `{ ok, msg }`. `msg` s'affiche après « Bravo ! » ou « Raté. ». Pour noter plusieurs notes d'un coup, ajouter `results: [{ item, ok }, …]`.
- `onKey` (facultatif) reçoit les touches du clavier d'ordinateur.

Outils déjà disponibles : `staffSVG({ notes, zones, clef, width })`, `keyboardHTML({ mark, target, interactive })`, `nameChoices()`, `paper(svg)`, `add(el, 'hit' | 'miss')`, `tone(midi)`.

### Changer l'apparence

Les couleurs, la police et l'arrondi sont des variables en tête de `css/style.css`. Le bloc `@media (prefers-color-scheme: dark)` redéfinit les mêmes variables pour le thème sombre : **toute nouvelle couleur doit être déclarée dans les deux blocs**.

Les variables `--paper-*` et `--key-*` servent à la portée et au clavier, qui restent clairs dans les deux thèmes, comme une partition et un vrai piano.

Polices : Atkinson Hyperlegible (texte, conçue pour la lisibilité) et Noto Music (clé de sol), chargées depuis Google Fonts dans `index.html`.

### Agrandir le clavier

Changer `KEY_LOW` / `KEY_HIGH` dans `js/notation.js` (la largeur des touches s'adapte). Sur téléphone, au-delà de 14 touches blanches, elles deviennent difficiles à toucher.

### Faire évoluer les données enregistrées

La progression est un objet JSON sous la clé `solfege.progress` :

```js
{ v: 1, xp, streak, lastDay: 'AAAA-MM-JJ', bestCombo,
  lessons: { s1: { done: true, best: 9 } },
  items: { 'read:30': { w: 2.4 } } }      // poids de répétition espacée
```

- **Ajouter un champ** : l'ajouter dans `blank()` (`js/storage.js`). Les anciennes sauvegardes le reçoivent automatiquement avec sa valeur par défaut.
- **Changer la forme d'un champ existant** : incrémenter `SCHEMA` et écrire, dans `load()`, la conversion de l'ancienne version. Sans cette conversion, les utilisateurs perdent leur progression, car une sauvegarde d'une autre version est ignorée.

## 6. Tests

```bash
npm test
```

Couvert automatiquement : conversions de notes, cohérence du programme, génération et affichage de chaque exercice, répétition espacée, sauvegarde et série de jours.

Pas couvert, donc à vérifier à la main avant de publier un changement visible :
- [ ] Sur téléphone (ou outils de développement en largeur 375 px) : clavier et 7 boutons de notes tiennent sans défilement horizontal.
- [ ] En thème sombre : textes lisibles, portée et clavier restent clairs.
- [ ] Chaque type d'exercice touché : bonne réponse, mauvaise réponse, retour affiché, bouton Continuer.
- [ ] Le son se déclenche au premier clic (Safari et iOS compris).
- [ ] Après rechargement, XP, série et leçons terminées sont conservées.

## 7. Déploiement

GitHub Pages est configuré sur la branche `main`, dossier racine (Settings → Pages). Chaque push sur `main` republie le site. Le suivi se trouve dans l'onglet **Actions** (« pages build and deployment »).

Le fichier `.nojekyll` désactive le traitement Jekyll de GitHub : les fichiers sont servis tels quels.

## 8. Pièges connus

- **Page blanche en ouvrant le fichier directement** : les modules exigent un serveur (voir §3).
- **Modification invisible** : cache du navigateur ; Ctrl+Maj+R, ou attendre la fin du déploiement.
- **Pas de son** : les navigateurs bloquent l'audio avant un premier clic ; sur iPhone, vérifier aussi le bouton silencieux.
- **Progression perdue** : navigation privée, ou données du site effacées. La progression est propre à chaque navigateur et à chaque appareil.
- **Une erreur dans `curriculum.js` casse tout le site** : lancer `npm test` avant de pousser.

## 9. Pistes d'évolution

- Clé de fa (une unité de plus ; il faut un second dessin de clé et un décalage des positions dans `staffSVG`).
- Choix « do ré mi » / « C D E ».
- Clavier MIDI (Web MIDI API, Chrome et Edge) ou micro (détection de hauteur).
- Altérations (dièses, bémols) et touches noires.
- Fonctionnement hors ligne (service worker).
