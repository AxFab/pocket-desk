# pocket·desk — état du produit

## Présentation
Explorateur de bases **pocket-db** (fichiers `.pdb`) construit avec **Electron + Vue 3 + Pinia**, fidèle au design *high-fidelity* du dossier `design_handoff_pocket_desk/`.

---

## Stack technique
| Couche | Technologie |
|--------|-------------|
| Shell desktop | Electron 32 |
| Build tool | electron-vite 2 |
| UI | Vue 3 (Composition API + `<script setup>`) |
| État global | Pinia |
| Styles | CSS custom properties (tokens du design) |
| Polices | Manrope + JetBrains Mono (Google Fonts en dev, à auto-héberger en prod) |

---

## Architecture

```
pocket-desk/
├── electron/
│   ├── main/
│   │   ├── index.js            # Processus principal Electron, IPC handlers
│   │   └── pocket-db-bridge.js # Wrapper pocket-db (package requis, pas de stub)
│   └── preload/
│       └── index.js            # Bridge IPC → window.pocketDesk
├── src/
│   ├── main.js                 # Point d'entrée Vue
│   ├── App.vue                 # Composition racine, thème, modales, toast
│   ├── store/app.js            # Store Pinia (état global + actions)
│   ├── assets/
│   │   ├── styles.css          # Tous les tokens CSS du design
│   │   ├── logo_light.png
│   │   └── logo_dark.png
│   └── components/
│       ├── AppIcons.vue        # Jeu d'icônes SVG inline (trait fin 1.6px)
│       ├── JsonView.vue        # Visionneuse JSON colorée et repliable
│       ├── TitleBar.vue        # Barre de titre (mac/windows, thème)
│       ├── StatusBar.vue       # Barre d'état
│       ├── TabStrip.vue        # Onglets colorés, drag-and-drop natif HTML5
│       ├── PrefsPanel.vue      # Panneau de préférences utilisateur
│       ├── sidebar/
│       │   ├── Sidebar.vue     # Menu latéral (arbre bases → collections)
│       │   └── DbMenu.vue      # Menu contextuel « … » d'une base
│       ├── views/
│       │   ├── EmptyState.vue  # Logo + astuce du jour
│       │   ├── DbView.vue      # Vue base (table des collections)
│       │   └── CollectionView.vue # Vue collection (requête + documents + index)
│       └── modals/
│           ├── ModalBase.vue
│           ├── NewConnectionModal.vue
│           ├── ConfirmModal.vue
│           ├── PromptModal.vue
│           ├── CreateIndexModal.vue
│           └── EditDocModal.vue
└── electron.vite.config.js
```

---

## Fonctionnalités implémentées

### Menu latéral
- [x] Bouton « Ouvrir une base » (dashed, hover accent)
- [x] Liste des bases avec couleur, badge collections, bouton « … »
- [x] Déplier / replier les collections (chevron)
- [x] Clic sur base → ouvre onglet DbView
- [x] Clic sur collection → ouvre onglet CollectionView
- [x] Menu contextuel base : Ajouter, Renommer, Dupliquer, Compacter, Fermer onglets, Déconnecter, Fermer
- [x] Bouton supprimer sur chaque collection (avec confirmation)
- [x] **Déconnecter / reconnecter une base** : ferme la connexion pocket-db (libère le verrou `.lock`) et tous les onglets de la base, mais garde l'entrée dans le menu latéral — collections vidées, expand/collapse désactivé (badge « déconnectée »). « Reconnecter » (bouton dédié dans la ligne, entrée de menu, ou bannière dans DbView) rouvre le même fichier via son chemin déjà connu, sans repasser par le sélecteur de fichier

### Barre d'onglets
- [x] Onglets colorés par base (pastille + bordure haute)
- [x] Sélection, fermeture (bascule vers voisin)
- [x] Réorganisation drag-and-drop (HTML5 natif)
- [x] État vide → EmptyState visible

### Vue vide (EmptyState)
- [x] Logo tile (clair/sombre selon thème)
- [x] CTA « Ouvrir une base »
- [x] Astuce du jour avec bouton shuffle

### Vue base (DbView)
- [x] En-tête : nom, chemin, stats (collections, documents, taille, morts)
- [x] Barre d'outils : Ajouter, Renommer, Dupliquer, Compacter, Fermer onglets, Déconnecter
- [x] Table des collections (cliquable → ouvre onglet)
- [x] Suppression de collection avec confirmation
- [x] Bannière de reconnexion à la place de la table quand la base est déconnectée

### Vue collection (CollectionView)
- [x] En-tête : base/collection, stats, chips d'index secondaires
- [x] Barre d'outils : Ajouter document, Créer index, Rafraîchir
- [x] Onglets internes Documents / Index
- [x] Barre de requête (JSON, Entrée = exécuter, bouton Vider)
- [x] Requêtes exécutées par le moteur pocket-db via IPC ($eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $exists, $or, $and…)
- [x] Barre de résultats (count + ms)
- [x] Cartes de documents repliables avec JsonView colorée
- [x] Boutons Éditer / Supprimer sur chaque document
- [x] **Vue Index** : liste des index avec type, suppression (sauf primary)

