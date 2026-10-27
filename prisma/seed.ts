import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Ce seed crée des comptes de démonstration au mot de passe public
  // (« password123 », cité dans la documentation). Lancé par erreur sur la base
  // de production — vers laquelle pointe le .env du projet —, il ouvrirait le
  // back-office à n'importe qui. Il exige donc un accord explicite.
  if (process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error(
      "Seed de démonstration refusé. Il crée des comptes au mot de passe public : " +
        "à réserver à une base locale de test, avec ALLOW_DEMO_SEED=true. " +
        "Pour créer l'administrateur de production, utilisez npm run db:seed:admin."
    );
  }

  const password = await bcrypt.hash("password123", 10);

  // Comptes du back-office : vérifiés d'office (la confirmation par email ne
  // concerne que l'auto-inscription des candidats).
  const emailVerifiedAt = new Date();

  await prisma.user.upsert({
    where: { email: "rh@bridge.test" },
    update: { emailVerifiedAt },
    create: {
      email: "rh@bridge.test",
      password,
      name: "RH Démo",
      role: "ADMIN",
      emailVerifiedAt,
    },
  });

  await prisma.user.upsert({
    where: { email: "tuteur@bridge.test" },
    update: { role: "TUTOR", emailVerifiedAt },
    create: {
      email: "tuteur@bridge.test",
      password,
      name: "Tuteur Démo",
      role: "TUTOR",
      emailVerifiedAt,
    },
  });

  const offers = [
    {
      title: "Stage développement web",
      description:
        "Participez au développement d'applications Next.js au sein de l'équipe produit.",
      department: "DEVELOPMENT" as const,
      type: "ACADEMIC" as const,
      durationMonths: 2,
    },
    {
      title: "Stage UI / UX Design",
      description:
        "Concevez des interfaces claires et accessibles pour nos produits Bridge.",
      department: "DESIGN" as const,
      type: "PROFESSIONAL" as const,
      durationMonths: 3,
    },
    {
      title: "Stage data & analytics",
      description:
        "Analysez les indicateurs RH et construisez des tableaux de bord métiers.",
      department: "DATA" as const,
      type: "ACADEMIC" as const,
      durationMonths: 1,
    },
  ];

  for (const offer of offers) {
    const existing = await prisma.internshipOffer.findFirst({
      where: { title: offer.title },
    });
    if (!existing) {
      await prisma.internshipOffer.create({ data: offer });
    }
  }

  console.log("Seed OK → rh@bridge.test / tuteur@bridge.test (password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
