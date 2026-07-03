# Audit MVP — Conformité au cahier des charges (branche `integration`)

Date : audit de la base consolidée. Légende : ✅ fait · ⚠️ partiel · ❌ manquant

---

## 1. Front-office (candidat)

| Fonctionnalité (CDC) | État | Détail |
|---|---|---|
| Consulter les besoins de stage **par département** | ❌ | Aucune page de liste des besoins/offres. Le candidat postule sans voir les besoins. |
| Formulaire multi-étapes (infos → parcours → documents → validation) | ✅ | 4 étapes propres, barre de progression, récap. |
| Suivi du statut par **code de suivi** | ✅ | Page `/suivi`, recherche par code 8 caractères. |
| Suivi via **compte candidat** | ❌ | Pas de compte candidat (seulement le code). Le CDC proposait « code OU compte ». |
| **Email** à chaque changement de statut | ✅ | `notifyStatusChange` (Resend) + email de confirmation à la soumission. |

---

## 2. Back-office (Admin / RH)

| Fonctionnalité (CDC) | État | Détail |
|---|---|---|
| Authentification RH + rôles | ✅ | NextAuth, middleware protège `/admin` (ADMIN/RH). |
| Dashboard **statistiques** (reçues/traitées/acceptées/rejetées par mois/année) | ❌ | Aucune stat ni graphique. Seulement un tableau. **Grosse pièce manquante.** |
| Filtrer par **statut** | ✅ | `StatusFilter` (onglets par URL). |
| Filtrer par **type / date / tuteur** | ❌ | Seul le statut est filtrable. |
| Voir le dossier candidat + **PDF dans le navigateur** | ⚠️ | Les documents s'ouvrent dans un nouvel onglet (lien Supabase), pas de visionneuse intégrée. |
| **Assigner un tuteur** | ❌ | Rôle TUTOR repoussé en Phase 2, aucune assignation. |
| **Notes internes / notation** | ❌ | Aucune note ni rating sur un dossier. |
| Workflow de statut + email auto | ✅ | Boutons Traiter/Accepter/Refuser → maj + email. |
| **Alertes** pour demandes en attente proches de la date de début | ❌ | Non implémenté. |

---

## 3. Champs du formulaire vs CDC

| Champ demandé (CDC) | État | Détail |
|---|---|---|
| Nom, prénom, email, téléphone | ✅ | |
| **2 numéros de proches** | ⚠️❌ | `phone2` est collecté mais **PAS enregistré en base** (seul `phone1` est sauvé dans `profile.phone`). Donnée perdue. Et ce sont les tél. du candidat, pas « des proches ». |
| **Adresse (lieudit + coordonnées GPS)** | ❌ | Aucun champ adresse/GPS dans le formulaire ni le schéma Prisma. |
| Filière | ✅ | |
| Niveau d'étude | ✅ | Select L1→M2 / BAC+3→5. |
| Durée du stage | ✅ | + durée minimale selon type. |
| Date de début souhaitée | ✅ | |
| Rapport à produire (Oui/Non) | ✅ | |

---

## 4. Règles métier & RGPD

| Règle (CDC) | État | Détail |
|---|---|---|
| Upload **PDF only, 2 Mo max** (client + serveur) | ✅ | `validatePdf` utilisé des deux côtés. |
| **Composition du dossier selon le type** | ⚠️ | Contrôlée côté **client** uniquement. Côté serveur, l'action vérifie seulement « ≥ 1 document », pas la liste complète requise. |
| Mots de passe chiffrés | ✅ | bcrypt. |
| **Fichiers sensibles chiffrés** | ❌ | Stockés en clair sur Supabase. |
| **Purge des candidats non retenus (≥ 6 mois)** | ❌ | Aucune purge RGPD. |

---

## 5. Exigences UX

| Exigence | État |
|---|---|
| Mobile-first / responsive | ✅ |
| Formulaire multi-étapes | ✅ |
| **Skeleton screens** au chargement | ⚠️ (spinners, pas de skeletons) |
| **Toasts** à la soumission | ⚠️ (alertes inline + écran succès, pas de toast) |

---

## 6. Bugs / dette technique (code)

1. **`phone2` perdu** — collecté et validé mais jamais écrit en base (`candidature/actions.ts`). Soit le sauvegarder (ajouter un champ au `Profile`), soit le retirer.
2. **Composition du dossier non revalidée serveur** — un envoi sans JS peut passer avec 1 seul document.
3. **Pas de transaction Prisma** — `Profile` puis `InternshipRequest` créés séparément → profil orphelin si la 2ᵉ écriture échoue. À wrapper dans `prisma.$transaction`.
4. **Upload Supabase dans `temp/`** — jamais réorganisé par `requestId`, et pas de nettoyage si la BD échoue après l'upload.
5. **`nextStatus as any`** dans `admin/[id]/page.tsx` — à typer en `RequestStatus`.
6. **Slices de démo encore présentes** — `_example-note` + route `/exemple` à supprimer avant la prod.

---

## 7. Verdict

**Le cœur du MVP fonctionne de bout en bout** : candidater → email de confirmation → suivi par code → traitement RH → email de changement de statut. C'est solide et bien structuré.

**Mais l'app n'est pas encore complète vs le CDC.** Manquent surtout :
- le **dashboard statistiques** (explicitement demandé) ;
- les **filtres type/date** ;
- la **capture adresse/GPS** et la **sauvegarde du 2ᵉ contact** ;
- **notes internes / notation** ;
- **alertes** proximité date de début ;
- volet **RGPD** (chiffrement fichiers + purge 6 mois).

Phase 2 (assumé) : rôle **Tuteur** + assignation.

### Priorités suggérées (prochain sprint)
1. 🔴 Corriger les bugs de données (phone2, transaction, compo dossier serveur).
2. 🔴 Dashboard statistiques (mois/année) + filtres type/date.
3. 🟠 Champs adresse/GPS + 2ᵉ contact dans le schéma et le formulaire.
4. 🟠 Notes internes / notation sur un dossier.
5. 🟡 Alertes date de début, purge RGPD, toasts/skeletons.
