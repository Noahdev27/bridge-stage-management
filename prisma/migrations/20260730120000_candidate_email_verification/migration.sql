-- Vérification de l'adresse email des comptes candidats.
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
                  ADD COLUMN     "verificationTokenHash" TEXT,
                  ADD COLUMN     "verificationTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_verificationTokenHash_key" ON "User"("verificationTokenHash");

-- Les comptes du back-office sont créés par un administrateur : leur adresse
-- n'a pas à être auto-vérifiée par le titulaire. Les comptes CANDIDATE déjà
-- présents restent non vérifiés (ils n'ont jamais prouvé détenir l'adresse) et
-- devront passer par « Renvoyer l'email de vérification ».
UPDATE "User" SET "emailVerifiedAt" = CURRENT_TIMESTAMP WHERE "role" <> 'CANDIDATE';
