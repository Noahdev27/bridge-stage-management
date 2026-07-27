# Audit de conformité — MVP + Phase 2

Référence : `docs/MVP-Bridge.pdf` (Cahier de réalisation — MVP, v1.0 du 11 juin 2026).
Branche auditée : `mvpprime`. Légende : ✅ conforme · ⚠️ partiel · ❌ manquant

---

## 1. Definition of Done du MVP (§ 12 du CDC)

| Critère | État | Vérification |
|---|---|---|
| Un candidat soumet une demande complète avec PDF (≤ 2 Mo) | ✅ | `candidature/actions.ts`, `shared/validation/file.ts` (client + serveur) |
| Demande et fichiers enregistrés (base + Supabase) | ✅ | Transaction Prisma + upload en deux temps (`temp/` → `candidatures/AAAA/MM/<id>`) avec nettoyage en cas d'échec |
| Code de suivi reçu (écran + email) et statut consultable | ✅ | `randomBytes` (non séquentiel), `SuccessScreen`, `/suivi` |
| La RH se connecte, voit la liste, lit les PDF, change le statut | ✅ | NextAuth + `/admin`, visionneuse intégrée via `/api/documents/[id]` |
| Chaque changement de statut déclenche un email | ✅ | `notifyStatusChange`, envoi non bloquant |
| Application responsive / mobile-first | ✅ | Tailwind + DaisyUI, sidebar repliable, formulaire mobile |
| Charte graphique Bridge (couleurs, Montserrat) | ✅ | Thème `bridge` dans `globals.css`, police chargée dans `layout.tsx` |
| Déployée sur Vercel | ⚠️ | `vercel.json` prêt (cron de purge). Déploiement à confirmer côté plateforme. |

**Conclusion MVP : conforme.**

---

## 2. Phase 2 (§ 13 du CDC)

| Fonctionnalité | État | Détail |
|---|---|---|
| Affectation des tuteurs et rôle TUTOR, **avec notifications dédiées** | ✅ | `assignTutor` + `TutorAssignedEmail`. Le tuteur ne voit que les dossiers qui lui sont affectés, en lecture seule. |
| Tableau de bord statistique (par mois et année) | ✅ | `StatsDashboard` : reçues / en attente / en traitement / acceptées / rejetées + ventilation mensuelle |
| Filtres avancés (tuteur, date, rapport à produire) | ✅ | `CandidatureFilters` + `parseCandidatureListFilters` (validation Zod des paramètres d'URL) |
| Notation et commentaires internes | ✅ | `RequestEvaluation` (note 1–5 + commentaire), réservé RH/ADMIN |
| Alertes sur les dates de début proches | ✅ | `deadline.ts`, seuil `START_DATE_ALERT_DAYS` (15 j), badge J-n sur les dossiers en attente |
| Champs étendus : domicile (lieudit + GPS), téléphones de deux proches | ✅ | `Profile.lieudit / latitude / longitude / relativePhone1 / relativePhone2`, validés par Zod |
| Purge RGPD automatique des non-retenus | ✅ | `purge.ts` : rejetés depuis > 6 mois, documents Supabase + données personnelles. Cron quotidien + déclenchement manuel RH. |
| Gestion des offres de stage par département | ✅ | `InternshipOffer`, page `/offres` filtrable, candidature rattachable à une offre |
| Compte candidat avec authentification | ✅ | Inscription/connexion, `/espace-candidat` liste les demandes. Le code de suivi reste l'accès sans compte. |

**Conclusion Phase 2 : conforme.**

---

## 3. Correctifs appliqués lors de cet audit

### Sécurité (bloquants)

1. **Server Actions du back-office sans contrôle de rôle.** `updateCandidatureStatus`
   n'effectuait aucune vérification ; `assignTutor`, `saveRequestEvaluation` et
   `purgeRejectedApplications` se contentaient de « utilisateur connecté ». Le
   middleware ne protège que la navigation : une Server Action est dispatchée par
   identifiant et peut être appelée depuis n'importe quelle route, y compris
   `/espace-candidat`. Un compte candidat pouvait donc accepter sa propre
   candidature ou déclencher la purge RGPD. → garde `requireManager()` sur toutes
   les actions d'écriture (`shared/auth/guards.ts`).
2. **`runRejectedPurge` exportée depuis un fichier `"use server"`.** La suppression
   définitive des dossiers était exposée comme action publique. → déplacée dans
   `demandes-admin/purge.ts` (module serveur ordinaire).
3. **Fonctions d'envoi d'email exposées comme Server Actions.** N'importe qui
   pouvait faire envoyer un email arbitraire depuis le domaine de l'entreprise. →
   `notifications/send-notification.tsx` n'est plus un fichier `"use server"`.
4. **Rôle TUTOR équivalent à RH.** Un tuteur voyait tous les dossiers et pouvait
   changer les statuts. → périmètre restreint à ses affectations, en lecture seule.

### Fonctionnel

5. **URLs de documents expirées.** Les URLs signées Supabase (TTL 7 jours)
   étaient stockées en base : passé une semaine, la RH ne pouvait plus ouvrir les
   PDF — en contradiction directe avec la Definition of Done. → `Document.storagePath`
   ajouté (migration `20260727090000_document_storage_path`), lecture via
   `/api/documents/[id]` qui vérifie la session et signe une URL de 5 minutes à la
   demande. Aucun lien permanent n'est exposé dans le HTML.
6. **Email de changement de statut en anglais.** Le template affichait la valeur
   brute de l'énumération (`ACCEPTED`) au lieu du libellé français. Le CDC exige
   un contenu en français. → `STATUS_LABELS[status]`.
7. **Notification tuteur absente**, alors que le CDC la mentionne explicitement
   (« avec notifications dédiées »). → `TutorAssignedEmail`.
8. **Statistiques : « Reçues » ne comptait que les dossiers `PENDING`.** Une
   demande acceptée disparaissait du total reçu. → « Reçues » = toutes les demandes
   de la période ; « En attente » exposé séparément.
9. **Étape 3 franchissable avec un dossier incomplet** (`uploadedFiles.size > 0`).
   Le serveur rejetait ensuite l'envoi. → la liste complète de l'Annexe A est
   désormais exigée côté client aussi.

### Qualité

10. `npm run lint` échouait (16 erreurs, 2 avertissements) → 0 problème.
11. Code mort supprimé : `CandidatureTable.tsx` (composant de débogage avec
    `console.log`, jamais importé) et la route `/login` (second écran de connexion
    admin, non lié, hors charte graphique — le seul écran valide est `/admin/login`).
12. Logique de badge de statut dupliquée dans deux pages → composant partagé
    `shared/ui/StatusBadge`.
13. Tutoiement/vouvoiement incohérents entre les deux emails → vouvoiement partout.

---

## 4. Points restants (hors périmètre du CDC)

Ces éléments ne sont exigés ni par le MVP ni par la Phase 2 ; ils sont listés pour
la suite.

- **Chiffrement au repos des documents.** Le CDC place la sécurité RGPD au niveau
  « mots de passe hashés + accès authentifié », ce qui est respecté. Le
  chiffrement applicatif des PDF n'est pas demandé.
- **CRUD des offres côté back-office.** Le CDC ne demande que la *consultation*
  côté candidat ; les offres sont créées par le seed ou en base.
- **Tests automatisés.** Aucun harnais de test dans le projet ; le CDC ne
  l'impose pas mais c'est le premier chantier qualité à ouvrir.
- **Purge des comptes candidats orphelins.** La purge RGPD efface le profil et
  les documents, mais pas le compte `User` de rôle `CANDIDATE` associé.
