"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, RefreshCw } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";
import { validatePdf } from "@/shared/validation/file";
import { confirmDocumentReplacement, prepareDocumentReplacement } from "../actions";

type CandidateDocument = { id: string; label: string; createdAt: Date };

/**
 * Pièces d'une candidature encore modifiable, chacune remplaçable par un
 * nouveau PDF. Le fichier part directement au stockage, comme au dépôt.
 */
export function ReplaceDocuments({
  requestId,
  documents,
}: {
  requestId: string;
  documents: CandidateDocument[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<CandidateDocument | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (documents.length === 0) return null;

  const pick = (doc: CandidateDocument) => {
    setTarget(doc);
    inputRef.current?.click();
  };

  const replace = async (file: File) => {
    const doc = target;
    if (!doc) return;

    const invalid = validatePdf(file);
    if (invalid) {
      showToast({ type: "error", message: invalid });
      return;
    }

    setPendingId(doc.id);
    try {
      const prepared = await prepareDocumentReplacement({
        requestId,
        documentId: doc.id,
        file: { name: file.name, size: file.size, type: file.type },
      });
      if (prepared.error || !prepared.uploadId || !prepared.signedUrl) {
        showToast({ type: "error", message: prepared.error ?? "Envoi impossible." });
        return;
      }

      const response = await fetch(prepared.signedUrl, {
        method: "PUT",
        headers: { "content-type": "application/pdf", "x-upsert": "true" },
        body: file,
      });
      if (!response.ok) {
        showToast({
          type: "error",
          message: "L'envoi du fichier a échoué. Vérifiez votre connexion et réessayez.",
        });
        return;
      }

      const result = await confirmDocumentReplacement({
        requestId,
        documentId: doc.id,
        uploadId: prepared.uploadId,
      });
      if (result.error) {
        showToast({ type: "error", message: result.error });
        return;
      }

      showToast({ type: "success", message: `« ${doc.label} » a été remplacé.` });
      router.refresh();
    } catch {
      showToast({
        type: "error",
        message: "Le remplacement a échoué. Vérifiez votre connexion et réessayez.",
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <details className="collapse collapse-arrow border border-base-300 bg-base-200/40">
      <summary className="collapse-title text-sm font-semibold min-h-0 py-2.5">
        Mes documents ({documents.length}) — remplacer une pièce
      </summary>
      <div className="collapse-content">
        <p className="text-xs text-base-content/60 mb-2">
          Possible tant que l&apos;équipe RH n&apos;a pas rendu sa décision. PDF
          uniquement, 2 Mo maximum.
        </p>
        <ul className="divide-y divide-base-300">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2"
            >
              <div className="flex items-start gap-2 min-w-0">
                <FileText className="w-4 h-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm">{doc.label}</p>
                  <p className="text-xs text-base-content/50">
                    Envoyé le {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-xs gap-1 self-start sm:self-auto shrink-0"
                disabled={pendingId !== null}
                onClick={() => pick(doc)}
              >
                {pendingId === doc.id ? (
                  <span className="loading loading-spinner loading-xs" aria-hidden="true" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {pendingId === doc.id ? "Envoi…" : "Remplacer"}
              </button>
            </li>
          ))}
        </ul>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Remise à zéro : choisir deux fois le même fichier doit relancer.
            event.target.value = "";
            if (file) void replace(file);
          }}
        />
      </div>
    </details>
  );
}
