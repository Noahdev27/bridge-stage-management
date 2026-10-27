import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  FileText,
  GraduationCap,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { getPublishedOffers } from "@/features/offres/queries";
import { AccountDeletedNotice } from "@/shared/ui/AccountDeletedNotice";
import {
  DEPARTMENT_LABELS,
  MIN_DURATION_MONTHS,
  REQUIRED_DOCUMENTS,
  TYPE_LABELS,
} from "@/shared/constants/domain";

// Les offres ouvertes sont lues en base : la page est régénérée au plus toutes
// les 5 minutes, et aussitôt qu'une offre est créée ou modifiée.
export const revalidate = 300;

/** Le parcours réel d'un stagiaire, du dépôt à l'attestation. */
const JOURNEY = [
  {
    title: "Dépôt du dossier",
    text: "Formulaire en 4 étapes et pièces jointes en PDF.",
  },
  {
    title: "Étude par la RH",
    text: "Votre code de suivi arrive par email.",
  },
  {
    title: "Décision",
    text: "Vous êtes prévenu(e) par email, avec un message de l'équipe.",
  },
  {
    title: "Le stage",
    text: "Un tuteur vous accompagne au sein de l'équipe.",
  },
  {
    title: "L'attestation",
    text: "Téléchargeable depuis votre espace, vérifiable par QR code.",
  },
];

