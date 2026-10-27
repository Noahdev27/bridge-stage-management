# Guide du stagiaire — Projet Bridge

Bienvenue 👋 Ce guide explique **comment le projet est organisé** et **comment tu dois
travailler** dessus. Lis-le en entier avant d'écrire ta première ligne de code.

- **Quoi construire ?** → le [document MVP](./MVP-Bridge.pdf) (périmètre et spécifications).
- **Comment démarrer le projet ?** → le [`README.md`](../README.md) (commandes) + la section 0 ci-dessous.
- **Comment travailler ?** → ce guide.

---

## 0. Mettre en place ton environnement

Avant de coder, il te faut : le projet récupéré, une base **PostgreSQL**, un projet
**Supabase** (qui fournit Postgres *et* le stockage), et tes variables d'environnement.

### a) Récupérer le projet
```bash
git clone https://github.com/BridgeTech-Solutions/bridge-stage-management.git
cd bridge-stage-management
npm install
```

### b) Base de données + stockage (Supabase, recommandé)

> ✅ **Avec Supabase, tu n'as RIEN à installer** — ni PostgreSQL, ni Docker. Le projet
> Supabase est obligatoire de toute façon (le CDC l'impose pour les fichiers) et il fournit
> **aussi** une base PostgreSQL. Tu n'as qu'à copier une *connection string*.
> Le CDC demande « PostgreSQL via Prisma » **sans imposer d'hébergeur** : réutiliser le
> Postgres de Supabase est donc 100 % conforme.

1. Crée un compte sur https://supabase.com puis un **nouveau projet** (note bien le
   **mot de passe de la base** que tu choisis — il sert dans les URLs).
2. **Base (2 URLs)** : clique le bouton **`Connect`** (en haut du dashboard). Prisma a
   besoin de **deux** connection strings :
   - **`DATABASE_URL`** = mode **Transaction** (port **6543**), ajoute `?pgbouncer=true` →
     utilisée par l'application.
   - **`DIRECT_URL`** = mode **Session** (port **5432**) → utilisée par les migrations.
   > ⚠️ Si tu ne mets qu'une seule URL (le pooler 6543), `npm run db:migrate` échouera :
   > les migrations ont besoin de la connexion directe (5432).
3. **Stockage** : `Storage → New bucket` → nomme le bucket **`documents`**.
4. **Clés** : `Project Settings → API` → copie `Project URL` dans `SUPABASE_URL` et la clé
   **`service_role`** dans `SUPABASE_SERVICE_ROLE_KEY`.

#### Tu préfères une base PostgreSQL 100 % locale ? (optionnel)
Tu auras quand même besoin du projet Supabase pour le **stockage** (étapes 3–4), mais tu
peux faire tourner Postgres en local pour `DATABASE_URL` :

- **Avec Docker** (recommandé si tu connais Docker — rien à installer côté Postgres) :
  ```bash
  docker run --name bridge-db -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=bridge -p 5432:5432 -d postgres:16
  ```
  puis `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bridge?schema=public"`.
- **Sans Docker** : installe PostgreSQL (https://www.postgresql.org/download/), crée une
  base `bridge`, et adapte `DATABASE_URL` en conséquence.

> En résumé : **Supabase = zéro installation**. Docker/Postgres local ne sont que des
> alternatives si tu veux une base de dev hors-ligne.

### c) Secret d'authentification
```bash
npx auth secret      # génère et propose une valeur pour AUTH_SECRET
```

### d) Renseigner `.env` et initialiser la base
```bash
cp .env.example .env          # puis colle tes valeurs (DATABASE_URL, SUPABASE_*, AUTH_SECRET)
npm run db:migrate            # crée les tables en base
ALLOW_DEMO_SEED=true npm run db:seed   # comptes de démo, base LOCALE uniquement
npm run dev                   # http://localhost:3000
```

> Bloqué sur cette étape ? Demande de l'aide tout de suite — c'est le point de friction
> classique du démarrage, ce n'est pas grave.

---

## 1. Le principe : « vertical slice »

Le code n'est **pas** rangé par couche technique (un dossier `components`, un dossier
`services`, un dossier `database`…). Il est rangé **par fonctionnalité**. Chaque
fonctionnalité — appelée **slice** — contient *tout* ce dont elle a besoin : son
interface, sa validation, sa logique et son accès aux données.

