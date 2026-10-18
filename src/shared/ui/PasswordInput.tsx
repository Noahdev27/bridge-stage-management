"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps {
  id: string;
  name: string;
  autoComplete?: "current-password" | "new-password";
  placeholder?: string;
  required?: boolean;
}

/**
 * Champ mot de passe avec bouton afficher / masquer.
 *
 * Le bouton est `type="button"` : sans cela, un clic dessus soumettrait le
 * formulaire de connexion.
 */
export function PasswordInput({
  id,
  name,
  autoComplete = "current-password",
  placeholder = "••••••••",
  required = true,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input flex items-center gap-2 w-full pr-1">
      <Lock className="w-4 h-4 text-base-content/50 shrink-0" aria-hidden="true" />
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
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
        className="btn btn-ghost btn-sm btn-square shrink-0"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        aria-controls={id}
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
