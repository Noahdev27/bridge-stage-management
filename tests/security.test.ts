import { beforeAll, describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/features/demandes-admin/csv";
import { buildSessionRefresh, readSessionRefresh } from "@/shared/auth/session-version";

describe("export CSV", () => {
  it("neutralise une formule saisie par un candidat", () => {
    expect(csvCell("=HYPERLINK(\"http://x\")")).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell("+237 699 00 00 00")).toBe("'+237 699 00 00 00");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("entoure les valeurs qui contiennent le séparateur ou un retour à la ligne", () => {
    expect(csvCell("Génie; logiciel")).toBe('"Génie; logiciel"');
    expect(csvCell("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
  });

  it("laisse les valeurs ordinaires telles quelles", () => {
    expect(csvCell("Douala")).toBe("Douala");
    expect(csvCell(3)).toBe("3");
    expect(csvCell(null)).toBe("");
  });

  it("commence par le BOM et sépare les colonnes par « ; »", () => {
    const csv = toCsv(["Nom", "Ville"], [["Fotso", "Yaoundé"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe("﻿Nom;Ville\r\nFotso;Yaoundé\r\n");
  });
});

describe("rafraîchissement de session après changement de mot de passe", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET ??= "secret-de-test";
  });

  it("accepte une preuve émise par le serveur", () => {
    const data = { sessionRefresh: buildSessionRefresh("user-1", 3) };
    expect(readSessionRefresh(data, "user-1")).toBe(3);
  });

  it("refuse une version choisie par le navigateur", () => {
    const forged = { sessionRefresh: { ...buildSessionRefresh("user-1", 3), version: 4 } };
    expect(readSessionRefresh(forged, "user-1")).toBeNull();
  });

  it("refuse la preuve d'un autre compte", () => {
    const data = { sessionRefresh: buildSessionRefresh("user-2", 3) };
    expect(readSessionRefresh(data, "user-1")).toBeNull();
  });

  it("ignore des données absentes ou mal formées", () => {
    expect(readSessionRefresh(undefined, "user-1")).toBeNull();
    expect(readSessionRefresh({ sessionRefresh: { version: "3" } }, "user-1")).toBeNull();
    expect(
      readSessionRefresh({ sessionRefresh: { version: 3, proof: "zz" } }, "user-1")
    ).toBeNull();
  });
});
