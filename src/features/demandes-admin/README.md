# Slice 3 — Gestion des demandes / Back-office RH ✅

**Acteur :** RH · **Référence :** document MVP, sections 7.3 et 13 (Phase 2)

## Objectif
Permettre à l'équipe RH de se connecter, consulter les demandes, lire les
documents et faire évoluer le statut.

## Fichiers
- `queries.ts` — liste filtrée, détail, statistiques, tuteurs, décompte de purge
- `actions.ts` — Server Actions : statut, évaluation, assignation de tuteur, purge
- `purge.ts` — logique de purge RGPD (module serveur, **jamais** exposé comme action)
- `deadline.ts` — calcul des alertes « date de début proche »
- `components/` — filtres, tableau de bord, visionneuse PDF, évaluation, tuteur
- routes : `src/app/admin/(shell)/page.tsx` (liste), `.../[id]/page.tsx` (détail),
  `src/app/admin/login/page.tsx` (connexion)

## Auth et rôles
Le middleware protège la navigation vers `/admin`, mais **il ne suffit pas** : une
Server Action est dispatchée par identifiant et peut être appelée depuis n'importe
quelle route de l'application. Chaque action revérifie donc le rôle via
`shared/auth/guards.ts`.

| Rôle | Périmètre |
|---|---|
| `ADMIN`, `RH` | Tous les dossiers, toutes les actions |
| `TUTOR` | Uniquement ses dossiers affectés, en **lecture seule** |
| `CANDIDATE` | Aucun accès au back-office |

Comptes de test : `npm run db:seed` (`rh@bridge.test`, `tuteur@bridge.test`).

## Checklist (Definition of Done)
- [x] Accès `admin` protégé (visiteur non connecté redirigé)
- [x] Liste : nom candidat, type, date, statut + filtre par statut
- [x] Vue détail : toutes les infos candidat + demande
- [x] PDF visualisables dans le navigateur (pas de téléchargement obligatoire)
- [x] Changement de statut (PENDING → PROCESS → ACCEPTED / REJECTED)
- [x] Chaque changement déclenche l'email (Slice 4)

### Phase 2
- [x] Tableau de bord statistique par mois et année
- [x] Filtres avancés : type, plage de dates, tuteur, rapport à produire
- [x] Assignation d'un tuteur + email dédié au tuteur
- [x] Note (1–5) et commentaire interne
- [x] Alerte sur les dossiers en attente dont le début approche (≤ 15 jours)
- [x] Purge RGPD des rejetés de plus de 6 mois (cron quotidien + bouton RH)

## Lecture des documents
Les pièces jointes ne sont **pas** servies par un lien Supabase permanent : les
URLs signées expirent, ce qui rendait les dossiers illisibles au bout d'une
semaine. La route `src/app/api/documents/[id]/route.ts` vérifie la session,
contrôle qu'un tuteur ne consulte que ses dossiers, puis signe une URL de
5 minutes à la demande.
