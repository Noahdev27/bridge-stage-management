"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, MailCheck, Search, Home, Info } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";

interface SuccessScreenProps {
  email?: string;
}

/**
 * Le code de suivi n'est volontairement pas affiché ici : il n'est communiqué
 * que par l'email de confirmation. Un code visible à l'écran se retrouve sur la
 * capture d'écran d'un poste partagé ou sous les yeux du voisin de salle
 * informatique, alors qu'il donne à lui seul accès au dossier via `/suivi`.
 * L'email fait aussi office de conservation : le candidat le retrouve des
 * semaines plus tard, contrairement à un onglet fermé.
 */
export function SuccessScreen({ email }: SuccessScreenProps) {
  const { showToast } = useToast();
  const hasAnnouncedSuccess = useRef(false);

  useEffect(() => {
    if (hasAnnouncedSuccess.current) return;
    hasAnnouncedSuccess.current = true;
    showToast({ type: "success", message: "Candidature envoyée avec succès !" });
  }, [showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/15 text-success">
            <CheckCircle2 className="w-11 h-11" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-secondary mb-3 text-balance">
          Candidature envoyée !
        </h1>
        <p className="text-base-content/60 mb-6">
          Merci pour votre candidature. Notre équipe RH va l&apos;examiner
          rapidement.
        </p>

        <div className="rounded-box border border-primary/30 bg-primary/5 p-6 mb-6 text-left">
          <p className="flex items-center gap-2 font-semibold text-secondary mb-2">
            <MailCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
            Consultez votre boîte mail
          </p>
          <p className="text-sm text-base-content/70">
            Votre <strong>code de suivi</strong> vient d&apos;être envoyé à{" "}
            {email ? (
              <strong className="break-all">{email}</strong>
            ) : (
              "l'adresse indiquée dans votre dossier"
            )}
            . C&apos;est lui qui vous permettra de consulter l&apos;état de votre
            candidature.
          </p>
          <p className="text-xs text-base-content/50 mt-3">
            L&apos;email peut mettre quelques minutes à arriver. Pensez à
            vérifier vos courriers indésirables.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/suivi" className="btn btn-primary gap-2">
            <Search className="w-4 h-4" aria-hidden="true" />
            Suivre ma candidature
          </Link>
          <Link href="/" className="btn btn-outline gap-2">
            <Home className="w-4 h-4" aria-hidden="true" />
            Retourner à l&apos;accueil
          </Link>
        </div>

        <div className="mt-8 rounded-box bg-base-200/60 p-4 text-left">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-base-content/70 mb-2">
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            À retenir
          </p>
          <ul className="text-xs text-base-content/60 space-y-1 list-disc list-inside">
            <li>
              Conservez l&apos;email : il contient le seul exemplaire de votre
              code de suivi.
            </li>
            <li>Ce code est unique et non transférable.</li>
            <li>Notre équipe reviendra vers vous sous 5 à 10 jours ouvrables.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
