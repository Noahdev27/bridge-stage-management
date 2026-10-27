import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { REJECTED_PURGE_MONTHS } from "@/shared/constants/domain";

export const metadata = {
  title: "Confidentialité - Bridge Stage Management",
  description:
    "Comment Bridge Technologies Solutions traite les données des candidats à un stage.",
};

/**
 * Information des candidats sur le traitement de leurs données.
 *
 * Chaque affirmation de cette page décrit un comportement réel de
 * l'application (purge à 6 mois, retrait, suppression du compte…) : la
 * modifier suppose de modifier le code correspondant, et inversement.
 */
export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-base-200 px-4 py-10">
      <article className="max-w-3xl mx-auto bg-base-100 border border-base-300 rounded-box p-6 sm:p-10 space-y-8">
        <div>
          <Link
            href="/"
            className="text-sm link link-hover text-primary inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Accueil
          </Link>
          <h1 className="text-3xl font-bold text-secondary mt-4">
            Confidentialité de vos données
          </h1>
          <p className="text-base-content/60 mt-2">
            Ce que nous faisons des informations que vous nous confiez en
            postulant à un stage.
          </p>
        </div>

        <Section title="Qui traite vos données">
          <p>
            <strong>Bridge Technologies Solutions sarl</strong> (RC/DLA/2021/B/2649),
            B.P. 1418 Douala, Cameroun. Pour toute question sur vos données :{" "}
            <a href="mailto:contact@bridgetech-solutions.com" className="link link-primary">
              contact@bridgetech-solutions.com
            </a>
            .
          </p>
        </Section>

        <Section title="Les données collectées">
          <ul>
            <li>Votre identité et vos coordonnées : nom, prénom, email, téléphone.</li>
            <li>
              Votre domicile (lieu-dit) et, si vous utilisez le bouton « Me
              localiser », votre position GPS.
            </li>
            <li>
              Le numéro de téléphone de deux proches à contacter en cas de
              besoin. Vous devez les avoir informés avant de les indiquer.
            </li>
            <li>Votre parcours : établissement, filière, niveau d&apos;études.</li>
            <li>Le stage souhaité : type, durée, date de début.</li>
            <li>
              Les documents de votre dossier (CV, lettre, pièce d&apos;identité,
              diplômes ou certificat de scolarité, plan de localisation).
            </li>
          </ul>
        </Section>

        <Section title="Pourquoi nous les utilisons">
          <p>
            Uniquement pour étudier votre candidature, vous informer de la
            décision, organiser votre stage s&apos;il est accepté et vous
            délivrer votre attestation de stage. Elles ne sont ni vendues, ni
            cédées, ni utilisées à des fins commerciales.
          </p>
        </Section>

        <Section title="Qui peut les consulter">
          <p>
            L&apos;équipe des ressources humaines et les administrateurs de la
            plateforme. Le tuteur qui vous est affecté consulte votre seul
            dossier. Les documents sont stockés dans un espace privé : ils ne
            sont accessibles qu&apos;après connexion, par des liens temporaires.
          </p>
        </Section>

        <Section title="Combien de temps nous les gardons">
          <ul>
            <li>
              <strong>Candidature refusée</strong> : effacée automatiquement,
              documents compris, {REJECTED_PURGE_MONTHS} mois après la décision.
            </li>
            <li>
              <strong>Candidature acceptée</strong> : conservée le temps
              nécessaire au déroulement du stage, à la délivrance de votre
              attestation et à sa vérification.
            </li>
            <li>
              <strong>Candidature en attente</strong> : jusqu&apos;à la décision,
              ou jusqu&apos;à ce que vous la retiriez.
            </li>
          </ul>
        </Section>

        <Section title="Vos droits">
          <ul>
            <li>
              <strong>Retirer une candidature</strong> en attente : depuis votre
              espace candidat. Le dossier et ses documents sont alors effacés.
            </li>
            <li>
              <strong>Supprimer votre compte</strong> : depuis votre espace
              candidat.
            </li>
            <li>
              <strong>Accéder à vos données, les rectifier ou demander leur
              effacement</strong> : écrivez-nous à l&apos;adresse ci-dessus.
            </li>
          </ul>
        </Section>

        <Section title="Vérification des attestations">
          <p>
            Chaque attestation porte un code de vérification. Toute personne
            qui le saisit, par exemple l&apos;école ou l&apos;employeur à qui
            vous la remettez, voit seulement votre nom, le type et la période
            du stage, la référence et la date de délivrance.
          </p>
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 text-base-content/80 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
      <h2 className="text-lg font-bold text-secondary">{title}</h2>
      {children}
    </section>
  );
}
