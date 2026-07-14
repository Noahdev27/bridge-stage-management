-- CreateEnum
CREATE TYPE "Department" AS ENUM ('DEVELOPMENT', 'DESIGN', 'MARKETING', 'NETWORK', 'DATA', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'TUTOR';
ALTER TYPE "Role" ADD VALUE 'CANDIDATE';

-- AlterTable
ALTER TABLE "InternshipRequest" ADD COLUMN     "offerId" TEXT,
ADD COLUMN     "tutorId" TEXT;

-- CreateTable
CREATE TABLE "InternshipOffer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "type" "InternshipType" NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternshipOffer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InternshipRequest" ADD CONSTRAINT "InternshipRequest_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipRequest" ADD CONSTRAINT "InternshipRequest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "InternshipOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
