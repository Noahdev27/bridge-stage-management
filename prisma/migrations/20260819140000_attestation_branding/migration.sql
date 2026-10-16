-- CreateTable
-- Table à ligne unique : la griffe de signature et le cachet valent pour toute
-- l'entreprise. Seuls les chemins Supabase sont stockés, pas les images.
CREATE TABLE "AttestationSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "signaturePath" TEXT,
    "stampPath" TEXT,
    "updatedByEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttestationSettings_pkey" PRIMARY KEY ("id")
);
