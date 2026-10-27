"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Department, InternshipType } from "@prisma/client";
import {
  UserRound,
  GraduationCap,
  FileText,
  ClipboardCheck,
  ArrowLeft,
  ArrowRight,
  Send,
  Briefcase,
} from "lucide-react";
import { prepareCandidatureUpload, submitCandidature } from "../actions";
import { step1InfosSchema, step2ParcoursSchema } from "../schema";
import type { Step1InfosInput, Step2ParcoursInput } from "../schema";
import { StepInfos } from "./StepInfos";
import { StepParcours } from "./StepParcours";
import { StepDocuments } from "./StepDocuments";
import { StepValidation } from "./StepValidation";
import { SuccessScreen } from "./SuccessScreen";
import { CandidatureFormSkeleton } from "./CandidatureFormSkeleton";
import { writeConfirmationHandoff } from "../confirmation-handoff";
import { useToast } from "@/shared/ui/ToastProvider";
import {
  DEPARTMENT_LABELS,
  REQUIRED_DOCUMENTS,
  TYPE_LABELS,
} from "@/shared/constants/domain";
import { SubmissionProgress, type SubmissionStage } from "./SubmissionProgress";

export type CurrentStep = 1 | 2 | 3 | 4;

/** Offre à laquelle le candidat répond (absente pour une candidature spontanée). */
export type OfferSummary = {
  id: string;
  title: string;
  department: Department;
  type: InternshipType;
  durationMonths: number;
};