export default async function Home() {
  const offers = await getPublishedOffers();
  const featured = offers.slice(0, 3);

  return (
    <main className="min-h-dvh bg-base-100 flex flex-col">
      <header className="border-b border-base-300 bg-base-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Accueil Bridge Technologies Solutions">
            <Image
              src="/logo-bridge.png"
              alt="Bridge Technologies Solutions"
              width={150}
              height={48}
              priority
              className="h-9 sm:h-10 w-auto"
            />
          </Link>
          <nav aria-label="Navigation principale" className="flex items-center gap-1 sm:gap-2">
            <Link href="/offres" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              Offres
            </Link>
            <Link href="/suivi" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              Suivre ma demande
            </Link>
            <Link href="/candidat/login" className="btn btn-ghost btn-sm gap-1.5">
              <UserRound className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Espace candidat</span>
            </Link>
            <Link href="/candidature" className="btn btn-primary btn-sm">
              Postuler
            </Link>
          </nav>
        </div>
      </header>

      <Suspense fallback={null}>
        <AccountDeletedNotice />
      </Suspense>

      {/* Accroche + offres ouvertes */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Stages chez Bridge Technologies Solutions
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-secondary leading-[1.1] text-balance">
            Du dépôt de votre dossier à votre attestation de stage.
          </h1>
          <p className="mt-6 text-lg text-base-content/70 max-w-xl">
            Stage académique dès 1 mois, stage professionnel dès 3 mois. Vous
            postulez en ligne, suivez votre dossier et récupérez votre
            attestation au même endroit.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/offres" className="btn btn-primary btn-lg gap-2">
              Voir les offres
              {offers.length > 0 && (
                <span className="badge badge-sm bg-primary-content/20 border-0 text-primary-content">
                  {offers.length}
                </span>
              )}
            </Link>
            <Link href="/candidature" className="btn btn-outline btn-lg">
              Candidature spontanée
            </Link>
          </div>
        </div>

        <div className="rounded-box border border-base-300 bg-base-200/50">
          <div className="flex items-center justify-between px-5 py-4 border-b border-base-300">
            <h2 className="font-bold text-secondary">Offres ouvertes</h2>
            <span className="text-xs text-base-content/60 tabular-nums">
              {offers.length} offre{offers.length > 1 ? "s" : ""}
            </span>
          </div>
          {featured.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-base-content/70">
                Aucune offre n&apos;est publiée en ce moment.
              </p>
              <p className="text-sm text-base-content/70 mt-1">
                Les candidatures spontanées restent ouvertes.
              </p>
              <Link href="/candidature" className="btn btn-primary btn-sm mt-5">
                Postuler spontanément
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-base-300">
              {featured.map((offer) => (
                <li key={offer.id}>
                  <Link
                    href={`/candidature?offerId=${offer.id}`}
                    className="group flex items-center gap-4 px-5 py-4 hover:bg-base-100 transition-colors"
                  >
                    <span className="grid place-items-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                      {offer.type === "ACADEMIC" ? (
                        <GraduationCap className="w-5 h-5" aria-hidden="true" />
                      ) : (
                        <Briefcase className="w-5 h-5" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-base-content truncate">
                        {offer.title}
                      </span>
                      <span className="block text-xs text-base-content/60 mt-0.5">
                        {DEPARTMENT_LABELS[offer.department]} · {TYPE_LABELS[offer.type]} ·{" "}
                        {offer.durationMonths} mois min.
                      </span>
                    </span>
                    <ArrowRight
                      className="w-4 h-4 text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {offers.length > featured.length && (
            <Link
              href="/offres"
              className="flex items-center justify-center gap-1.5 px-5 py-3 border-t border-base-300 text-sm font-semibold text-primary hover:bg-base-100 transition-colors rounded-b-box"
            >
              Voir les {offers.length} offres
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      {/* Parcours : un arc, en écho au pont du logo */}
      <section className="bg-secondary text-secondary-content">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold">Votre parcours, d&apos;une rive à l&apos;autre</h2>
          <p className="mt-3 text-secondary-content/70 max-w-2xl">
            Chaque étape est visible depuis votre espace ou avec votre code de
            suivi. Rien ne se passe sans que vous en soyez informé(e).
          </p>

          <div className="relative mt-12 hidden lg:block" aria-hidden="true">
            <svg viewBox="0 0 1000 90" className="w-full h-auto" preserveAspectRatio="none">
              <path
                d="M 100 85 Q 500 -55 900 85"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.35"
                strokeWidth="2"
              />
              <path
                d="M 100 85 Q 500 -25 900 85"
                fill="none"
                stroke="#78C2E1"
                strokeWidth="2"
              />
            </svg>
          </div>

          <ol className="mt-8 lg:-mt-4 grid gap-8 lg:gap-6 lg:grid-cols-5">
            {JOURNEY.map((step, index) => (
              <li key={step.title} className="flex lg:flex-col gap-4 lg:gap-3 lg:text-center lg:items-center">
                <span className="grid place-items-center w-10 h-10 rounded-full bg-accent text-accent-content font-bold tabular-nums shrink-0">
                  {index + 1}
                </span>
                <span>
                  <span className="block font-semibold">{step.title}</span>
                  <span className="block text-sm text-secondary-content/70 mt-1">
                    {step.text}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pièces à préparer */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-secondary">
            Préparez vos pièces avant de commencer
          </h2>
          <p className="mt-3 text-base-content/70">
            Chaque document est demandé en PDF, 2 Mo au maximum. Le formulaire
            ne peut être envoyé qu&apos;avec un dossier complet.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {(["ACADEMIC", "PROFESSIONAL"] as const).map((type) => (
            <div key={type} className="rounded-box border border-base-300 p-6">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                  {type === "ACADEMIC" ? (
                    <GraduationCap className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Briefcase className="w-5 h-5" aria-hidden="true" />
                  )}
                </span>
                <div>
                  <h3 className="font-bold text-secondary">
                    Stage {TYPE_LABELS[type].toLowerCase()}
                  </h3>
                  <p className="text-xs text-base-content/60">
                    {MIN_DURATION_MONTHS[type]} mois minimum
                  </p>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5">
                {REQUIRED_DOCUMENTS[type].map((doc) => (
                  <li key={doc} className="flex items-start gap-2.5 text-sm">
                    <FileText className="w-4 h-4 mt-0.5 text-primary shrink-0" aria-hidden="true" />
                    <span className="text-base-content/80">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Accès rapides */}
      <section className="border-t border-base-300 bg-base-200/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-3 gap-4">
          <QuickLink
            href="/suivi"
            icon={Search}
            title="Suivre ma demande"
            text="Avec le code reçu par email."
          />
          <QuickLink
            href="/candidat/login"
            icon={KeyRound}
            title="Espace candidat"
            text="Toutes vos candidatures et votre attestation."
          />
          <QuickLink
            href="/attestation/verifier"
            icon={BadgeCheck}
            title="Vérifier une attestation"
            text="Pour les écoles et les employeurs."
          />
        </div>
      </section>

      <footer className="mt-auto bg-secondary text-secondary-content">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-bold">Bridge Technologies Solutions sarl</p>
            <p className="text-sm text-secondary-content/70 mt-1 italic">
              We drive your digital transformation
            </p>
          </div>
          <ul className="space-y-2 text-sm text-secondary-content/80">
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
              B.P. 1418 Douala, Cameroun
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
              679 28 91 66 / 692 14 38 11
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
              <a href="mailto:contact@bridgetech-solutions.com" className="link link-hover">
                contact@bridgetech-solutions.com
              </a>
            </li>
          </ul>
          <ul className="space-y-2 text-sm text-secondary-content/80">
            <li>
              <Link href="/confidentialite" className="link link-hover">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link href="/attestation/verifier" className="link link-hover">
                Vérifier une attestation
              </Link>
            </li>
            <li>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-secondary-content/50 hover:text-secondary-content transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Espace RH
              </Link>
            </li>
          </ul>
        </div>
        <div className="border-t border-secondary-content/15">
          <p className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-secondary-content/50 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
            RC/DLA/2021/B/2649
          </p>
        </div>
      </footer>
    </main>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  text,
}: {
  href: string;
  icon: typeof Search;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-box border border-base-300 bg-base-100 p-5 hover:border-primary/50 transition-colors"
    >
      <Icon className="w-5 h-5 mt-0.5 text-primary shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <span className="flex items-center gap-1 font-semibold text-base-content">
          {title}
          <ArrowRight
            className="w-3.5 h-3.5 text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition"
            aria-hidden="true"
          />
        </span>
        <span className="block text-sm text-base-content/60 mt-0.5">{text}</span>
      </span>
    </Link>
  );
}
