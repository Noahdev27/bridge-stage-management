# Slice 2 — Suivi de dossier ✅

**Acteur :** Candidat · **Référence :** document MVP, section 7.2

## Objectif
Permettre au candidat de consulter l'état de sa demande via son code de suivi,
sans créer de compte.

## Fichiers
- `schema.ts` — validation du code de suivi saisi
- `actions.ts` — Server Action de recherche
- `queries.ts` — `findUnique` sur `InternshipRequest` par `trackingCode`
- route : `src/app/suivi/page.tsx`

## Checklist (Definition of Done)
- [x] Page publique de saisie du code de suivi
- [x] Code valide → affiche le statut (`shared/ui/StatusBadge`) + infos clés
- [x] Code invalide → message d'erreur clair, sans fuite d'information
- [x] Impossible de deviner le dossier d'un autre (code aléatoire, pas séquentiel)
- [x] Skeleton pendant la recherche, toast en cas d'erreur

## Notes d'implémentation
- La réponse ne renvoie que les champs nécessaires à l'affichage (nom, école,
  type, dates, statut) — jamais les documents ni les coordonnées.
- Depuis la Phase 2, un compte candidat (`/espace-candidat`) offre une seconde
  voie d'accès ; le code de suivi reste l'accès sans authentification.
