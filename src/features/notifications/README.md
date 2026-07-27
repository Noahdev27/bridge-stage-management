# Slice 4 — Notifications email ✅

**Acteur :** Système · **Référence :** document MVP, section 7.4

## Objectif
Informer automatiquement le candidat par email à chaque changement de statut
(et à la soumission, avec le code de suivi).

## Fichiers
- `send-notification.tsx` — `notifySubmission`, `notifyStatusChange`, `notifyTutorAssignment`
- `templates/` — gabarits React Email (français, palette et typographie Bridge)
- transport : `shared/mail/mailer.ts` (SMTP via nodemailer)

Cette slice est **transverse** : appelée par la Slice 1 (confirmation) et la
Slice 3 (changement de statut, assignation de tuteur).

## ⚠️ Ce module n'est pas un fichier `"use server"`
Exposer ces fonctions comme Server Actions permettrait à n'importe qui d'envoyer
des emails arbitraires depuis le domaine de l'entreprise. Elles sont marquées
`server-only` et appelées uniquement depuis du code serveur.

## Checklist (Definition of Done)
- [x] Email automatique au candidat à chaque changement de statut
- [x] Email rappelle le statut (libellé **français**) + le code de suivi
- [x] Contenu en français, aux couleurs Bridge
- [x] Email de confirmation à la soumission (avec code de suivi)
- [x] Un échec d'envoi ne bloque PAS le changement de statut (`safeSend`)

### Phase 2
- [x] Email dédié au tuteur lors de son affectation à un dossier
