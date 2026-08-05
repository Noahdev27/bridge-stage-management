-- Réinitialisation du mot de passe par lien envoyé à l'adresse du compte.
-- Seul le hash du jeton est stocké : une fuite de la base ne doit pas permettre
-- de changer le mot de passe d'un compte.
ALTER TABLE "User" ADD COLUMN     "passwordResetTokenHash" TEXT,
                  ADD COLUMN     "passwordResetTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_passwordResetTokenHash_key" ON "User"("passwordResetTokenHash");
