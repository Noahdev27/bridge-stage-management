import Link from "next/link";
import { CircleCheck, CircleX, Clock, ArrowLeft } from "lucide-react";
import {
  consumeEmailVerification,
  type VerificationOutcome,
} from "@/features/compte-candidat/verification";

interface VerificationPageProps {
  searchParams: Promise<{ token?: string }>;
}

const MESSAGES: Record<
  VerificationOutcome,
  { title: string; detail: string; tone: "success" | "error" | "warning" }
> = {
  verified: {
    title: "Adresse confirmée",
    detail:
      "Votre compte est activé. Vous pouvez vous connecter pour retrouver vos dossiers.",
    tone: "success",
  },
  "already-verified": {
    title: "Adresse déjà confirmée",
    detail: "Ce compte est actif. Vous pouvez vous connecter directement.",
    tone: "success",
  },
  expired: {
    title: "Lien expiré",
    detail:
      "Ce lien a dépassé sa durée de validité de 24 heures. Demandez un nouvel envoi depuis la page de connexion.",
    tone: "warning",
  },
  invalid: {
    title: "Lien invalide",
    detail:
      "Ce lien est incorrect ou a déjà été utilisé. Demandez un nouvel envoi depuis la page de connexion.",
    tone: "error",
  },
};

const ICONS = {
  success: CircleCheck,
  warning: Clock,
  error: CircleX,
} as const;

const TONE_CLASSES = {
  success: "text-success bg-success/15",
  warning: "text-warning bg-warning/15",
  error: "text-error bg-error/15",
} as const;

export default async function VerificationPage({
  searchParams,
}: VerificationPageProps) {
  const { token } = await searchParams;
  const outcome = await consumeEmailVerification(token ?? "");
  const { title, detail, tone } = MESSAGES[outcome];
  const Icon = ICONS[tone];

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/"
          className="text-sm link link-primary inline-flex gap-1 items-center"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Accueil
        </Link>

        <div className="card bg-base-100 border border-base-300 shadow-xl">
          <div className="card-body items-center text-center gap-3">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${TONE_CLASSES[tone]}`}
            >
              <Icon className="w-9 h-9" aria-hidden="true" />
            </div>

            <h1 className="card-title text-secondary">{title}</h1>
            <p className="text-sm text-base-content/70">{detail}</p>

            <Link href="/candidat/login" className="btn btn-primary mt-2 w-full">
              Aller à la connexion
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
