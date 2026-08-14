# 🏥 Clinique Yaalgre

Système de Gestion de Clinique — PWA Offline-First

**Stack :** Next.js 16 · Supabase · Shadcn UI · Tailwind CSS · Serwist · TanStack Query · Dexie.js

## 🚀 Démarrage

```bash
npm install
npm run dev -- --webpack
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 🔐 Connexion

| Rôle | Identifiant | Code |
|---|---|---|
| Administrateur | `/admin` | `1955` |
| Médecin | Dr Diallo | `1234` |

## 🏗️ Build Production

```bash
npm run build -- --webpack
npm start
```

## 🌐 Déploiement Vercel

1. Pusher sur GitHub
2. Importer le projet sur [Vercel](https://vercel.com)
3. Framework : **Next.js**
4. Build command : `next build --webpack`
5. Ajouter les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 📱 PWA

Installable sur mobile. Fonctionne hors-ligne avec synchronisation automatique au retour du réseau.

## 🗄️ Base de données

15 tables (Supabase PostgreSQL) avec RLS, triggers, contraintes XOR.
Migrations dans `supabase/migrations/`.