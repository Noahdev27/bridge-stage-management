-- Renvoi du code de suivi par email depuis /suivi.
-- Horodatage du dernier envoi : le formulaire est public, ce palier empêche
-- de s'en servir pour inonder la boîte mail d'un tiers.
ALTER TABLE "Profile" ADD COLUMN "trackingCodeSentAt" TIMESTAMP(3);
