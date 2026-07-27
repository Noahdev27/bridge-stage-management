"use client";

import { useState, useActionState, useRef, useEffect } from "react";
import type { InternshipType } from "@prisma/client";
import {
  UserRound,
  GraduationCap,
  FileText,
  ClipboardCheck,
  ArrowLeft,
  ArrowRight,
  Send,
} from "lucide-react";
import { submitCandidature, type ActionState } from "../actions";
import { step1InfosSchema, step2ParcoursSchema } from "../schema";
import type { Step1InfosInput, Step2ParcoursInput } from "../schema";
import { StepInfos } from "./StepInfos";
import { StepParcours } from "./StepParcours";
import { StepDocuments } from "./StepDocuments";
import { StepValidation } from "./StepValidation";
import { SuccessScreen } from "./SuccessScreen";
import { CandidatureFormSkeleton } from "./CandidatureFormSkeleton";
import { useToast } from "@/shared/ui/ToastProvider";
import { REQUIRED_DOCUMENTS } from "@/shared/constants/domain";

export type CurrentStep = 1 | 2 | 3 | 4;

export function CandidatureForm({ offerId }: { offerId?: string }) {
  // État du formulaire multi-étapes
  const [currentStep, setCurrentStep] = useState<CurrentStep>(1);

  // État des données
  const [step1Data, setStep1Data] = useState<Partial<Step1InfosInput>>({});
  const [step2Data, setStep2Data] = useState<Partial<Step2ParcoursInput>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(
    new Map()
  );

  // État des erreurs de validation
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  // Ref du formulaire pour avoir accès au FormData
  const formRef = useRef<HTMLFormElement>(null);

  // État de la Server Action
  const [actionState, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(submitCandidature, {});
  const { showToast } = useToast();

  useEffect(() => {
    if (actionState.error && !isPending) {
      showToast({ type: "error", message: actionState.error });
    }
  }, [actionState.error, isPending, showToast]);

  // Gestion du changement de champ (étape 1)
  const handleStep1Change = (field: keyof Step1InfosInput, value: string) => {
    const newData = { ...step1Data, [field]: value };
    setStep1Data(newData);
    
    // Seulement afficher l'erreur pour ce champ spécifique
    if (step1Errors[field]) {
      // Valider juste ce champ pour nettoyer le message d'erreur si c'est bon
      const testData = { ...step1Data, [field]: value };
      const result = step1InfosSchema.safeParse(testData);
      if (result.success || !result.error.issues.some(issue => issue.path[0] === field)) {
        // Nettoyer l'erreur pour ce champ
        const newErrors = { ...step1Errors };
        delete newErrors[field];
        setStep1Errors(newErrors);
      }
    }
  };

  // Gestion du changement de champ (étape 2)
  const handleStep2Change = (
    field: keyof Step2ParcoursInput,
    value: string | boolean
  ) => {
    const newData = { ...step2Data, [field]: value };
    setStep2Data(newData);
    
    // Seulement afficher l'erreur pour ce champ spécifique
    if (step2Errors[field]) {
      // Valider juste ce champ pour nettoyer le message d'erreur si c'est bon
      const testData = { ...step2Data, [field]: value };
      const result = step2ParcoursSchema.safeParse(testData);
      if (result.success || !result.error.issues.some(issue => issue.path[0] === field)) {
        // Nettoyer l'erreur pour ce champ
        const newErrors = { ...step2Errors };
        delete newErrors[field];
        setStep2Errors(newErrors);
      }
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
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formRef.current) return;

    // Créer un FormData avec les données de toutes les étapes
    const formData = new FormData(formRef.current);

    // Ajouter les données step1
    Object.entries(step1Data).forEach(([key, value]) => {
      formData.set(key, String(value));
    });

    // Ajouter les données step2
    Object.entries(step2Data).forEach(([key, value]) => {
      formData.set(
        key,
        typeof value === "boolean" ? (value ? "true" : "false") : String(value)
      );
    });

    // Ajouter les fichiers
    uploadedFiles.forEach((file, label) => {
      const key = `documents_${label.replace(/\s+/g, "_")}`;
      formData.append(key, file);
    });

    if (offerId) {
      formData.set("offerId", offerId);
    }

    await formAction(formData);
  };

  // Si succès, afficher l'écran de confirmation
  if (actionState.success && actionState.trackingCode) {
    return (
      <SuccessScreen
        trackingCode={actionState.trackingCode}
        email={step1Data.email}
      />
    );
  }

  if (isPending) {
    return <CandidatureFormSkeleton />;
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl mx-auto">
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
            "Uploadez les documents requis pour votre candidature."}
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
            disabled={!isDossierComplete || isPending}
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
