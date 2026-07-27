-- AlterTable
-- Conserve le chemin Supabase du document pour pouvoir re-signer une URL de
-- lecture à la demande (les URLs signées stockées dans `url` expirent).
ALTER TABLE "Document" ADD COLUMN     "storagePath" TEXT;
