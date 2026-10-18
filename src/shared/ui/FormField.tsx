"use client";

import { useId, type ReactNode } from "react";

/** Attributs à poser sur le contrôle pour le relier à son libellé et à son erreur. */
export type FieldControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
};

interface FormFieldProps {
  label: ReactNode;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Champ de formulaire : libellé au-dessus, contrôle pleine largeur, aide et
 * erreur en dessous.
 *
 * Remplace le motif « form-control / label-text » de DaisyUI 4, supprimé en
 * DaisyUI 5 : sans lui, `.label` est en ligne et les libellés se plaçaient à
 * côté des champs au lieu d'au-dessus. Le libellé est relié au contrôle
 * (`htmlFor`) et l'erreur annoncée aux lecteurs d'écran (`aria-describedby`).
 */
export function FormField({
  label,
  required,
  error,
  hint,
  className = "",
  children,
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold text-base-content">
        {label}
        {required && (
          <span className="text-error ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-invalid": !!error,
        "aria-describedby": describedBy,
      })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-base-content/55">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Titre de groupe de champs, pour structurer les étapes longues. */
export function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1">
        <span className="block text-base font-bold text-secondary">{title}</span>
        {description && (
          <span className="block text-sm text-base-content/60 mt-0.5">
            {description}
          </span>
        )}
      </legend>
      {children}
    </fieldset>
  );
}
