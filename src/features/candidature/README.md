# Slice 1 — Candidature (à réaliser)

**Acteur :** Candidat · **Référence :** document MVP, section 7.1

## Objectif
Permettre à un candidat de soumettre une demande de stage via un formulaire
multi-étapes et d'obtenir un code de suivi.

## Fichiers attendus (copier le pattern de `_example-note`)
- `schema.ts` — validation Zod du formulaire (toutes les étapes)
- `actions.ts` — Server Action : créer `Profile` + `InternshipRequest` + `Document[]`, générer le `trackingCode`
- `queries.ts` — lectures éventuelles
- `components/` — étapes du formulaire (Infos → Parcours → Documents → Récap)
- route : `src/app/candidature/page.tsx`

## Checklist (Definition of Done)
- [x] Formulaire multi-étapes avec navigation et validation par étape
- [x] Champs obligatoires validés côté client ET serveur (Zod)
- [x] Upload PDF uniquement, 2 Mo max (utiliser `shared/validation/file.ts`)
- [x] La liste des documents s'adapte au type de stage (`shared/constants/domain.ts`)
- [x] Création en base (statut `PENDING`) + upload Supabase (`shared/storage/supabase.ts`)
- [ ] Code de suivi non devinable, affiché à l'écran ET envoyé par email (Slice 4)
- [x] Toast de confirmation + skeleton de chargement
- [x] Utilisable sur mobile
