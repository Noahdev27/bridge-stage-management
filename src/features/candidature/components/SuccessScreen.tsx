"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  MailCheck,
  Search,
  Home,
  Info,
} from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";

interface SuccessScreenProps {
  trackingCode: string;
  email?: string;
}

export function SuccessScreen({ trackingCode, email }: SuccessScreenProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const hasAnnouncedSuccess = useRef(false);

  useEffect(() => {
    if (hasAnnouncedSuccess.current) return;
    hasAnnouncedSuccess.current = true;
    showToast({ type: "success", message: "Candidature envoyée avec succès !" });
  }, [showToast]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      showToast({ type: "success", message: "Code de suivi copié." });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast({
        type: "error",
        message: "Impossible de copier le code de suivi.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/15 text-success">
            <CheckCircle2 className="w-11 h-11" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-secondary mb-3">
          Candidature envoyée !
        </h1>
        <p className="text-base-content/60 mb-6">
          Merci pour votre candidature. Notre équipe RH va l'examiner rapidement.
        </p>

        <div className="rounded-box border border-base-300 bg-base-100 p-6 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-3">
            Votre code de suivi
          </p>
          <div className="flex items-center justify-between gap-3">
            <code className="text-2xl font-mono font-bold tracking-widest text-primary">
              {trackingCode}
            </code>
            <button
              onClick={copyToClipboard}
              className="btn btn-sm btn-ghost gap-1.5"
              aria-label="Copier le code de suivi"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-success" aria-hidden="true" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  Copier
                </>
              )}
            </button>
          </div>
        </div>

        {email && (
          <div className="alert alert-info mb-6">
            <MailCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="text-left">
              Un email contenant votre code de suivi a été envoyé à{" "}
              <strong>{email}</strong>
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link href="/suivi" className="btn btn-primary gap-2">
            <Search className="w-4 h-4" aria-hidden="true" />
            Suivre ma candidature
          </Link>
          <Link href="/" className="btn btn-outline gap-2">
            <Home className="w-4 h-4" aria-hidden="true" />
            Retourner à l'accueil
          </Link>
        </div>

        <div className="mt-8 rounded-box bg-base-200/60 p-4 text-left">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-base-content/70 mb-2">
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            À retenir
          </p>
          <ul className="text-xs text-base-content/60 space-y-1 list-disc list-inside">
            <li>Votre code de suivi est unique et non transférable.</li>
            <li>Conservez-le pour consulter l'état de votre dossier.</li>
            <li>Notre équipe reviendra vers vous sous 5 à 10 jours ouvrables.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
