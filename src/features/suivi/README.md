# Slice 2 — Suivi de dossier ✅

**Acteur :** Candidat · **Référence :** document MVP, section 7.2

## Objectif
Permettre au candidat de consulter l'état de sa demande via son code de suivi,
sans créer de compte.

## Fichiers
- `schema.ts` — validation du code de suivi saisi et de l'adresse de renvoi
- `actions.ts` — Server Actions : recherche, renvoi du code par email
- `queries.ts` — `findUnique` sur `InternshipRequest` par `trackingCode`
- `tracking-code-resend.ts` — renvoi du code à l'adresse du dossier (`server-only`)
- `components/ResendTrackingCodeForm.tsx` — « J'ai perdu mon code »
- route : `src/app/suivi/page.tsx`

## Checklist (Definition of Done)
- [x] Page publique de saisie du code de suivi
- [x] Code valide → affiche le statut (`shared/ui/StatusBadge`) + infos clés
- [x] Code invalide → message d'erreur clair, sans fuite d'information
- [x] Impossible de deviner le dossier d'un autre (code aléatoire, pas séquentiel)
- [x] Skeleton pendant la recherche, toast en cas d'erreur
- [x] Renvoi du code par email si le candidat l'a perdu (réponse neutre, palier 5 min)
- [x] Le message de décision RH est repris ici (et dans `/espace-candidat`)

## Notes d'implémentation
- La réponse ne renvoie que les champs nécessaires à l'affichage (nom, école,
  type, dates, statut) — jamais les documents ni les coordonnées.
- Depuis la Phase 2, un compte candidat (`/espace-candidat`) offre une seconde
  voie d'accès ; le code de suivi reste l'accès sans authentification.
