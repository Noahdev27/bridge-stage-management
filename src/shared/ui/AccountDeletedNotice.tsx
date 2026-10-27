"use client";

import { useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";

/**
 * Confirmation affichée après la suppression d'un compte candidat.
 *
 * Lue côté client : si l'accueil lisait lui-même la query string, il cesserait
 * d'être mis en cache et interrogerait la base à chaque visite.
 */
export function AccountDeletedNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("compte") !== "supprime") return null;

  return (
    <div className="bg-success/10 border-b border-success/30" role="status">
      <p className="max-w-6xl mx-auto px-4 sm:px-6 py-3 text-sm flex items-center gap-2">
        <CircleCheck className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
        Votre compte candidat a bien été supprimé.
      </p>
    </div>
  );
}
