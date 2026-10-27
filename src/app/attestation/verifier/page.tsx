import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BadgeCheck, SearchX, ShieldCheck } from "lucide-react";
import {
  findAttestationByVerifyCode,
  VERIFY_CODE_LENGTH,
} from "@/features/attestation/queries";
import {
  formatTrackingCode,
  normalizeTrackingCode,
} from "@/shared/tracking/tracking-code";
import { TYPE_LABELS } from "@/shared/constants/domain";
import {
  RATE_LIMITS,
  consumeRateLimit,
  currentClientIp,
  formatRetryAfter,
} from "@/shared/security/rate-limit";

export const metadata = {
  title: "Vérifier une attestation de stage - Bridge",
  description:
    "Confirmez l'authenticité d'une attestation de stage délivrée par Bridge Technologies Solutions.",
};

// La page dépend du code saisi : jamais servie depuis un cache partagé.
export const dynamic = "force-dynamic";

const LONG_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

type Lookup =
  | { state: "empty" }
  | { state: "invalid" }
  | { state: "limited"; retry: string }
  | { state: "notFound" }
  | {
      state: "found";
      name: string;
      type: string;
      period: string;
      reference: string;
      issuedAt: string | null;
    };

async function lookup(rawCode: string | undefined): Promise<Lookup> {
  if (!rawCode) return { state: "empty" };

  const code = normalizeTrackingCode(rawCode);
  if (code.length !== VERIFY_CODE_LENGTH) return { state: "invalid" };

  const limit = await consumeRateLimit(
    RATE_LIMITS.attestationCheckPerIp,
    await currentClientIp()
  );
  if (!limit.allowed) {
    return { state: "limited", retry: formatRetryAfter(limit.retryAfterSeconds) };
  }

  const attestation = await findAttestationByVerifyCode(code);
  if (!attestation?.endDate || !attestation.attestationRef) {
    return { state: "notFound" };
  }

  return {
    state: "found",
    name: `${attestation.profile.firstName} ${attestation.profile.lastName}`,
    type: TYPE_LABELS[attestation.type],
    period: `du ${attestation.startDate.toLocaleDateString("fr-FR", LONG_DATE)} au ${attestation.endDate.toLocaleDateString("fr-FR", LONG_DATE)}`,
    reference: attestation.attestationRef,
    issuedAt: attestation.attestationIssuedAt
      ? attestation.attestationIssuedAt.toLocaleDateString("fr-FR", LONG_DATE)
      : null,
  };
}

/**
 * Vérification publique d'une attestation de stage.
 *
 * Destinée aux tiers à qui le stagiaire remet son attestation (école,
 * employeur) : le QR code imprimé sur le document mène ici, code déjà
 * renseigné. La page confirme les mentions essentielles, sans rien exposer
 * d'autre du dossier.
 */
export default async function VerifierAttestationPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const result = await lookup(code);

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <Link href="/" aria-label="Accueil Bridge">
            <Image
              src="/logo-bridge.png"
              alt="Bridge Technologies Solutions"
              width={150}
              height={48}
              priority
              className="h-10 w-auto mx-auto"
            />
          </Link>
        </div>

        <div className="card bg-base-100 border border-base-300 shadow-xl">
          <div className="card-body p-6 sm:p-8 gap-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-7 h-7 text-primary shrink-0" aria-hidden="true" />
              <div>
                <h1 className="text-xl font-bold text-secondary">
                  Vérifier une attestation de stage
                </h1>
                <p className="text-sm text-base-content/60">
                  Saisissez le code imprimé en bas de l&apos;attestation, ou
                  scannez son QR code.
                </p>
              </div>
            </div>

            <form method="get" className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="code" className="sr-only">
                Code de vérification
              </label>
              <input
                id="code"
                name="code"
                defaultValue={code ?? ""}
                placeholder="Ex : ABCD-EFGH-JKMN"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="input w-full font-mono uppercase tracking-wider"
                required
              />
              <button type="submit" className="btn btn-primary">
                Vérifier
              </button>
            </form>

            <div aria-live="polite">
              {result.state === "found" && (
                <div className="rounded-box border border-success/40 bg-success/10 p-5">
                  <p className="flex items-center gap-2 font-bold text-success">
                    <BadgeCheck className="w-5 h-5" aria-hidden="true" />
                    Attestation authentique
                  </p>
                  <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                    <dt className="text-base-content/60">Stagiaire</dt>
                    <dd className="font-semibold">{result.name}</dd>
                    <dt className="text-base-content/60">Stage</dt>
                    <dd className="font-semibold">{result.type}</dd>
                    <dt className="text-base-content/60">Période</dt>
                    <dd className="font-semibold">{result.period}</dd>
                    <dt className="text-base-content/60">Référence</dt>
                    <dd className="font-semibold">{result.reference}</dd>
                    {result.issuedAt && (
                      <>
                        <dt className="text-base-content/60">Délivrée le</dt>
                        <dd className="font-semibold">{result.issuedAt}</dd>
                      </>
                    )}
                  </dl>
                  <p className="mt-4 text-xs text-base-content/60">
                    Comparez ces mentions avec le document présenté : elles
                    doivent être identiques.
                  </p>
                </div>
              )}

              {(result.state === "notFound" || result.state === "invalid") && (
                <div className="rounded-box border border-error/40 bg-error/10 p-5">
                  <p className="flex items-center gap-2 font-bold text-error">
                    <SearchX className="w-5 h-5" aria-hidden="true" />
                    Aucune attestation ne correspond
                  </p>
                  <p className="mt-2 text-sm text-base-content/70">
                    {result.state === "invalid"
                      ? `Le code de vérification compte ${VERIFY_CODE_LENGTH} caractères. Vérifiez votre saisie.`
                      : "Vérifiez le code saisi. Si le doute persiste, contactez la Direction des Ressources Humaines de Bridge Technologies Solutions."}
                  </p>
                  {code && result.state === "notFound" && (
                    <p className="mt-2 text-xs font-mono text-base-content/50">
                      Code recherché : {formatTrackingCode(normalizeTrackingCode(code))}
                    </p>
                  )}
                </div>
              )}

              {result.state === "limited" && (
                <div className="rounded-box border border-warning/40 bg-warning/10 p-5 text-sm">
                  Trop de vérifications depuis votre connexion. Réessayez {result.retry}.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm link link-hover text-base-content/60 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Retour au site
          </Link>
        </div>
      </div>
    </main>
  );
}
