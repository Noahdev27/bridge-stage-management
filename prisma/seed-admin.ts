import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Identifiants lus depuis l'environnement — NE JAMAIS committer de vrais
  // identifiants en dur. Définir ADMIN_EMAIL et ADMIN_PASSWORD dans le .env
  // (ex. `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed:admin`).
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans le .env pour créer le compte admin."
    );
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD doit contenir au moins 8 caractères.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {}, // Si l'admin existe déjà, on ne modifie rien
    create: {
      email,
      password: hashedPassword,
      name: "Administrateur",
      role: "ADMIN",
      // Compte provisionné : la confirmation par email ne concerne que
      // l'auto-inscription des candidats.
      emailVerifiedAt: new Date(),
    },
  });

  console.log("✅ Admin créé avec succès :", admin.email);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });