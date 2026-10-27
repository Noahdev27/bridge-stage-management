"use client";

import { CloudUpload, FileCheck2, LoaderCircle, ShieldCheck } from "lucide-react";

export type SubmissionStage =
  | { kind: "prepare" }
  | { kind: "upload"; current: number; total: number; label: string }
  | { kind: "save" };

/**
 * Avancement de l'envoi du dossier.
 *
 * Remplace le squelette générique : déposer 5 ou 6 PDF sur une connexion
 * mobile prend plusieurs dizaines de secondes, et sans indication le candidat
 * croit la page bloquée et la recharge — perdant son envoi.
 */
export function SubmissionProgress({ stage }: { stage: SubmissionStage }) {
  const percent =
    stage.kind === "prepare"
      ? 5
      : stage.kind === "upload"
        ? 5 + Math.round(((stage.current - 1) / stage.total) * 85)
        : 95;

  const steps = [
    { key: "prepare", label: "Préparation", icon: ShieldCheck },
    { key: "upload", label: "Envoi des documents", icon: CloudUpload },
    { key: "save", label: "Enregistrement", icon: FileCheck2 },
  ] as const;
  const activeIndex = steps.findIndex((s) => s.key === stage.kind);

  return (
    <div
      className="max-w-lg mx-auto rounded-box border border-base-300 bg-base-100 p-6 sm:p-8 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <LoaderCircle className="w-6 h-6 text-primary animate-spin shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-bold text-secondary">Envoi de votre candidature…</p>
          <p className="text-sm text-base-content/60 truncate">
            {stage.kind === "prepare" && "Vérification de votre dossier."}
            {stage.kind === "upload" &&
              `Document ${stage.current} sur ${stage.total} : ${stage.label}`}
            {stage.kind === "save" && "Création de votre dossier."}
          </p>
        </div>
      </div>

      <progress
        className="progress progress-primary w-full mt-6"
        value={percent}
        max={100}
        aria-label="Progression de l'envoi"
      />

      <ol className="mt-6 grid grid-cols-3 gap-2 text-center">
        {steps.map(({ key, label, icon: Icon }, index) => {
          const state =
            index < activeIndex ? "done" : index === activeIndex ? "active" : "todo";
          return (
            <li key={key} className="flex flex-col items-center gap-1.5">
              <span
                className={`grid place-items-center w-9 h-9 rounded-full ${
                  state === "done"
                    ? "bg-success/15 text-success"
                    : state === "active"
                      ? "bg-primary/15 text-primary"
                      : "bg-base-200 text-base-content/40"
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>
              <span
                className={`text-xs ${
                  state === "todo" ? "text-base-content/40" : "text-base-content/80 font-medium"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 text-xs text-center text-base-content/50">
        Ne fermez pas cette page pendant l&apos;envoi.
      </p>
    </div>
  );
}
