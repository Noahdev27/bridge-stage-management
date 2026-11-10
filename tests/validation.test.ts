import { describe, expect, it } from "vitest";
import { looksLikePdf, validatePdf } from "@/shared/validation/file";
import { MAX_FILE_SIZE } from "@/shared/constants/domain";
import { step1InfosSchema, step2ParcoursSchema } from "@/features/candidature/schema";
import { staffResetConfirmSchema } from "@/features/reinitialisation-rh/schema";

function fakeFile(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validation des PDF", () => {
  it("accepte un PDF déclaré comme tel", () => {
    expect(looksLikePdf("cv.pdf", "application/pdf")).toBe(true);
  });

  it("accepte un PDF au type vide, comme certains navigateurs mobiles", () => {
    expect(looksLikePdf("CV.PDF", "")).toBe(true);
  });

  it("refuse une image, même renommée en .pdf", () => {
    expect(looksLikePdf("cv.pdf", "image/png")).toBe(false);
  });

  it("refuse un fichier de plus de 2 Mo", () => {
    expect(validatePdf(fakeFile("cv.pdf", "application/pdf", MAX_FILE_SIZE + 1))).toMatch(/2 Mo/);
  });

  it("refuse un fichier vide", () => {
    expect(validatePdf(fakeFile("cv.pdf", "application/pdf", 0))).toMatch(/vide/);
  });

  it("accepte un PDF de 2 Mo pile", () => {
    expect(validatePdf(fakeFile("cv.pdf", "application/pdf", MAX_FILE_SIZE))).toBeNull();
  });
});

describe("position GPS facultative", () => {
  const { latitude, longitude } = step1InfosSchema.shape;

  it.each([undefined, null, ""])("accepte une position absente (%s)", (value) => {
    expect(latitude.safeParse(value).success).toBe(true);
  });

  it("convertit la virgule décimale", () => {
    expect(latitude.parse("4,05")).toBe(4.05);
  });

  it("refuse une latitude hors bornes, en français", () => {
    const result = latitude.safeParse("123");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/comprise entre -90 et 90/);
  });

  it("refuse un texte, en français", () => {
    const result = longitude.safeParse("abc");
    expect(result.error?.issues[0].message).toBe("Coordonnée invalide.");
  });
});

describe("parcours et durée minimale", () => {
  const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const base = {
    school: "Université de Douala",
    field: "Génie informatique",
    level: "L3",
    startDate: future,
    reportRequired: false,
  };

  it("exige 3 mois pour un stage professionnel", () => {
    const result = step2ParcoursSchema.safeParse({ ...base, internshipType: "PROFESSIONAL", duration: "2" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/au moins 3 mois/);
  });

  it("accepte 1 mois pour un stage académique", () => {
    expect(
      step2ParcoursSchema.safeParse({ ...base, internshipType: "ACADEMIC", duration: "1" }).success
    ).toBe(true);
  });

  it("refuse une date de début passée", () => {
    const result = step2ParcoursSchema.safeParse({
      ...base,
      internshipType: "ACADEMIC",
      duration: "2",
      startDate: "2020-01-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("code de réinitialisation du back-office", () => {
  const base = {
    email: "  RH@Bridge.test ",
    password: "nouveau-mdp-1",
    confirmPassword: "nouveau-mdp-1",
  };

  it("accepte un code copié avec une espace et normalise l'email", () => {
    const result = staffResetConfirmSchema.parse({ ...base, code: "123 456" });
    expect(result).toMatchObject({ code: "123456", email: "rh@bridge.test" });
  });

  it("garde les zéros de tête", () => {
    expect(staffResetConfirmSchema.parse({ ...base, code: "000042" }).code).toBe("000042");
  });

  it.each(["12345", "1234567", "12a456", ""])("refuse le code « %s »", (code) => {
    const result = staffResetConfirmSchema.safeParse({ ...base, code });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Le code comporte 6 chiffres.");
  });

  it("refuse deux mots de passe différents", () => {
    const result = staffResetConfirmSchema.safeParse({
      ...base,
      code: "123456",
      confirmPassword: "autre-chose",
    });
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });
});
