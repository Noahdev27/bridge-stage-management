"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { SuccessScreen } from "@/features/candidature/components/SuccessScreen";
import {
  parseConfirmationHandoff,
  readConfirmationHandoffRaw,
} from "@/features/candidature/confirmation-handoff";

/**
 * `sessionStorage` ne change pas pendant la vie de cette page : on ne s'abonne
 * à rien. `useSyncExternalStore` sert ici uniquement à lire une source
 * client-only sans divergence d'hydratation — l'instantané serveur vaut `null`,
 * puis React rerend avec la valeur réelle.
 */
const NOOP_UNSUBSCRIBE = () => {};
const subscribeToNothing = () => NOOP_UNSUBSCRIBE;
const getServerSnapshot = () => null;
const getHydratedOnClient = () => true;
const getHydratedOnServer = () => false;

/**
 * Page de confirmation servie sur son propre URL : le formulaire n'est plus
 * monté, donc un rafraîchissement ou un retour arrière ne peut pas renvoyer la
 * candidature une seconde fois.
 */
export default function CandidatureConfirmationPage() {
  const router = useRouter();

  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    getHydratedOnClient,
    getHydratedOnServer
  );
  // Instantané volontairement brut (string) : stable d'un appel à l'autre.
  const raw = useSyncExternalStore(
    subscribeToNothing,
    readConfirmationHandoffRaw,
    getServerSnapshot
  );
  const handoff = useMemo(
    () => (raw ? parseConfirmationHandoff(raw) : null),
    [raw]
  );

  // Accès direct sans candidature en cours : rien à confirmer.
  useEffect(() => {
    if (isHydrated && !handoff) {
      router.replace("/candidature");
    }
  }, [isHydrated, handoff, router]);

  if (!handoff) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <span
          className="loading loading-spinner loading-lg text-primary"
          role="status"
          aria-label="Chargement de votre confirmation"
        />
      </main>
    );
  }

  return (
    <SuccessScreen trackingCode={handoff.trackingCode} email={handoff.email} />
  );
}