```
❌ Par couche (ce qu'on NE fait PAS)      ✅ Par fonctionnalité (vertical slice)
src/                                       src/features/
├─ components/                             ├─ candidature/     ← tout pour candidater
├─ services/                               ├─ suivi/           ← tout pour le suivi
├─ validators/                             ├─ demandes-admin/  ← tout pour la RH
└─ db/                                     └─ notifications/   ← tout pour les emails
```

**Pourquoi ?** Une slice est un livrable autonome : tu peux la construire, la tester et
la faire relire sans toucher au reste. Tu sais toujours où mettre ton code : *dans la
slice de la fonctionnalité sur laquelle tu travailles*.

---

## 2. Carte du projet

```
src/
├─ app/                     Routes Next.js (les URLs). Elles ASSEMBLENT les slices.
│  ├─ page.tsx              Accueil
│  ├─ exemple/              Démo (à supprimer)
│  └─ api/auth/...          Endpoint NextAuth (déjà câblé)
│
├─ features/                ⭐ TON espace de travail : une fonctionnalité = un dossier
│  ├─ _example-note/        Slice de DÉMO — ton modèle à copier (voir §3)
│  ├─ candidature/          Slice 1 — à réaliser (README dans le dossier)
│  ├─ suivi/                Slice 2 — à réaliser
│  ├─ demandes-admin/       Slice 3 — à réaliser
│  └─ notifications/        Slice 4 — à réaliser
│
├─ shared/                  Code PARTAGÉ entre plusieurs slices (voir §5)
│  ├─ db/prisma.ts          Client Prisma (accès base)
│  ├─ auth/auth.ts          Configuration NextAuth (connexion RH)
│  ├─ storage/supabase.ts   Upload des fichiers vers Supabase
│  ├─ constants/domain.ts   Règles métier (tailles, statuts, docs requis…)
│  ├─ validation/file.ts    Validation des fichiers PDF
│  └─ ui/                   Composants réutilisables (ex. StatusBadge)
│
└─ types/                   Déclarations TypeScript globales (augmentation NextAuth)

prisma/
├─ schema.prisma           Modèle de données (tables + relations)
└─ seed.ts                 Données de départ (compte RH de test)
```

> **Règle d'or :** si du code ne sert qu'à UNE fonctionnalité → il va dans sa slice.
> S'il sert à PLUSIEURS → il va dans `shared/`. En cas de doute, commence dans la slice ;
> tu déplaceras vers `shared/` le jour où une 2ᵉ slice en a besoin.
>
> ⚠️ **Évite la « fat slice » :** une slice qui grossit trop et couvre plusieurs
> fonctionnalités. Si ça arrive, découpe-la en slices plus petites à but unique.

---

## 3. Anatomie d'une slice (étudie l'exemple `_example-note`)

La slice `_example-note` est une **démonstration complète** d'une fonctionnalité, de
l'écran jusqu'à la base. **C'est ton modèle.** Copie sa structure, puis supprime-la.

| Fichier | Rôle | Type |
|---|---|---|
| `schema.ts` | Décrit et valide les données (Zod) | partagé client/serveur |
| `queries.ts` | Requêtes Prisma de **lecture** | serveur |
| `actions.ts` | **Server Actions** (écritures/mutations) | serveur (`"use server"`) |
| `components/NoteForm.tsx` | Formulaire qui appelle l'action | client (`"use client"`) |
| `components/NoteList.tsx` | Affichage de la liste | serveur (async) |

Le flux : `NoteForm` (UI) → `createNote` (action) → valide avec `schema` → écrit via
`prisma` → `revalidatePath` rafraîchit `NoteList` qui relit via `queries`.

👉 Ouvre ces fichiers, lis les commentaires, lance http://localhost:3000/exemple.

---

## 4. Créer une nouvelle slice — pas à pas

Exemple : tu commences la **Slice 1 (candidature)**.