export function CandidatureForm({ offer }: { offer?: OfferSummary | null }) {
  // État du formulaire multi-étapes
  const [currentStep, setCurrentStep] = useState<CurrentStep>(1);

  // État des données
  const [step1Data, setStep1Data] = useState<Partial<Step1InfosInput>>({});
  // Une offre fixe le type de stage : il est prérempli et verrouillé.
  const [step2Data, setStep2Data] = useState<Partial<Step2ParcoursInput>>(
    offer ? { internshipType: offer.type } : {}
  );
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(
    new Map()
  );

  // État des erreurs de validation
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  // Ref du formulaire pour avoir accès au FormData
  const formRef = useRef<HTMLFormElement>(null);

  const { showToast } = useToast();
  const router = useRouter();

  /**
   * La Server Action est appelée directement plutôt que via `useActionState` :
   * on dispose ainsi du code de suivi dans le gestionnaire d'événement, ce qui
   * permet d'enchaîner écriture du relais et redirection sans passer par un
   * effet réagissant à l'état de retour.
   */
  const [isPending, startTransition] = useTransition();
  // "sent" survit à l'attente de la redirection : le formulaire ne doit pas
  // réapparaître entre la fin de l'action et l'arrivée sur la confirmation.
  const [phase, setPhase] = useState<"idle" | "sent">("idle");
  // Repli si sessionStorage est indisponible : la confirmation reste affichée
  // ici plutôt que de rebondir sur une page qui renverrait au formulaire.
  const [showInlineConfirmation, setShowInlineConfirmation] = useState(false);
  const [inlineEmailSent, setInlineEmailSent] = useState(true);
  // Avancement visible de l'envoi : sur une connexion mobile lente, déposer
  // 6 PDF prend du temps, et un écran figé incite à recharger la page.
  const [stage, setStage] = useState<SubmissionStage | null>(null);
  const [consent, setConsent] = useState(false);

  // La page de confirmation est préchargée pendant que le candidat remplit le
  // formulaire : à l'envoi, la transition est immédiate.
  useEffect(() => {
    router.prefetch("/candidature/confirmation");
  }, [router]);

  // Gestion des changements de champ.
  //
  // Mises à jour fonctionnelles (`prev => …`) : le bouton « Me localiser »
  // écrit la latitude puis la longitude dans le même rappel. En repartant
  // d'une copie figée de l'état, la seconde écriture effaçait la première, et
  // la position n'était jamais enregistrée.
  const handleStep1Change = (field: keyof Step1InfosInput, value: string) => {
    setStep1Data((prev) => ({ ...prev, [field]: value }));

    // L'erreur affichée disparaît dès que le champ devient valide.
    if (step1Errors[field] && step1InfosSchema.shape[field].safeParse(value).success) {
      setStep1Errors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleStep2Change = (
    field: keyof Step2ParcoursInput,
    value: string | boolean
  ) => {
    setStep2Data((prev) => ({ ...prev, [field]: value }));

    if (step2Errors[field] && step2ParcoursSchema.shape[field].safeParse(value).success) {
      setStep2Errors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Validation complète de l'étape 1
  const validateStep1 = (): boolean => {
    const result = step1InfosSchema.safeParse(step1Data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0] as string] = issue.message;
      });
      setStep1Errors(errors);
      return false;
    }
    setStep1Errors({});
    return true;
  };

  // Validation complète de l'étape 2
  const validateStep2 = (): boolean => {
    const result = step2ParcoursSchema.safeParse(step2Data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0] as string] = issue.message;
      });
      setStep2Errors(errors);
      return false;
    }
    if (offer && Number(step2Data.duration) < offer.durationMonths) {
      setStep2Errors({
        duration: `Cette offre demande une durée d'au moins ${offer.durationMonths} mois.`,
      });
      return false;
    }
    setStep2Errors({});
    return true;
  };

  // Validation de l'étape 3 : le dossier doit être complet pour le type de
  // stage choisi (cf. Annexe A du cahier des charges), pas seulement non vide.
  const missingDocuments = ((): string[] => {
    const internshipType = step2Data.internshipType as InternshipType | undefined;
    if (!internshipType) return [];
    return REQUIRED_DOCUMENTS[internshipType].filter(
      (label) => !uploadedFiles.has(label)
    );
  })();

  const isDossierComplete =
    !!step2Data.internshipType && missingDocuments.length === 0;

  const validateStep3 = (): boolean => {
    if (isDossierComplete) return true;
    showToast({
      type: "error",
      message: `Dossier incomplet : ${missingDocuments.length} document(s) manquant(s).`,
    });
    return false;
  };

  // Navigation
  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(4);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as CurrentStep);
    }
  };

  // Gestion de la soumission du formulaire (étape 4)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Chaque envoi crée un dossier distinct côté serveur, et l'attente des
    // dépôts incite à recliquer : on verrouille jusqu'au retour de l'action.
    if (isPending || phase === "sent") return;

    const internshipType = step2Data.internshipType as InternshipType | undefined;
    if (!internshipType) return;

    const files = REQUIRED_DOCUMENTS[internshipType].map((label) => ({
      label,
      file: uploadedFiles.get(label),
    }));
    if (files.some((f) => !f.file)) return;
    if (!consent) {
      showToast({
        type: "error",
        message: "Veuillez accepter le traitement de vos données pour envoyer votre dossier.",
      });
      return;
    }

    const fields: Record<string, unknown> = {
      ...step1Data,
      ...step2Data,
      offerId: offer?.id,
      consent,
    };

    const fail = (message: string) => {
      setStage(null);
      showToast({ type: "error", message });
    };

    startTransition(async () => {
      try {
        // 1. Ouverture des emplacements de dépôt.
        setStage({ kind: "prepare" });
        const prepared = await prepareCandidatureUpload({
          internshipType,
          files: files.map(({ label, file }) => ({
            label,
            name: file!.name,
            size: file!.size,
            type: file!.type,
          })),
        });
        if (prepared.error || !prepared.uploadId || !prepared.slots) {
          return fail(prepared.error ?? "Impossible de préparer l'envoi.");
        }

        // 2. Dépôt direct de chaque PDF dans le stockage, un à la fois pour
        //    afficher une progression lisible et ménager les connexions lentes.
        for (const [index, slot] of prepared.slots.entries()) {
          setStage({
            kind: "upload",
            current: index + 1,
            total: prepared.slots.length,
            label: slot.label,
          });
          const file = uploadedFiles.get(slot.label);
          if (!file) return fail(`${slot.label} : fichier introuvable.`);

          const response = await fetch(slot.signedUrl, {
            method: "PUT",
            headers: {
              "content-type": "application/pdf",
              // Autorise un nouvel essai sur le même emplacement.
              "x-upsert": "true",
            },
            body: file,
          });
          if (!response.ok) {
            return fail(
              `L'envoi de « ${slot.label} » a échoué. Vérifiez votre connexion et réessayez.`
            );
          }
        }

        // 3. Création du dossier à partir des fichiers déposés.
        setStage({ kind: "save" });
        const result = await submitCandidature({
          uploadId: prepared.uploadId,
          fields,
        });

        if (result.error || !result.success) {
          return fail(result.error ?? "Erreur serveur. Veuillez réessayer.");
        }

        setPhase("sent");
        const emailSent = result.emailSent !== false;

        const stored = writeConfirmationHandoff({
          submitted: true,
          email: step1Data.email,
          emailSent,
        });

        if (!stored) {
          setInlineEmailSent(emailSent);
          setShowInlineConfirmation(true);
          return;
        }

        // On quitte /candidature pour une page dédiée : un F5 ou un retour
        // arrière ne retombe alors jamais sur le formulaire encore rempli.
        router.replace("/candidature/confirmation");
      } catch (error) {
        // Coupure réseau, serveur injoignable… : sans ce filet, l'erreur
        // remontait jusqu'à l'écran d'erreur générique de l'application.
        console.error("[candidature] Échec de l'envoi :", error);
        fail(
          "La connexion a été interrompue pendant l'envoi. Vos informations sont conservées : réessayez."
        );
      }
    });
  };

  // sessionStorage indisponible : la confirmation reste affichée sur place.
  if (showInlineConfirmation) {
    return <SuccessScreen email={step1Data.email} emailSent={inlineEmailSent} />;
  }

  // On garde le squelette jusqu'à ce que la redirection ait effectivement lieu :
  // sans cela, le formulaire réapparaîtrait brièvement après un envoi réussi.
  if (phase === "sent") {
    return <CandidatureFormSkeleton />;
  }

  if (isPending && stage) {
    return <SubmissionProgress stage={stage} />;
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {offer && (
        <div className="mb-8 flex items-start gap-3 rounded-box border border-primary/30 bg-primary/5 p-4">
          <Briefcase className="w-5 h-5 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Vous postulez à l&apos;offre
            </p>
            <p className="font-bold text-secondary">{offer.title}</p>
            <p className="text-sm text-base-content/60">
              {DEPARTMENT_LABELS[offer.department]} · Stage{" "}
              {TYPE_LABELS[offer.type].toLowerCase()} · {offer.durationMonths} mois
              minimum
            </p>
          </div>
        </div>
      )}

      {/* Indicateur de progression */}
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 mx-1 rounded-full ${
                step === currentStep
                  ? "bg-primary"
                  : step < currentStep
                    ? "bg-success"
                    : "bg-base-300"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-base-content/60">
          <span>Infos</span>
          <span>Parcours</span>
          <span>Documents</span>
          <span>Validation</span>
        </div>
      </div>

      {/* Titre de l'étape */}
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold mb-2">
          {currentStep === 1 && (
            <>
              <UserRound className="w-6 h-6 text-primary" aria-hidden="true" />
              Vos informations personnelles
            </>
          )}
          {currentStep === 2 && (
            <>
              <GraduationCap className="w-6 h-6 text-primary" aria-hidden="true" />
              Votre parcours et le stage
            </>
          )}
          {currentStep === 3 && (
            <>
              <FileText className="w-6 h-6 text-primary" aria-hidden="true" />
              Vos documents
            </>
          )}
          {currentStep === 4 && (
            <>
              <ClipboardCheck className="w-6 h-6 text-primary" aria-hidden="true" />
              Vérification finale
            </>
          )}
        </h2>
        <p className="text-base-content/60">
          {currentStep === 1 &&
            "Commençons par vos informations de contact."}
          {currentStep === 2 &&
            "Parlez-nous de votre formation et du stage souhaité."}
          {currentStep === 3 &&
            "Ajoutez les documents requis pour votre candidature."}
          {currentStep === 4 &&
            "Vérifiez vos informations avant d'envoyer."}
        </p>
      </div>

      {/* Contenu de l'étape */}
      <div className="mb-8">
        {/* Étape 1 */}
        {currentStep === 1 && (
          <StepInfos
            data={step1Data}
            onChange={handleStep1Change}
            errors={step1Errors}
          />
        )}

        {/* Étape 2 */}
        {currentStep === 2 && (
          <StepParcours
            data={step2Data}
            onChange={handleStep2Change}
            errors={step2Errors}
            lockedType={offer?.type}
            offerMinDuration={offer?.durationMonths}
          />
        )}

        {/* Étape 3 */}
        {currentStep === 3 && (
          <StepDocuments
            internshipType={step2Data.internshipType as InternshipType | undefined}
            onFilesChange={setUploadedFiles}
            uploadedFiles={uploadedFiles}
          />
        )}

        {/* Étape 4 */}
        {currentStep === 4 && (
          <StepValidation
            step1={step1Data}
            step2={step2Data}
            uploadedFilesCount={uploadedFiles.size}
            consent={consent}
            onConsentChange={setConsent}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="btn btn-outline flex-1 gap-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Précédent
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary flex-1 gap-2"
          >
            Suivant
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!isDossierComplete || !consent || isPending}
            className="btn btn-success flex-1 gap-2"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            Envoyer ma candidature
          </button>
        )}
      </div>
    </form>
  );
}
