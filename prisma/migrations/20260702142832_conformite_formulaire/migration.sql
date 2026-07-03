/*
  Warnings:

  - You are about to drop the `ExampleNote` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `lieudit` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relativePhone1` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relativePhone2` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "lieudit" TEXT NOT NULL,
ADD COLUMN     "relativePhone1" TEXT NOT NULL,
ADD COLUMN     "relativePhone2" TEXT NOT NULL;

-- DropTable
DROP TABLE "ExampleNote";
