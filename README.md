# Bridge — Gestion des demandes de stage

Plateforme de gestion des demandes de stage (front-office candidat + back-office RH).
Projet **Bridge Technologies Solutions**.

> 👉 **Tu débutes sur le projet ? Lis d'abord [`GUIDE_STAGIAIRE.md`](./docs/GUIDE_STAGIAIRE.md).**
> Périmètre fonctionnel : [document MVP](./docs/MVP-Bridge.pdf). Maquettes visuelles : [`MAQUETTES.md`](./docs/MAQUETTES.md).

## Stack

| Brique | Techno |
|---|---|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript |
| Style | Tailwind CSS v4 + DaisyUI 5 (thème `bridge`) |
| Base de données | PostgreSQL via Prisma 6 |
| Stockage fichiers | Supabase Storage |
| Auth | NextAuth (Auth.js v5), Credentials + rôles |
| Validation | Zod |

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
#   puis renseigner DATABASE_URL, AUTH_SECRET, SUPABASE_*
#   Pas encore de base ni de Supabase ? → suis la « section 0 » du GUIDE_STAGIAIRE
#   (Supabase = zéro installation, ni PostgreSQL ni Docker à installer).

# 3. Créer le schéma en base
npm run db:migrate

# 4. Créer un compte RH de test (rh@bridge.test / password123)
npm run db:seed

# 5. Lancer le serveur de dev
npm run dev
```

App sur http://localhost:3000

## Configuration email (SMTP)

Les emails transactionnels (code de suivi, changement de statut, affectation
tuteur, confirmation d'adresse) partent par SMTP via `shared/mail/mailer.ts`.
Aucun code n'est à modifier : il suffit de renseigner six variables.

> ⚠️ Tant que le SMTP n'est pas configuré, **aucun candidat ne peut activer son
> compte** : la connexion exige une adresse confirmée, et le lien de
> confirmation n'arrive que par email. Les échecs d'envoi sont volontairement
> non bloquants (`safeSend`) — ils n'apparaissent que dans les logs serveur,
> jamais à l'écran.

| Variable | Rôle |
|---|---|
| `SMTP_HOST` | Serveur d'envoi |
| `SMTP_PORT` | `587` (STARTTLS) ou `465` (TLS direct) |
| `SMTP_SECURE` | `false` pour le port 587, `true` pour le 465 |
| `SMTP_USER` | Identifiant du compte d'envoi |
| `SMTP_PASS` | Mot de passe d'application ou clé API |
| `SMTP_FROM` | Adresse expéditrice — **doit correspondre à `SMTP_USER`** |

Si `SMTP_FROM` diffère du compte authentifié, le serveur accepte
l'authentification puis refuse l'envoi.

### Où obtenir les valeurs

| Fournisseur | Où récupérer `SMTP_PASS` | Limite |
|---|---|---|
| **Gmail** | Compte Google → Sécurité → Mots de passe des applications (exige la validation en 2 étapes) | ~500 mails/jour |
| **Office 365** | Le mot de passe de la boîte, ou une clé d'application si MFA | L'admin doit activer *SMTP authentifié* sur la boîte (Centre d'administration M365 → Utilisateurs → la boîte → Courrier → Gérer les applications de messagerie) |
| **Resend** | Dashboard → API Keys (`SMTP_USER` vaut littéralement `resend`) | Nécessite un domaine vérifié pour écrire à des tiers |

Exemple Gmail, le plus rapide à mettre en place :

```dotenv
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="expediteur@gmail.com"
SMTP_PASS="mot-de-passe-application-16-lettres"
SMTP_FROM="expediteur@gmail.com"
```

### En production (Vercel)

Recréer les six variables dans *Settings → Environment Variables* (scope
Production), puis **redéployer** : les variables ne sont pas rechargées sur un
déploiement déjà construit.

> ⚠️ Vérifier aussi `AUTH_URL`. `compte-candidat/verification.ts` construit le
> lien de confirmation à partir de cette variable : si la valeur locale
> `http://localhost:3000` a été recopiée sur Vercel, les emails partent mais
> **tous les liens pointent vers localhost**. En production elle doit valoir
> l'URL réelle du déploiement.

### Vérifier

S'inscrire sur `/candidat/inscription` avec sa propre adresse : recevoir le lien
et pouvoir l'ouvrir valide d'un coup le SMTP, le rendu du template et `AUTH_URL`.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Crée/applique une migration Prisma |
| `npm run db:generate` | Régénère le client Prisma |
| `npm run db:studio` | Explorateur de base de données |
| `npm run db:seed` | Insère le compte RH de test |

## Structure (vertical slice)

```
src/
├─ features/        une fonctionnalité = un dossier complet (UI + logique + données)
│  ├─ candidature/     formulaire de candidature
│  ├─ suivi/           suivi par code
│  ├─ demandes-admin/  back-office RH (liste, stats, tuteurs, évaluation, purge)
│  ├─ compte-candidat/ inscription et espace candidat
│  ├─ offres/          offres de stage par département
│  └─ notifications/   emails transactionnels
├─ shared/          code partagé (db, auth, storage, ui, constantes, validation)
├─ types/           déclarations TypeScript globales (augmentation NextAuth)
└─ app/             routes Next.js qui assemblent les features
```

Détails et conventions : voir [`GUIDE_STAGIAIRE.md`](./docs/GUIDE_STAGIAIRE.md).
État de conformité au cahier des charges : [`AUDIT-MVP.md`](./docs/AUDIT-MVP.md).

## Rôles et accès

| Rôle | Accès |
|---|---|
| `ADMIN` / `RH` | Back-office complet : statuts, tuteurs, évaluations, purge RGPD |
| `TUTOR` | Ses dossiers affectés uniquement, en lecture seule |
| `CANDIDATE` | `/espace-candidat` : ses propres demandes, **après confirmation de son adresse email** |
| *(anonyme)* | Candidature, offres, suivi par code |

Un compte candidat s'auto-inscrit : son adresse doit donc être confirmée (lien
valable 24 h) avant toute connexion, sans quoi n'importe qui pourrait s'inscrire
avec l'email d'un candidat et lire son dossier. Les comptes du back-office sont
provisionnés par un administrateur et vérifiés d'office. Le renvoi du lien se
fait depuis `/candidat/login`.

> ⚠️ Le middleware ne protège que la navigation. Une Server Action est
> dispatchée par identifiant et peut être appelée depuis n'importe quelle route :
> **toute action sensible doit revérifier le rôle** via `shared/auth/guards.ts`.

## Tâche planifiée

`vercel.json` déclare un cron quotidien (03 h 00) sur
`/api/cron/purge-rejected` : suppression des dossiers rejetés depuis plus de
6 mois (documents Supabase + données personnelles). La route exige l'en-tête
`Authorization: Bearer $CRON_SECRET`.
