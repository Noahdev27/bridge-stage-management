"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Stamp, PenLine, Trash2, Upload } from "lucide-react";
import {
  removeAttestationBranding,
  uploadAttestationBranding,
  type AttestationActionState,
  type BrandingSlot,
} from "../actions";
import { validateSignatureImage } from "@/shared/validation/file";
import { useToast } from "@/shared/ui/ToastProvider";

interface BrandingSlotCardProps {
  slot: BrandingSlot;
  title: string;
  hint: string;
  /** Aperçu de la griffe installée, en `data:` URI. */
  preview: string | null;
}

function BrandingSlotCard({ slot, title, hint, preview }: BrandingSlotCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isRemoving, startRemoving] = useTransition();
  const { showToast } = useToast();

  const boundUpload = uploadAttestationBranding.bind(null, slot);
  const [state, formAction, isPending] = useActionState<
    AttestationActionState,
    FormData
  >(boundUpload, {});

  const Icon = slot === "signature" ? PenLine : Stamp;

  // Même contrôle que côté serveur, pour éviter un aller-retour inutile.
  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      setLocalError(null);
      return;
    }
    const error = validateSignatureImage(file);
    setLocalError(error);
    setFileName(error ? null : file.name);
    if (error) event.target.value = "";
  };

  const handleRemove = () => {
    if (!window.confirm(`Retirer ${title.toLowerCase()} des attestations ?`)) {
      return;
    }
    startRemoving(async () => {
      const result = await removeAttestationBranding(slot);
      if (result.error) {
        showToast({ type: "error", message: result.error });
        return;
      }
      showToast({ type: "success", message: `${title} retiré.` });
    });
  };

  return (
    <div className="rounded-box border border-base-300 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
        <h3 className="font-semibold">{title}</h3>
      </div>

      <div className="h-28 rounded-lg border border-dashed border-base-300 bg-base-200/40 grid place-items-center overflow-hidden">
        {preview ? (
          // Balise native : la source est une `data:` URI, que next/image ne
          // sait pas traiter et qu'il n'y a de toute façon rien à optimiser.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={`Aperçu : ${title.toLowerCase()}`}
            className="max-h-24 w-auto object-contain"
          />
        ) : (
          <span className="text-xs text-base-content/40">Aucune image</span>
        )}
      </div>

      <p className="text-xs text-base-content/50">{hint}</p>

      <form action={formAction} className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleSelect}
          className="file-input file-input-bordered file-input-sm w-full"
          aria-label={`Choisir une image pour ${title.toLowerCase()}`}
        />

        {(localError || state.error) && (
          <p className="text-xs text-error">{localError ?? state.error}</p>
        )}
        {state.success && !isPending && !fileName && (
          <p className="text-xs text-success">Image enregistrée.</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="btn btn-primary btn-sm flex-1 gap-1.5"
            disabled={isPending || !!localError || !fileName}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            {isPending ? "Envoi…" : "Téléverser"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isRemoving}
              className="btn btn-ghost btn-sm text-error gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Retirer
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

interface AttestationBrandingFormProps {
  signaturePreview: string | null;
  stampPreview: string | null;
  updatedByEmail: string | null;
  updatedAt: Date | null;
}

export function AttestationBrandingForm({
  signaturePreview,
  stampPreview,
  updatedByEmail,
  updatedAt,
}: AttestationBrandingFormProps) {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-5 gap-4">
        <div className="border-b border-base-200 pb-3">
          <h2 className="card-title text-lg">Signature et cachet</h2>
          <p className="text-sm text-base-content/60 mt-1">
            Ces images sont apposées sur chaque attestation de stage délivrée,
            sous la mention «&nbsp;La Direction.&nbsp;». Laissez-les vides pour
            continuer à signer les documents à la main.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BrandingSlotCard
            slot="signature"
            title="Signature"
            hint="PNG à fond transparent recommandé, 1 Mo maximum."
            preview={signaturePreview}
          />
          <BrandingSlotCard
            slot="stamp"
            title="Cachet"
            hint="PNG à fond transparent recommandé, 1 Mo maximum."
            preview={stampPreview}
          />
        </div>

        {updatedAt && (
          <p className="text-xs text-base-content/40">
            Dernière modification le{" "}
            {new Date(updatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {updatedByEmail ? ` par ${updatedByEmail}` : ""}.
          </p>
        )}
      </div>
    </div>
  );
}
