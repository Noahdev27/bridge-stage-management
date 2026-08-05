-- AlterTable
-- Commentaire facultatif de la RH lors de l'acceptation ou du refus d'un
-- dossier. Repris dans l'email de changement de statut et conservé pour que la
-- RH puisse relire la décision communiquée au candidat.
ALTER TABLE "InternshipRequest" ADD COLUMN     "decisionComment" TEXT;
