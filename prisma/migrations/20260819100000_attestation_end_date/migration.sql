-- AlterTable
-- Date de fin effective du stage + référence figée de l'attestation.
ALTER TABLE "InternshipRequest" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "attestationRef" TEXT,
ADD COLUMN     "attestationIssuedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "InternshipRequest_attestationRef_key" ON "InternshipRequest"("attestationRef");
