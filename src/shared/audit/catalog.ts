// Catalogue des événements du journal d'audit.
//
// Les codes sont stockés en base : ils ne doivent jamais être renommés, sous
// peine de perdre le libellé des entrées déjà enregistrées. Pour en retirer un,
// le laisser ici.

export type AuditCategory =
  | "dossiers"
  | "attestations"
  | "comptes"
  | "offres"
  | "securite";

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  dossiers: "Dossiers",
  attestations: "Attestations",
  comptes: "Comptes",
  offres: "Offres",
  securite: "Sécurité",
};

export const AUDIT_ACTIONS = {
  "request.status_changed": { label: "Statut modifié", category: "dossiers" },
  "request.tutor_assigned": { label: "Tuteur affecté", category: "dossiers" },
  "request.tutor_removed": { label: "Tuteur retiré", category: "dossiers" },
  "request.evaluated": { label: "Évaluation enregistrée", category: "dossiers" },
  "request.purged": { label: "Purge RGPD", category: "dossiers" },

  "attestation.period_saved": { label: "Période de stage saisie", category: "attestations" },
  "attestation.issued": { label: "Attestation délivrée", category: "attestations" },
  "attestation.branding_uploaded": { label: "Griffe installée", category: "attestations" },
  "attestation.branding_removed": { label: "Griffe retirée", category: "attestations" },

  "account.rh_created": { label: "Compte RH créé", category: "comptes" },
  "account.rh_renamed": { label: "Compte RH renommé", category: "comptes" },
  "account.rh_deleted": { label: "Compte RH supprimé", category: "comptes" },
  "account.tutor_created": { label: "Tuteur créé", category: "comptes" },
  "account.tutor_renamed": { label: "Tuteur renommé", category: "comptes" },
  "account.tutor_deleted": { label: "Tuteur supprimé", category: "comptes" },
  "account.profile_renamed": { label: "Nom de profil modifié", category: "comptes" },

  "offer.created": { label: "Offre créée", category: "offres" },
  "offer.updated": { label: "Offre modifiée", category: "offres" },
  "offer.published": { label: "Offre publiée", category: "offres" },
  "offer.unpublished": { label: "Offre dépubliée", category: "offres" },
  "offer.deleted": { label: "Offre supprimée", category: "offres" },

  "auth.login_success": { label: "Connexion", category: "securite" },
  "auth.login_failed": { label: "Échec de connexion", category: "securite" },
  "auth.password_changed": { label: "Mot de passe modifié", category: "securite" },
} as const satisfies Record<string, { label: string; category: AuditCategory }>;

export type AuditAction = keyof typeof AUDIT_ACTIONS;

/** Codes appartenant à une catégorie, pour le filtre de la page du journal. */
export function actionsOfCategory(category: AuditCategory): AuditAction[] {
  return (Object.keys(AUDIT_ACTIONS) as AuditAction[]).filter(
    (code) => AUDIT_ACTIONS[code].category === category
  );
}

/** Libellé d'un code, y compris un code inconnu (entrée ancienne). */
export function auditActionLabel(code: string): string {
  return code in AUDIT_ACTIONS ? AUDIT_ACTIONS[code as AuditAction].label : code;
}

export function isAuditCategory(value: string | undefined): value is AuditCategory {
  return !!value && value in AUDIT_CATEGORY_LABELS;
}
