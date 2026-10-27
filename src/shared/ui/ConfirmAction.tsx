"use client";

import { useId, useRef, useTransition, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";

type ActionResult = { error?: string; success?: boolean } | void;

interface ConfirmActionProps {
  /** Contenu du bouton qui ouvre la confirmation. */
  trigger: ReactNode;
  triggerClassName?: string;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Action exécutée après confirmation. */
  onConfirm: () => Promise<ActionResult>;
  successMessage?: string;
}

/**
 * Bouton d'action irréversible, avec confirmation dans une boîte de dialogue.
 *
 * Plutôt que `window.confirm` : le texte est mis en forme, le bouton de
 * confirmation reste désactivé pendant l'exécution, et l'échec s'affiche sans
 * quitter la page. `<dialog>` gère nativement le focus et la touche Échap.
 */
export function ConfirmAction({
  trigger,
  triggerClassName = "btn btn-outline btn-error btn-sm",
  title,
  description,
  confirmLabel,
  onConfirm,
  successMessage,
}: ConfirmActionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const confirm = () => {
    startTransition(async () => {
      const result = await onConfirm();
      if (result?.error) {
        showToast({ type: "error", message: result.error });
        return;
      }
      dialogRef.current?.close();
      if (successMessage) showToast({ type: "success", message: successMessage });
    });
  };

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => dialogRef.current?.showModal()}
      >
        {trigger}
      </button>

      <dialog ref={dialogRef} className="modal" aria-labelledby={titleId}>
        <div className="modal-box">
          <h3 id={titleId} className="flex items-center gap-2 text-lg font-bold">
            <TriangleAlert className="w-5 h-5 text-error shrink-0" aria-hidden="true" />
            {title}
          </h3>
          <div className="py-4 text-sm text-base-content/80 space-y-2">{description}</div>
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => dialogRef.current?.close()}
              disabled={isPending}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-error"
              onClick={confirm}
              disabled={isPending}
            >
              {isPending ? "En cours…" : confirmLabel}
            </button>
          </div>
        </div>
        {/* Clic hors de la boîte : ferme sans rien faire. */}
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Fermer">fermer</button>
        </form>
      </dialog>
    </>
  );
}
