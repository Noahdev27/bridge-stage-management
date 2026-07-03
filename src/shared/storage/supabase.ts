import { createClient } from "@supabase/supabase-js";

// Client Supabase côté SERVEUR uniquement (utilise la service role key).
// À n'importer QUE dans des Server Actions / Route Handlers, jamais côté client.
//
// Cf. cahier des charges : Supabase est utilisé pour le STOCKAGE des documents.
// Les données relationnelles (candidats, demandes, ...) restent dans PostgreSQL via Prisma.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucketName = process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

if (!supabaseUrl || !supabaseServiceKey) {
  // En dev, on prévient clairement le stagiaire si la config manque.
  console.warn(
    "[supabase] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant — l'upload de fichiers échouera. Voir .env.example."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseServiceKey ?? "", {
  auth: { persistSession: false },
});

/** Nom du bucket Supabase où sont stockés les documents des candidats. */
export const DOCUMENTS_BUCKET = storageBucketName;

/**
 * Téléverse un fichier PDF dans Supabase Storage et renvoie une URL de
 * lecture signée (bucket privé — documents candidats sensibles / RGPD).
 *
 * Le fichier est rangé sous `folderPath/nom-du-document.pdf` : le nom vient
 * du LIBELLÉ du document (ex. "CV à jour"), pas du nom de fichier fourni par
 * le candidat, pour que le classement reste lisible et prévisible.
 *
 * @param file         Le fichier à téléverser (déjà validé : PDF, <= 2 Mo).
 * @param folderPath   Dossier de destination (ex. "candidatures/2026/07/A7B2K9M1").
 * @param fileNameHint Nom lisible pour le fichier (ex. le libellé du document).
 */
export async function uploadDocument(
  file: File,
  folderPath: string,
  fileNameHint: string
): Promise<string> {
  // Extension prise sur le fichier d'origine, assainie (jamais de traversée
  // de chemin ni de caractère spécial — le nom du client n'est pas fiable).
  const rawExtension = file.name.split(".").pop() ?? "pdf";
  const extension = rawExtension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "pdf";

  // Décompose les accents (NFD) puis ne garde que des caractères alphanumériques :
  // "CV à jour" -> "cv-a-jour". Les runs non-alphanumériques (accents, espaces,
  // apostrophes...) sont naturellement fusionnés en un seul "-".
  const safeFileName =
    fileNameHint
      .normalize("NFD")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "document";

  const path = `${folderPath}/${safeFileName}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    // Le type MIME du client n'est pas fiable : on impose "application/pdf",
    // déjà garanti par validatePdf() en amont.
    .upload(path, file, { contentType: "application/pdf", upsert: false });

  if (uploadError) throw new Error(`Échec de l'upload : ${uploadError.message}`);

  const { data, error: signedUrlError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (signedUrlError) {
    throw new Error(`Échec de création de l'URL de lecture : ${signedUrlError.message}`);
  }

  return data.signedUrl;
}
