import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucketName = process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "[supabase] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant — l'upload de fichiers échouera. Voir .env.example."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseServiceKey ?? "", {
  auth: { persistSession: false },
});

export const DOCUMENTS_BUCKET = storageBucketName;

/**
 * Durée de vie d'une URL de lecture. Volontairement courte : l'URL n'est plus
 * stockée en base mais re-signée à chaque consultation via /api/documents/[id].
 */
const SIGNED_URL_TTL_SECONDS = 5 * 60;

export type StoredDocument = {
  storagePath: string;
  signedUrl: string;
};

function getFileExtension(file: File): string {
  const rawExtension = file.name.split(".").pop() ?? "pdf";
  return rawExtension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "pdf";
}

function buildSafeFileName(fileNameHint: string): string {
  return (
    fileNameHint
      .normalize("NFD")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "document"
  );
}

function buildStoragePath(
  folderPath: string,
  fileNameHint: string,
  extension: string
): string {
  return `${folderPath}/${buildSafeFileName(fileNameHint)}.${extension}`;
}

export async function createSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw new Error(`Échec de création de l'URL de lecture : ${error.message}`);
  }

  return data.signedUrl;
}

export async function uploadDocument(
  file: File,
  folderPath: string,
  fileNameHint: string
): Promise<StoredDocument> {
  const storagePath = buildStoragePath(
    folderPath,
    fileNameHint,
    getFileExtension(file)
  );

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, { contentType: "application/pdf", upsert: false });

  if (uploadError) throw new Error(`Échec de l'upload : ${uploadError.message}`);

  const signedUrl = await createSignedUrl(storagePath);
  return { storagePath, signedUrl };
}

/**
 * Téléverse une image de griffe (signature, cachet) en écrasant la précédente.
 *
 * `upsert` est volontaire, à l'inverse des pièces jointes candidat : il n'y a
 * qu'une griffe courante, remplacer doit vraiment remplacer.
 */
export async function uploadImage(
  file: File,
  storagePath: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: true });

  if (error) throw new Error(`Échec de l'upload : ${error.message}`);

  return storagePath;
}

/**
 * Lit un fichier du bucket et le renvoie en `data:` URI.
 *
 * L'attestation est imprimée, parfois longtemps après son ouverture : une URL
 * signée aurait expiré entre-temps et laissé un cadre vide à la place du cachet.
 * Inliner l'image rend le document autonome.
 */
export async function downloadAsDataUri(
  storagePath: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    console.error(
      `[supabase] Échec de lecture de ${storagePath}:`,
      error?.message
    );
    return null;
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const mime = data.type || "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function moveDocument(
  fromPath: string,
  toFolderPath: string
): Promise<StoredDocument> {
  const fileName = fromPath.split("/").pop();
  if (!fileName) {
    throw new Error("Chemin de fichier invalide.");
  }

  const storagePath = `${toFolderPath}/${fileName}`;
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .move(fromPath, storagePath);

  if (error) throw new Error(`Échec du déplacement : ${error.message}`);

  const signedUrl = await createSignedUrl(storagePath);
  return { storagePath, signedUrl };
}

export async function deleteStoragePaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths);
  if (error) {
    console.error("[supabase] Échec de suppression:", error.message);
  }
}

export function extractStoragePathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(
      /\/storage\/v1\/object\/(?:sign|public)\/[^/]+\/(.+)$/
    );
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function deleteRequestDocumentsFolder(
  requestId: string,
  createdAt: Date
): Promise<void> {
  const datePrefix = `${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
  const folderPath = `candidatures/${datePrefix}/${requestId}`;

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .list(folderPath);

  if (error) {
    console.error("[supabase] Échec du listage:", error.message);
    return;
  }

  const paths = (data ?? [])
    .filter((item) => item.name)
    .map((item) => `${folderPath}/${item.name}`);

  await deleteStoragePaths(paths);
}

/** Emplacement d'envoi direct : le navigateur y dépose le fichier lui-même. */
export type UploadSlot = {
  storagePath: string;
  signedUrl: string;
};

/**
 * Crée une adresse d'envoi signée, à usage unique, pour un chemin donné.
 *
 * Les fichiers des candidats ne transitent plus par le serveur de
 * l'application : Vercel refuse toute requête de plus de 4,5 Mo, alors qu'un
 * dossier complet peut atteindre 12 Mo. Le navigateur envoie chaque PDF
 * directement à Supabase, et le serveur ne reçoit que les chemins.
 */
export async function createUploadSlot(storagePath: string): Promise<UploadSlot> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new Error(`Échec de création de l'emplacement d'envoi : ${error?.message}`);
  }

  return { storagePath, signedUrl: data.signedUrl };
}

export type StoredFileInfo = {
  size: number;
  /** Le fichier commence par la signature binaire d'un PDF (`%PDF-`). */
  isPdf: boolean;
};

/**
 * Inspecte un fichier déposé par le navigateur.
 *
 * L'envoi direct échappe aux contrôles du serveur : taille et nature réelle
 * du fichier sont donc revérifiées ici, à partir de son contenu et non de ce
 * que le navigateur a déclaré.
 *
 * Seuls les 5 premiers octets sont lus (requête partielle) : télécharger les
 * 6 PDF d'un dossier en entier prenait plusieurs secondes chacun.
 * @returns `null` si le fichier n'existe pas.
 */
export async function inspectStoredFile(
  storagePath: string
): Promise<StoredFileInfo | null> {
  const bucket = supabase.storage.from(DOCUMENTS_BUCKET);
  const [info, signed] = await Promise.all([
    bucket.info(storagePath),
    bucket.createSignedUrl(storagePath, 60),
  ]);

  if (info.error || !info.data || signed.error || !signed.data) return null;

  const response = await fetch(signed.data.signedUrl, {
    headers: { Range: "bytes=0-4" },
  });
  if (!response.ok) return null;

  const head = new Uint8Array(await response.arrayBuffer()).slice(0, 5);
  const signature = String.fromCharCode(...head);

  return { size: info.data.size ?? 0, isPdf: signature === "%PDF-" };
}

/**
 * Supprime les dossiers d'envoi temporaires abandonnés.
 *
 * Un candidat qui quitte le formulaire après l'envoi des fichiers mais avant
 * la validation laisse ses PDF dans `temp/`. Le cron quotidien les retire une
 * fois passé le délai de grâce.
 * @returns le nombre de fichiers supprimés.
 */
export async function purgeStaleUploads(maxAgeHours = 24): Promise<number> {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  const { data: folders, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .list("temp", { limit: 1000 });

  if (error || !folders) return 0;

  const stale: string[] = [];
  for (const folder of folders) {
    const { data: files } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .list(`temp/${folder.name}`, { limit: 100 });

    for (const file of files ?? []) {
      const created = file.created_at ? Date.parse(file.created_at) : 0;
      if (created < cutoff) stale.push(`temp/${folder.name}/${file.name}`);
    }
  }

  await deleteStoragePaths(stale);
  return stale.length;
}

/** Chemin de stockage d'un document, dérivé de son libellé. */
export function documentPathFor(folder: string, label: string): string {
  return buildStoragePath(folder, label, "pdf");
}
