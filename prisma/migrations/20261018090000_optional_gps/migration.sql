-- La position GPS devient facultative : elle provient uniquement du bouton
-- « Me localiser », que le candidat peut ne pas utiliser.
ALTER TABLE "Profile" ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;