1. **Lis le cahier de la slice** : `src/features/candidature/README.md` (objectif + checklist).
2. **Crée tes fichiers** sur le modèle de l'exemple :
   - `schema.ts` → le schéma Zod du formulaire
   - `actions.ts` → la Server Action qui crée la demande
   - `queries.ts` → tes lectures (si besoin)
   - `components/` → tes composants d'UI
3. **Crée la route** dans `src/app/` qui affiche tes composants
   (ex. `src/app/candidature/page.tsx`).
4. **Réutilise `shared/`** au lieu de réécrire : validation de fichier, upload Supabase,
   constantes métier, client Prisma…
5. **Coche la checklist** du README de la slice avant de demander une revue.

> 🗄️ **Modèle de données :** la source de vérité est `prisma/schema.prisma`. Étudie-le
> avant de coder une slice. Si tu **ajoutes ou modifies un modèle**, lance ensuite
> `npm run db:migrate` pour mettre la base à jour.

---

## 5. La couche `shared/` — ce qui est déjà prêt pour toi

| Import | À utiliser pour |
|---|---|
| `@/shared/db/prisma` | Toute requête base de données |
| `@/shared/auth/auth` | `auth()` pour savoir qui est connecté ; protéger les pages `admin` |
| `@/shared/storage/supabase` | `uploadDocument(file, prefix)` pour stocker un PDF |
| `@/shared/constants/domain` | Tailles max, statuts, **documents requis par type de stage** |
| `@/shared/validation/file` | `validatePdf(file)` (PDF + 2 Mo) |
| `@/shared/ui/StatusBadge` | Afficher un statut coloré |

> Le `@/` est un raccourci vers `src/` (configuré dans `tsconfig.json`).

---

## 6. Travailler avec la base de données (Prisma)

La base est **PostgreSQL** (hébergée sur Supabase). On ne l'interroge **jamais en SQL
brut** : on passe par **Prisma**, qui génère un client *typé* à partir du schéma.

### Le cycle Prisma (à comprendre une fois pour toutes)
1. Tu décris tes tables dans `prisma/schema.prisma` (les blocs `model`).
2. `npm run db:migrate` applique ces changements à la base **et** régénère le client.
3. Tu interroges la base via `import { prisma } from "@/shared/db/prisma"`.

### Le modèle existant (déjà prêt — à étudier avant de coder)
`prisma/schema.prisma` contient déjà les tables du projet :
- `User` — comptes du back-office (RH / Admin)
- `Profile` — infos personnelles du candidat
- `InternshipRequest` — la demande (type, statut, code de suivi, dates…)
- `Document` — fichier PDF lié à une demande

> 📌 **Rappel CDC :** les **données** vivent dans PostgreSQL ; les **fichiers** vivent dans
> Supabase Storage. En base, on ne stocke que **l'URL** du document, jamais le binaire.

### Lire des données → dans `queries.ts`
```ts
import { prisma } from "@/shared/db/prisma";

export function getRequest(trackingCode: string) {
  return prisma.internshipRequest.findUnique({
    where: { trackingCode },
    include: { profile: true, documents: true }, // récupère aussi les relations
  });
}
```

### Écrire des données → dans `actions.ts` (côté serveur)
```ts
await prisma.internshipRequest.create({
  data: {
    type, duration, startDate, trackingCode,
    profile: { create: { firstName, lastName, email, phone, school, field, level } },
  },
});
```

### Ajouter ou modifier une table
1. Édite `prisma/schema.prisma` (ajoute/modifie un `model` ou un champ).
2. Lance `npm run db:migrate` et donne un **nom** à la migration (ex. `add_evaluation`).
3. Le client typé est régénéré : l'autocomplétion connaît immédiatement ton nouveau champ.

### Voir / éditer les données
```bash
npm run db:studio   # Prisma Studio : explore la base dans le navigateur
```

> Détail complet des champs et relations : voir le [document MVP](./MVP-Bridge.pdf)
> (section « Modèle de données ») et `prisma/schema.prisma`.

---

## 7. Conventions de code (à respecter)

