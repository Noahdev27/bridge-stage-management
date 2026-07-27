# Slice 1 — Candidature ✅

**Acteur :** Candidat · **Référence :** document MVP, section 7.1

## Objectif
Permettre à un candidat de soumettre une demande de stage via un formulaire
multi-étapes et d'obtenir un code de suivi.

## Fichiers
- `schema.ts` — validation Zod du formulaire (toutes les étapes)
- `actions.ts` — Server Action : crée `Profile` + `InternshipRequest` + `Document[]`, génère le `trackingCode`
- `queries.ts` — lectures
- `components/` — étapes du formulaire (Infos → Parcours → Documents → Récap)
- route : `src/app/candidature/page.tsx`

## Checklist (Definition of Done)
- [x] Formulaire multi-étapes avec navigation et validation par étape
- [x] Champs obligatoires validés côté client ET serveur (Zod)
- [x] Upload PDF uniquement, 2 Mo max (`shared/validation/file.ts`)
- [x] La liste des documents s'adapte au type de stage (`shared/constants/domain.ts`)
- [x] Dossier complet exigé avant de passer au récapitulatif (Annexe A), revérifié côté serveur
- [x] Création en base (statut `PENDING`) + upload Supabase (`shared/storage/supabase.ts`)
- [x] Code de suivi non devinable, affiché à l'écran ET envoyé par email (Slice 4)
- [x] Toast de confirmation + skeleton de chargement
- [x] Utilisable sur mobile

## Notes d'implémentation
- Les fichiers sont d'abord déposés dans `temp/<session>` puis déplacés vers
  `candidatures/AAAA/MM/<requestId>` une fois la demande créée. En cas d'échec à
  n'importe quelle étape, les fichiers déjà envoyés sont supprimés et le profil
  est annulé — pas d'orphelin en base ni dans le bucket.
- Le chemin Supabase est stocké dans `Document.storagePath` : les URLs de lecture
  sont re-signées à la demande (voir Slice 3).
