# Note à Note

Apprendre à lire les notes sur la portée (clé de sol), puis à les trouver sur un clavier de piano, en leçons de quelques minutes.

**En ligne : https://yannickriou.github.io/solfege/**

- Un parcours de 10 leçons en 3 unités : la portée, le clavier, puis de la portée au clavier.
- Un **entraînement libre sans fin** : des questions tirées au hasard dans les leçons débloquées.
- 8 types d'exercices, mélangés au hasard dans chaque leçon.
- Les notes ratées reviennent plus souvent (répétition espacée).
- XP, série de jours, record de bonnes réponses d'affilée.
- Aucun compte : la progression reste dans le navigateur (`localStorage`).
- Site 100 % statique, sans dépendance ni étape de build.

## Les exercices

| Type | Consigne | Compétence |
|---|---|---|
| `name` | Une note sur la portée : choisir son nom | lire |
| `truefalse` | « Cette note est-elle un sol ? » : oui ou non | lire |
| `findstaff` | Choisir, parmi 3 portées, celle qui montre la note demandée | lire |
| `place` | Placer la note demandée sur la portée | lire |
| `key` | Un nom de note : toucher la bonne touche | clavier |
| `keyname` | Une touche surlignée : choisir son nom | clavier |
| `play` | Une note sur la portée : jouer la touche exacte | lire et jouer |
| `melody` | 4 notes sur la portée : les jouer dans l'ordre | lire et jouer |

Les octaves suivent la notation française : le do central est le **do3** (C4 en notation anglo-saxonne).

## Lancer en local

Les modules JavaScript ne se chargent pas en ouvrant `index.html` par double-clic (`file://`). Il faut un petit serveur :

```bash
python -m http.server 8000
```

ou, avec Node.js :

```bash
npm start
```

Puis ouvrir http://localhost:8000.

## Tests

```bash
npm test
```

Node.js 20 ou plus, aucune installation nécessaire. Les tests vérifient notamment que le programme (`js/curriculum.js`) est cohérent : lancez-les après chaque modification de leçon.

## Déploiement

GitHub Pages publie la branche `main` (dossier racine). Un `git push` sur `main` met le site à jour en une à deux minutes.

## Modifier le projet

Tout est expliqué dans le [handbook développeur](docs/HANDBOOK.md) : architecture, ajout d'une leçon ou d'un type d'exercice, style, stockage, tests et déploiement.
