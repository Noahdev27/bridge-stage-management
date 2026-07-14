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

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

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

async function createSignedUrl(storagePath: string): Promise<string> {
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
