import { describe, expect, it } from "vitest";
import {
  formatTrackingCode,
  normalizeTrackingCode,
} from "@/shared/tracking/tracking-code";
import { daysUntil, isStartDateAlert } from "@/features/demandes-admin/deadline";
import { parseCandidatureListFilters } from "@/features/demandes-admin/schema";
import { monthsBetween } from "@/features/attestation/document";
import { clientIpFrom, formatRetryAfter } from "@/shared/security/rate-limit";
import { AUDIT_ACTIONS, actionsOfCategory, auditActionLabel } from "@/shared/audit/catalog";

describe("code de suivi", () => {
  it("normalise la saisie : casse, tirets, caractères ambigus", () => {
    expect(normalizeTrackingCode("abcd-efgh o1l")).toBe("ABCDEFGH011");
  });

  it("se présente par groupes de 4", () => {
    expect(formatTrackingCode("ABCDEFGHJKMN")).toBe("ABCD-EFGH-JKMN");
  });
});

describe("alertes de date de début", () => {
  const today = new Date(2026, 9, 10);

  it("compte les jours restants", () => {
    expect(daysUntil(new Date(2026, 9, 25), today)).toBe(15);
  });

  it("alerte un dossier en attente qui démarre sous 15 jours", () => {
    expect(isStartDateAlert("PENDING", new Date(2026, 9, 20), 15, today)).toBe(true);
  });

  it("n'alerte pas un dossier déjà traité", () => {
    expect(isStartDateAlert("ACCEPTED", new Date(2026, 9, 20), 15, today)).toBe(false);
  });
});

describe("filtres de la liste RH", () => {
  it("ignore les valeurs inconnues", () => {
    expect(parseCandidatureListFilters({ status: "PIRATE", type: "X" })).toEqual({});
  });

  it("lit la recherche, l'offre et la page", () => {
    expect(
      parseCandidatureListFilters({ q: "  marie  ", offerId: "abc", page: "3" })
    ).toMatchObject({ q: "marie", offerId: "abc", page: 3 });
  });

  it("refuse une plage de dates inversée sans perdre le statut", () => {
    expect(
      parseCandidatureListFilters({ status: "PENDING", from: "2026-05-10", to: "2026-05-01" })
    ).toEqual({ status: "PENDING" });
  });
});

describe("durée affichée sur l'attestation", () => {
  it("arrondit au mois le plus proche", () => {
    expect(monthsBetween(new Date("2026-01-06"), new Date("2026-03-06"))).toBe(2);
  });

  it("ne descend jamais sous 1 mois", () => {
    expect(monthsBetween(new Date("2026-01-06"), new Date("2026-01-10"))).toBe(1);
  });
});

describe("limitation de débit", () => {
  it("retient la première adresse de x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "41.202.1.9, 10.0.0.1" });
    expect(clientIpFrom(headers)).toBe("41.202.1.9");
  });

  it("garde un identifiant commun faute d'en-tête", () => {
    expect(clientIpFrom(new Headers())).toBe("inconnu");
  });

  it("formule le délai en français", () => {
    expect(formatRetryAfter(30)).toBe("dans une minute");
    expect(formatRetryAfter(15 * 60)).toBe("dans 15 minutes");
    expect(formatRetryAfter(3 * 3600)).toBe("dans 3 heures");
  });
});

describe("catalogue du journal d'audit", () => {
  it("rattache chaque action à une catégorie", () => {
    const categorised = ["dossiers", "attestations", "comptes", "offres", "securite"].flatMap(
      (category) => actionsOfCategory(category as never)
    );
    expect(categorised.sort()).toEqual(Object.keys(AUDIT_ACTIONS).sort());
  });

  it("affiche le code brut d'une action inconnue plutôt que rien", () => {
    expect(auditActionLabel("ancien.code")).toBe("ancien.code");
  });
});
