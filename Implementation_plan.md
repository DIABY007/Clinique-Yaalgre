# Plan de Mise en Œuvre : Système de Gestion Clinique (SaaS PWA)

**Projet :** Clinique Yaalgre  
**Dernière mise à jour :** 13 Août 2026  
**Stack :** Next.js 14+ (App Router) · Supabase · Shadcn UI · Tailwind CSS · Serwist · TanStack Query v5 · Dexie.js  

---

## Ressources Validées

### Connexion Supabase
| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mkifewnqahxoqirnykaw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_fxTlDlAAx8OksqzwNIAuIA_tn1_YnoB` |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT fourni |
| Compte Auth générique | `acceuil@clinique.com` / `xDnNe551&&&` |

### Palette de Couleurs
```json
{
  "Brand": {
    "Primary_Forest":    "#0A4D3C",
    "Secondary_Sage":   "#6B8E78",
    "Accent_Terracotta":"#C96A35"
  },
  "Surfaces": {
    "App_Background":  "#F8FAF9",
    "Card_Surface":    "#FFFFFF",
    "Border_Divider":  "#E2E8E5"
  },
  "Typography": {
    "Text_Main":  "#1A2521",
    "Text_Muted": "#52665E"
  },
  "Semantic": {
    "Error_Danger":   "#D93838",
    "Warning_Alert":  "#F5A623",
    "Success_Valid":  "#2E8B57",
    "Info_Notice":    "#2B6CB0"
  }
}
```
**Règle 60-30-10 :** 60% Surfaces/neutres, 30% Text_Main, 10% Primary_Forest.

### Typographie
- **Police principale :** `system-ui` (native sans-serif)
- **Échelle :** 4 tailles max, 2 épaisseurs (400 Regular, 600 SemiBold)
- **Corps de texte :** minimum 16px, line-height 1.5

### Animation de Chargement
- **Format :** Lottie (DotLottie) — 3 triangles tournants à 0°/120°/240°
- **Couleur :** `#0A4D3C` (Primary_Forest)
- **Taille canvas :** 2000×2000, 60fps, ~3s (179 frames), boucle infinie
- **Fichier source :** `Banque de mémoire/Ecran de chargements/animations/...json`
- **Intégration :** Composant `<LottiePlayer>` React

### Logo
- **Fichier :** `Banque de mémoire/Logo.png`
- **Placement :** Barre de navigation + écran de connexion

### Diagramme UML (15 tables)
- **Fichier :** `Banque de mémoire/Diagramme UML.txt` (PlantUML)
- **Médical :** `Utilisateur`, `Patient`, `Consultation`, `DocumentImporte`, `TypeExamen`, `ExamenLaboratoire`
- **Financier :** `CatalogueActe`, `Facture`, `LigneFacture` (XOR Acte/Produit), `Paiement`, `Depense`, `BilanJournalier`
- **Stock :** `Produit`, `MouvementStock`, `RegleConsommation`

---

## Architecture — Double Verrouillage

```
NIVEAU 1 — Authentification Matérielle (Supabase Auth)
┌──────────────────────────────────────────────────────┐
│  Compte générique : acceuil@clinique.com              │
│  À l'initialisation, la PWA s'authentifie            │
│  silencieusement en arrière-plan (token JWT).        │
│  → Laissez-passer de la tablette vers le backend     │
└──────────────────────────────────────────────────────┘
                        │
NIVEAU 2 — Authentification Humaine (PIN Applicatif)
┌──────────────────────────────────────────────────────┐
│  Interface → Pavé numérique 4 chiffres               │
│  Frontend → Web Crypto / bcryptjs → hash(input)      │
│  Compare avec `code_pin_hash` de la table Utilisateur │
│  (synchronisée localement via Service Worker)         │
│  → id_utilisateur stocké dans l'état global (Context) │
│  → Traçabilité sur toutes les actions métier         │
│  → Fonctionne 100% hors-ligne (hash côté client)     │
└──────────────────────────────────────────────────────┘
```

---

## Directives Absolues