### Modales
- [x] **Nouvelle connexion** : sélecteur de fichier (IPC), nom auto-déduit, palette de 8 couleurs
- [x] **Édition de document** : mode Formulaire (champs typés, coercion, _id verrouillé) + mode JSON brut
- [x] **Confirmation** (suppression document/collection/fermeture base)
- [x] **Prompt** (renommer, ajouter collection)
- [x] **Créer un index** (champ + type string/number)
- [x] Fermeture Échap + clic extérieur sur toutes les modales

### Thème & préférences
- [x] Cycle clair / sombre / système (suit `prefers-color-scheme`)
- [x] Densité : compact / regular / comfy
- [x] Couleur d'accent : 4 options
- [x] Préférences **persistées dans localStorage** (survie redémarrage)
- [x] Panneau de préférences accessible depuis la barre de titre

### IPC pocket-db
- [x] Dialogue système `dialog.showOpenDialog` filtré `.pdb`
- [x] `openDb`, `closeDb`, `compact` (+ `duplicateFile` pour « Dupliquer » = copie réelle du fichier)
- [x] `createCollection`, `dropCollection`
- [x] `insertOne`, `replaceOne`, `deleteOne`
- [x] `createIndex`, `dropIndex`
- [x] `listCollections` via `db.getCollections()` + `lockStatus` (lecture du fichier `.lock`)
- [x] **IPC = source de vérité** : re-fetch de la collection après chaque mutation, erreurs remontées en toast
- [x] `@axfab/pocket-db` est **requis** : le stub in-memory a été supprimé ; sans le package, l'ouverture échoue avec un message explicite

### Toast & feedback
- [x] Toast bas-centre auto-disparaissant (2.6s) sur toutes les actions

---

## Lacunes résolues (juin 2026, pocket-db 0.1.2)

- **Liste des collections** : utilise `db.getCollections()` (l'API s'appelle ainsi, pas `listCollections()`), avec stats par collection (`countDocuments()`, `getIndexes()`).
- **Branchement IPC des données** : la boucle est bouclée. Chaque mutation (insert/replace/delete/index/compact) re-fetch la collection via IPC ; les requêtes de la barre de recherche sont exécutées par le moteur pocket-db dans le processus principal. Les erreurs IPC sont affichées en toast.
- **Stub in-memory supprimé** : l'outil exige une vraie base pocket-db.
- **Barre de titre Windows** : min/max/close câblés via IPC (`window:minimize|maximize|close`).
- **Verrou `.lock`** : la barre de statut lit l'état réel du fichier `<path>.lock` (PID, processus vivant, propriété) → « verrou OK · 1 process », « verrou tenu par PID n », « verrou orphelin »…
- **Polices hors-ligne** : `@fontsource/manrope` + `@fontsource/jetbrains-mono` importées dans `src/main.js`, Google Fonts retiré de `index.html`.

---

## Lacunes connues / mis de côté

### Sauvegarde de requêtes (Bookmarks)
Non implémenté. Prévu : stocker les requêtes nommées dans localStorage/electron-store et les proposer via une UI dédiée.

### Outil de performance
Non implémenté. Idée initiale : formulaire de benchmark (N requêtes × M documents) pour tester la vitesse des index.

### Gestion des index avancée
- Pas de "reconstruire un index"
- Pas de stats individuelles par index (taille, sélectivité)
→ Requiert des API supplémentaires dans pocket-db.

### Compteur d'enregistrements morts approximatif
pocket-db n'expose pas le nombre de records morts par collection. Le compteur « morts » est estimé côté renderer (incrémenté à chaque update/delete, remis à zéro au compactage).

### Tests
Aucun test unitaire ou e2e n'est écrit pour l'instant.

---

## Pour démarrer

```bash
# Installer les dépendances
npm install

# Mode développement (Electron + Vite HMR)
npm run dev

# Build de production
npm run build
```

### Dépendance pocket-db (requise)
```bash
npm install @axfab/pocket-db
```
Le package est **obligatoire** : le stub in-memory a été supprimé. Sans lui, l'ouverture d'une base affiche une erreur.

---

## Configuration utilisateur
Les préférences suivantes sont persistées dans `localStorage` sous la clé `pocket-desk-prefs` :

| Clé | Valeurs | Défaut |
|-----|---------|--------|
| `themeMode` | `light` \| `dark` \| `system` | `system` |
| `density` | `compact` \| `regular` \| `comfy` | `regular` |
| `accent` | hex color | `#3f9a4f` |

Accessible via le bouton de thème dans la barre de titre (cycle Clair/Sombre/Système) et le panneau de préférences.