- **Langue :** l'**interface** (textes affichés) est en **français** ; les **identifiants
  techniques** (variables, fonctions, types) sont en **anglais**. Les **noms du domaine
  métier** — donc les dossiers de slices (`candidature`, `suivi`…) et les valeurs métier —
  restent en **français** pour coller au cahier des charges (langage commun de l'équipe).
  L'essentiel est de **rester cohérent** dans tout le projet.
- **Composants serveur par défaut.** N'ajoute `"use client"` que si le composant a
  besoin d'interactivité (état, événements, hooks React).
- **Toujours valider côté serveur** dans tes actions, même si le client a déjà validé.
  Le client peut être contourné, pas le serveur.
- **Style :** utilise les classes **DaisyUI** (`btn`, `card`, `input`, `badge`…) et le
  thème `bridge` (couleurs déjà configurées). Ne mets pas de couleurs en dur.
- **Mobile-first :** conçois d'abord pour mobile (les candidats sont sur téléphone).
- **Pas de secret dans le code.** Tout passe par `.env` (jamais committé).

---

## 8. Règles métier à ne JAMAIS oublier

- 📄 **Documents : PDF uniquement, 2 Mo maximum.** Vérifie côté client ET serveur
  (`validatePdf`).
- 📑 **Les documents demandés dépendent du type de stage** (académique vs professionnel) —
  voir `REQUIRED_DOCUMENTS` dans `shared/constants/domain.ts`.
- 🔑 **Code de suivi non devinable** (token aléatoire, jamais un numéro qui s'incrémente),
  sinon n'importe qui pourrait voir le dossier d'un autre.
- 📧 **Un email part à chaque changement de statut** (Slice 4).
- 🔒 **Les pages `admin` sont protégées** : un visiteur non connecté est redirigé vers
  `/admin/login`.

---

## 9. Méthode de travail Git

1. Pars toujours d'une branche au format `feature/<nom>` (convention du dépôt) :
   `git checkout -b feature/candidature`.
2. Commits **petits et fréquents**, message clair :
   `feat(candidature): étape 1 du formulaire`.
3. Quand une slice est finie et que sa **checklist est cochée**, ouvre une *Pull Request*
   et demande une revue.
4. **Ne committe jamais** `.env`, `node_modules/`, ni de fichier de plus de 2 Mo.

Préfixes de commit conseillés : `feat:` (nouveauté), `fix:` (correction),
`refactor:`, `style:`, `docs:`.

---

## 10. Ordre de travail conseillé

1. **Setup** : faire tourner le projet en local (README) — base migrée, `npm run dev` OK.
2. **Étudier** la slice `_example-note` jusqu'à la comprendre entièrement.
3. **Slice 1 — Candidature** (le cœur du produit).
4. **Slice 3 — Gestion des demandes** (auth RH + liste + statut).
5. **Slice 2 — Suivi** (consultation par code).
6. **Slice 4 — Notifications** (greffée sur le changement de statut).
7. **Finitions** : responsive, tests, déploiement Vercel.
8. **Nettoyage** : supprimer la slice `_example-note`, le modèle `ExampleNote` et la
   route `/exemple`.

---

## 11. Checklist avant de demander une revue

> Pour le MVP, **pas de tests automatisés requis** : la validation se fait manuellement
> via cette checklist (et celle de la slice).

- [ ] La checklist du README de la slice est cochée.
- [ ] `npm run build` passe sans erreur.
- [ ] `npm run lint` ne remonte rien.
- [ ] Les textes affichés sont en français, sans faute.
- [ ] L'écran est correct sur mobile.
- [ ] Aucun secret ni fichier lourd n'est committé.

---

## 12. Ressources

- Next.js (App Router) : https://nextjs.org/docs/app
- Prisma : https://www.prisma.io/docs
- DaisyUI (composants) : https://daisyui.com/components
- Zod : https://zod.dev
- Auth.js (NextAuth v5) : https://authjs.dev
- Supabase Storage : https://supabase.com/docs/guides/storage

Bon courage, et n'hésite pas à poser des questions tôt plutôt que de rester bloqué 💪