1. **Aucun code** avant lecture intégrale de ce plan.
2. **Étape par étape :** Impossible de commencer N+1 si le test de validation N n'est pas réussi.
3. **Design System :** Appliquer strictement les règles du `Master Template Universel`. Utiliser exclusivement les composants Shadcn UI.
4. **Feedback Utilisateur :** Toute action (création, modification, suppression, erreur, hors-ligne) doit déclencher un Toast (auto-dismiss 3-5s).
5. **Offline-First :** IndexedDB (Dexie.js) comme source de vérité locale. Sync queue avec exponential backoff et jitter. Soft deletes (tombstones) pour toutes les suppressions.
6. **Migrations :** Supabase CLI uniquement (SQL dans `supabase/migrations/`). Pas de scripts JS, pas d'éditeur manuel.

---

## Master Template — Règles Clés

### UI/UX
- **Typographie :** `system-ui`, 4 tailles max, 2 weights, jamais < 16px
- **Espacement :** Multiples de 4px (4, 8, 12, 16, 24, 32…)
- **Bords :** Arrondis, pas d'angles droits stricts
- **Ombre :** Adoucies, pas de noir pur (#000000)
- **Tableaux :** Texte à gauche, données numériques à droite
- **Dégradés :** Interdits — utiliser une couleur unie + nuance foncée

### Boutons
- **Principal :** Background `Primary_Forest`, texte blanc (rempli)
- **Secondaire :** Background transparent, texte `Primary_Forest` (outline)
- **Annulation/Suppression :** Style vide, jamais "Oui/Non" → verbes d'action
- **Distance :** Suffisante pour éviter les clics accidentels

### Mobile-First
- **Thumb Zone :** CTA et éléments interactifs majeurs en bas d'écran
- **Micro-interactions :** `scale-95` + haptic sur actions clés
- **Pull-to-Refresh :** Loader couleur Primary_Forest
- **Animations :** 200-300ms, ease-out (entrée), ease-in (sortie)

### Modales
- **Transition :** Zoom intérieur → extérieur
- **Fermeture :** Swipe Down exclusif + Grabber 32px centré + croix backup
- **Actions hautes :** Icônes circulaires minimalistes (secondaires uniquement)

### Formulaires
- Diviser en étapes si longs, titrer chaque étape
- Validation en temps réel (icône + texte)
- Marquer les champs "optionnels" ou "obligatoires" selon le ratio

### Empty States
- **Action principale :** *"Enregistrer un patient"*
- Illustration minimaliste + CTA contextuel
- Suggestions avant saisie ; filtres complexes APRÈS recherche

### Navigation
- Maximum 5 éléments dans la barre de navigation
- Dans un tunnel de conversion : retirer la navbar, simplifier

### Onboarding
- Progressif, max 3 écrans, skippable
- Personnalisé avec prénom utilisateur
- Compteurs de tâches pour activation

---

## Phase 1 : Initialisation et Configuration de Base

**Objectif :** Mettre en place l'environnement Next.js, les dépendances critiques et la connexion Supabase.

- **Étape 1.1 :** `npx create-next-app@latest` (App Router, TypeScript, Tailwind CSS, src/)
- **Étape 1.2 :** Installer les dépendances :
  - `@supabase/supabase-js`, `@supabase/ssr`
  - Shadcn UI (`npx shadcn@latest init`)
  - Serwist : `@serwist/next`, `@serwist/precaching`, `@serwist/strategies`
  - TanStack Query v5 : `@tanstack/react-query`, `@tanstack/react-query-devtools`
  - Dexie.js : `dexie`, `dexie-react-hooks`
  - `lottie-web` ou `@lottiefiles/dotlottie-react` (loading screen)
- **Étape 1.3 :** Fichiers `.env.local` avec les credentials Supabase
- **Étape 1.4 :** Helpers Supabase (`utils/supabase/server.ts`, `client.ts`, `middleware.ts`)
- **Étape 1.5 :** Installer la CLI Supabase (`npm create supabase` ou `brew install supabase/tap/supabase`)
- **Étape 1.6 :** `supabase init` + `supabase link --project-ref mkifewnqahxoqirnykaw`
- **Test de validation 1 :** Lancer `npm run dev`. Page blanche sans erreur console. Middleware intercepte les requêtes.

---

## Phase 2 : Architecture UI/UX et Design System

**Objectif :** Intégrer la palette, les assets graphiques et le Master Template.

- **Étape 2.1 :** Configurer Tailwind CSS :
  - Étendre les couleurs avec la palette JSON (Primary_Forest, Secondary_Sage, etc.)
  - Appliquer le système 60-30-10
  - Configurer `fontFamily: { sans: ['system-ui', 'sans-serif'] }`
- **Étape 2.2 :** Ajouter les composants Shadcn UI initiaux :
  ```bash
  npx shadcn@latest add button input form label toast card avatar badge separator skeleton dialog sheet
  ```
- **Étape 2.3 :** Créer le thème CSS global (composant providers, couleurs sémantiques, espacement 4px)
- **Étape 2.4 :** Intégrer le logo dans la barre de navigation
- **Étape 2.5 :** Créer le composant `LoadingScreen` basé sur le fichier Lottie (3 triangles)
- **Étape 2.6 :** Créer le composant `Toast` wrapper avec auto-dismiss 3-5s, variants succès/erreur/info/avertissement
- **Test de validation 2 :** Page `/design-system` avec :
  - Tous les boutons aux couleurs de la palette (Primary_Forest, Secondary_Sage, Accent_Terracotta, outline, ghost)
  - Logo affiché
  - Boutons déclenchant Toast de succès et Toast d'erreur
  - Loading screen visible sur une action asynchrone factice
  - Vérifier que le Master Template est respecté (espacements 4px, bords arrondis, ombres douces)

---

## Phase 3 : Infrastructure de Base de Données (Supabase CLI)

**Objectif :** Traduire le diagramme UML en migrations SQL professionnelles.

- **Étape 3.1 :** `supabase migration new init_schema`
- **Étape 3.2 :** Rédiger le SQL complet dans `supabase/migrations/[timestamp]_init_schema.sql` :
  - Tables médicales : `Utilisateur`, `Patient`, `Consultation`, `DocumentImporte`, `TypeExamen`, `ExamenLaboratoire`
  - Tables financières : `CatalogueActe`, `Facture`, `LigneFacture`, `Paiement`, `Depense`, `BilanJournalier`
  - Tables stock : `Produit`, `MouvementStock`, `RegleConsommation`
  - Contrainte XOR sur `LigneFacture` (CHECK pointant soit vers `id_acte`, soit vers `id_produit`, jamais les deux)
  - Clés étrangères avec CASCADE pour `Consultation → DocumentImporte` (composition)
  - Index sur les colonnes de recherche fréquentes
- **Étape 3.3 :** `supabase migration up`
- **Étape 3.4 :** Créer le compte Supabase Auth générique :
  - Dashboard Supabase → Authentication → Add User
  - Email : `acceuil@clinique.com`, Password : `xDnNe551&&&`
- **Test de validation 3 :** Via SQL Editor de Supabase :
  - Insérer une `LigneFacture` avec `id_acte` ET `id_produit` → rejeté violemment par la contrainte CHECK
  - Vérifier les index et clés étrangères

---

## Phase 4 : Authentification et Sécurité (Double Verrouillage)

**Objectif :** Implémenter le système à 2 niveaux.

- **Étape 4.1 (Niveau 1 — Matériel) :**
  - Compte générique `acceuil@clinique.com` déjà créé (Phase 3)
  - À l'initialisation de la PWA, connexion silencieuse avec `supabase.auth.signInWithPassword()`
  - Stockage du token JWT côté client
- **Étape 4.2 (Niveau 2 — PIN Applicatif) :**
  - Interface : Pavé numérique 4 chiffres (responsive, boutons larges)
  - Hashing : `bcryptjs` (ou Web Crypto) côté client pour hacher le PIN saisi
  - Comparaison avec `code_pin_hash` de la table `Utilisateur` (données locales Dexie.js)
  - État global (React Context) : stocker `id_utilisateur`, `nom`, `role`
  - Actions métier → `id_utilisateur` envoyé dans chaque requête (traçabilité)
- **Étape 4.3 :** Services/Actions protégées :
  - Vérifier `id_utilisateur` présent dans le Context avant toute action critique
  - Logout : vider le context PIN, pas de déconnexion Supabase
- **Test de validation 4 :**
  - PIN valide → Redirection tableau de bord + Toast succès
  - PIN invalide → Toast erreur (rouge `Error_Danger`) + pavé réinitialisé
  - Déconnecter le réseau → PIN toujours fonctionnel (données locales)
  - Vérifier que le token JWT Supabase est renouvelé silencieusement en ligne

---

## Phase 5 : PWA et Synchronisation Hors-Ligne (Le Cœur Technique)

**Objectif :** Assurer la continuité de service sans connexion internet.

- **Étape 5.1 :** Configurer Serwist (plugin Next.js) :
  - Wrapper dans `next.config.ts`
  - Fichier d'entrée `app/sw.ts` avec stratégies de cache
  - Manifest PWA (`app/manifest.ts`) : nom, icônes, `display: standalone`, `theme_color: #0A4D3C`
  - Pré-caching des assets statiques (`/_next/static/`) — Cache First
  - Pages HTML — Network First avec fallback offline
- **Étape 5.2 :** Configurer Dexie.js (base locale) :
  - `db/database.ts` : schéma avec métadonnées de sync (`_syncStatus`, `_lastModified`, `_localVersion`, `_deletedAt`, `_serverVersion`)
  - Toutes les tables métier synchronisables
  - Sync queue avec `exponential backoff + jitter`
  - Soft deletes (tombstones) pour toutes les suppressions
- **Étape 5.3 :** TanStack Query avec `onlineManager` :
  - `QueryClient` configuré avec `networkMode: 'offlineFirst'`
  - Mutations avec `onMutate` → écriture locale immédiate (optimistic update)
  - `onError` → rollback + Toast erreur
  - `onSettled` → invalidation des queries pour resync
  - Détection de connectivité (health check endpoint, pas seulement `navigator.onLine`)
- **Étape 5.4 :** Indicateur de sync dans l'UI :
  - Badge / icône montrant l'état de synchronisation (synced / pending / conflicted)
  - Nombre d'opérations en attente
- **Test de validation 5 :**
  - Navigateur en mode "Hors-ligne" (DevTools)
  - Créer un patient factice → Toast succès (optimiste), patient apparaît dans la liste
  - Revenir en ligne → Requête envoyée au serveur, BDD réelle mise à jour
  - Supprimer un patient en hors-ligne → soft delete, pas de perte
  - Vérifier la sync queue dans Dexie.js

---

## Phase 6 : Modules Métiers & Optimisation WebP

**Objectif :** Implémenter les interfaces de gestion médicale avec optimisation des médias.

- **Étape 6.1 :** Module Patient (CRUD) :
  - Liste avec recherche (nom, téléphone)
  - Fiche patient avec historique des consultations
  - Désactivation logique via `est_archive` (pas de suppression réelle)
  - Pagination + infinite scroll
- **Étape 6.2 :** Module Consultation :
  - Création et modification de consultation liée à un patient
  - Upload de documents (`DocumentImporte`) avec conversion WebP côté client
  - Prescription d'examens de laboratoire (`TypeExamen` → `ExamenLaboratoire`)
- **Étape 6.3 :** Conversion WebP obligatoire :
  - Intercepter l'upload côté client avec `<canvas>` ou `sharp` WASM
  - Convertir `.jpg` / `.png` → `.webp` avant envoi vers Supabase Storage
  - Bucket Supabase dédié avec politiques RLS
- **Étape 6.4 :** Module Résultats d'examens :
  - Mise à jour du statut (`StatutExamen` : PRELEVE → ENVOYE → RESULTAT_DISPONIBLE)
  - Saisie des résultats
- **Test de validation 6 :**
  - Uploader une image `.jpg` lourde → vérifier dans le bucket Supabase que le fichier est en `.webp` allégé
  - Supprimer la consultation → document WebP supprimé en cascade
  - Créer 50 patients, vérifier la pagination

---

## Phase 7 : Comptabilité Stricte et Automatisation des Stocks

**Objectif :** Implémenter les verrous financiers et les règles de déduction.

- **Étape 7.1 :** Module Facturation :
  - Création de facture avec lignes (acte OU produit — contrainte XOR)
  - Calcul automatique du `reste_a_payer` (total - somme des paiements)
  - Ajout de paiements avec `id_utilisateur` pour traçabilité
- **Étape 7.2 :** Clôture du `BilanJournalier` :
  - Génération du bilan : rassemble toutes les transactions du jour
  - Bascule `est_verrouille = True` pour tous les `Paiement` et `Depense` rattachés
  - Calcul : `total_recettes`, `total_depenses`, `solde_net`
- **Étape 7.3 :** Verrou comptable (RLS + UI) :
  - Niveau base : RLS Supabase interdisant UPDATE/DELETE où `est_verrouille = True`
  - Niveau UI : Désactiver les boutons d'édition/suppression, griser les lignes verrouillées
  - Niveau API : Vérification côté backend avant chaque mutation
- **Étape 7.4 :** Exécution des `RegleConsommation` :
  - Déclencheur silencieux lors de la validation d'un `ExamenLaboratoire`
  - Déduire `quantite_deduite` du stock du `Produit` lié
  - Créer un `MouvementStock` de type `SORTIE` avec la consultation comme justification
- **Étape 7.5 :** Module Stock :
  - Inventaire des produits avec `type_gestion` (STRICT / MASSE)
  - Mouvements de stock (ENTREE / SORTIE / AJUSTEMENT_NEGATIF)
  - Alerte si stock bas
- **Test de validation 7 (Critique) :**
  - Générer un bilan journalier → `est_verrouille = True`
  - Tenter de modifier un paiement verrouillé depuis l'UI → erreur (Toast rouge)
  - Tenter de modifier un paiement verrouillé via API externe → code 403/500
  - Valider un examen "TDR Paludisme" → vérifier que le stock de produit TDR a diminué de 1
  - Vérifier que les montants du bilan (recettes, dépenses, solde) sont mathématiquement exacts

---

## Phase 8 : Onboarding et Polish Final

**Objectif :** Finaliser l'expérience utilisateur et les finitions.

- **Étape 8.1 :** Écrans d'onboarding (max 3, skippable) :
  1. *"Bienvenue à la Clinique Yaalgre"* — Présentation, logo, bouton "Commencer"
  2. *"Saisissez votre code"* — Explication du pavé numérique, sécurité
  3. *"Prêt à travailler"* — Résumé des actions rapides (Enregistrer un patient, Nouvelle consultation)
- **Étape 8.2 :** Personnalisation (prénom de l'utilisateur dans le header)
- **Étape 8.3 :** Compteurs de tâches (ex: "3 consultations en attente de résultats")
- **Étape 8.4 :** Empty states avec illustration + "Enregistrer un patient" en CTA
- **Étape 8.5 :** Tests responsive (mobile 375px → desktop 1440px)
- **Étape 8.6 :** Test PWA (Lighthouse, installabilité, offline)
- **Test de validation 8 :**
  - Navigation complète : onboarding → connexion PIN → dashboard → enregistrer patient → consultation → facture → bilan
  - Test hors-ligne complet : toute l'application fonctionne sans réseau
  - Lighthouse PWA : score ≥ 90 sur "Installability" et "Reliability"
  - Vérification Master Template : espacements 4px, thumb zone, modales swipe-down

---

## Glossaire des Fichiers Clés

| Chemin | Description |
|---|---|
| `Implementation_plan.md` | Ce plan de mise en œuvre |
| `Banque de mémoire/Palette de couleur.json` | Palette de couleurs officielle |
| `Banque de mémoire/Diagramme UML.txt` | Diagramme UML (PlantUML) |
| `Banque de mémoire/Logo.png` | Logo de la clinique |
| `Banque de mémoire/Ecran de chargements/` | Animation Lottie (3 triangles) |
| `.claude/skills/Master Template Universel/skills.md` | Règles UI/UX strictes |
| `.claude/skills/web-pwa-offline-first/` | Skill Offline-First (Dexie.js, sync) |
| `.claude/skills/tanstack-query/` | Skill TanStack Query v5 |
| `.claude/skills/pwa-service-worker/` | Skill PWA / Serwist |
| `.claude/skills/ui-styling/` | Skill Shadcn UI + Tailwind |
| `.claude/skills/design-system/` | Skill architecture tokens |
| `supabase/migrations/` | Migrations SQL (Supabase CLI) |
| `utils/supabase/server.ts` | Helper Supabase serveur |
| `utils/supabase/client.ts` | Helper Supabase client |
| `utils/supabase/middleware.ts` | Middleware sessions |
| `db/database.ts` | Schéma Dexie.js (IndexedDB) |
| `next.config.ts` | Config Next.js + Serwist |
| `app/sw.ts` | Service Worker (Serwist) |
| `app/manifest.ts` | Manifest PWA |