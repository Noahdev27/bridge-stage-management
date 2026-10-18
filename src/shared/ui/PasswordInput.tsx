"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  /** Cadenas à gauche du champ (formulaires de connexion). */
  withIcon?: boolean;
  /** Bordure d'erreur DaisyUI. */
  invalid?: boolean;
  /** Classes du cadre, par exemple une taille (`input-sm`). */
  className?: string;
};

/**
 * Champ mot de passe avec bouton afficher / masquer.
 *
 * Accepte toutes les props d'un `<input>` (name, value, onChange, aria-*…) :
 * il se substitue à un `<input type="password">` dans n'importe quel
 * formulaire, contrôlé ou non. Le bouton est `type="button"` : sans cela, un
 * clic dessus soumettrait le formulaire.
 */
export function PasswordInput({
  withIcon = false,
  invalid = false,
  className = "",
  id,
  autoComplete = "current-password",
  placeholder = "••••••••",
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div
      className={`input flex items-center gap-2 w-full pr-1 ${
        invalid ? "input-error" : ""
      } ${className}`}
    >
      {withIcon && (
        <Lock className="w-4 h-4 text-base-content/50 shrink-0" aria-hidden="true" />
      )}
      <input
        {...inputProps}
        id={inputId}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        // Pas de correction ni de majuscule automatique sur mobile une fois
        // le mot de passe affiché en clair.
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="grow min-w-0"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="btn btn-ghost btn-xs btn-square shrink-0"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        aria-controls={inputId}
      >
        {visible ? (
          <EyeOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
