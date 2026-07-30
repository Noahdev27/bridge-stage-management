# Audit de conformité — MVP + Phase 2

Référence : `docs/MVP-Bridge.pdf` (Cahier de réalisation — MVP, v1.0 du 11 juin 2026).
Branche auditée : `mvpprime`. Légende : ✅ conforme · ⚠️ partiel · ❌ manquant

---

## 1. Definition of Done du MVP (§ 12 du CDC)

| Critère | État | Vérification |
|---|---|---|
| Un candidat soumet une demande complète avec PDF (≤ 2 Mo) | ✅ | `candidature/actions.ts`, `shared/validation/file.ts` (client + serveur) |
| Demande et fichiers enregistrés (base + Supabase) | ✅ | Transaction Prisma + upload en deux temps (`temp/` → `candidatures/AAAA/MM/<id>`) avec nettoyage en cas d'échec |
| Code de suivi reçu (écran + email) et statut consultable | ✅ | 16 caractères / 80 bits (`shared/tracking/tracking-code.ts`), `SuccessScreen`, `/suivi` |
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
| Compte candidat avec authentification | ✅ | Inscription avec **confirmation d'adresse obligatoire**, connexion, `/espace-candidat` liste les demandes. Le code de suivi reste l'accès sans compte. |

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

### Sécurité — second passage

14. **Inscription candidat sans preuve de détention de l'adresse.** Un candidat
    qui postule ne crée aucun compte (le parcours ne crée qu'un `Profile`) :
    aucune ligne `User` n'existait donc pour son email. N'importe qui connaissant
    l'adresse d'un candidat pouvait s'inscrire avec elle et lire son dossier —
    `getCandidateRequests` rattache les demandes par `profile.email`, et
    `/espace-candidat` affiche le **code de suivi**, qui ouvre ensuite `/suivi`
    (nom, école, type, durée, dates, statut). → confirmation d'adresse
    obligatoire : `User.emailVerifiedAt` + jeton à usage unique de 256 bits
    stocké **haché** (SHA-256), valable 24 h
    (`compte-candidat/verification.ts`). Trois contrôles superposés :
    `authorize()` refuse la session d'un candidat non vérifié (contrôle qui fait
    autorité), `loginCandidate` donne le message explicite, et
    `getCandidateRequests` revérifie en base — un JWT ouvert avant le correctif
    survivrait sinon au déploiement. Renvoi de l'email possible depuis la page de
    connexion, avec palier anti-abus de 2 minutes et réponse neutre (ce point
    d'entrée public ne doit ni inonder une boîte tierce ni révéler qu'une adresse
    est inscrite).
15. **Entropie du code de suivi sous le standard du CDC.** L'ancien format
    (`randomBytes(4)`, 8 caractères hexadécimaux) ne portait que 32 bits, là où
    le § 8 demande « un token aléatoire non devinable (ex. UUID) », sur une page
    `/suivi` publique et sans limitation de débit. → 16 caractères tirés d'un
    alphabet de 32 (Crockford, sans I/L/O/U), soit **80 bits**. Le tirage est
    uniforme (`octet % 32`, exact car 256 est multiple de 32). La saisie tolère
    tirets, espaces, minuscules et confusions O/0, I/1, L/1 ; l'affichage est
    groupé (`ABCD-EFGH-JKMN-PQRS`). Les codes à 8 caractères déjà émis restent
    acceptés, pour ne pas priver leurs titulaires du suivi de leur dossier.
16. **Email non normalisé à l'inscription candidat.** `Jean@X.com` et
    `jean@x.com` créaient deux comptes distincts et contournaient le contrôle
    « un compte existe déjà ». → normalisation (trim + minuscules) dans le schéma
    et dans `authorize()`, alignée sur `tuteurs/schema.ts`.

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
- **Limitation de débit (rate limiting).** Aucune sur `/admin/login`,
  `/candidat/login`, `/suivi` ni `/candidature`. Le CDC ne l'exige pas. Le renvoi
  d'email de vérification a son propre palier applicatif (2 min), mais une vraie
  protection contre le bourrinage demande une couche dédiée (Vercel WAF, Upstash
  Redis…).
- **Tests automatisés.** Aucun harnais de test dans le projet ; le CDC ne
  l'impose pas mais c'est le premier chantier qualité à ouvrir. Les correctifs
  14 et 15 ont été validés par des scripts jetables (entropie, uniformité du
  tirage, normalisation, jeton URL-safe) qu'il faudrait pérenniser en tests.
- **`shared/storage/supabase.ts` sans `import "server-only"`**, contrairement à
  `guards.ts`, `purge.ts` et `mailer.ts`. Next.js n'expose pas les variables non
  préfixées `NEXT_PUBLIC_` au client, donc la clé `SERVICE_ROLE` ne fuiterait
  pas — l'import échouerait à l'exécution. À aligner pour échouer tôt.
- **« Plan de localisation » hors CDC.** `REQUIRED_DOCUMENTS` impose ce document
  en plus de l'Annexe A (5 pièces en académique au lieu de 4, 6 au lieu de 5 en
  professionnel), et `validateDocumentSet` l'exige. Cohérent avec l'extension
  domicile/GPS de la Phase 2, mais à valider avec le donneur d'ordre.
- **Purge des comptes candidats orphelins.** La purge RGPD efface le profil et
  les documents, mais pas le compte `User` de rôle `CANDIDATE` associé.
