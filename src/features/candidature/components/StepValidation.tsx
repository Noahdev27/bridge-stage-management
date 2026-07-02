"use client";

import type { Step1InfosInput, Step2ParcoursInput } from "../schema";
import { TYPE_LABELS, STATUS_LABELS, REQUIRED_DOCUMENTS } from "@/shared/constants/domain";
import type { InternshipType } from "@prisma/client";

interface StepValidationProps {
  step1: Partial<Step1InfosInput>;
  step2: Partial<Step2ParcoursInput>;
  uploadedFilesCount: number;
}

export function StepValidation({
  step1,
  step2,
  uploadedFilesCount,
}: StepValidationProps) {
  const internshipType = step2.internshipType as InternshipType | undefined;
  const requiredDocsCount = internshipType
    ? REQUIRED_DOCUMENTS[internshipType].length
    : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Section Infos personnelles */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4 font-bold">
            📋 Informations personnelles
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">Nom :</span>
              <span>{step1.lastName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">Prénom :</span>
              <span>{step1.firstName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">Email :</span>
              <span>{step1.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">Téléphone :</span>
              <span>{step1.phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">Domicile (lieu-dit) :</span>
              <span>{step1.lieudit}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">Proche 1 :</span>
              <span>{step1.relativePhone1}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold">Proche 2 :</span>
              <span>{step1.relativePhone2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Parcours */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4 font-bold">
            🎓 Parcours et paramètres du stage
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">École :</span>
              <span>{step2.school}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">Filière :</span>
              <span>{step2.field}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">Niveau :</span>
              <span>{step2.level}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">Type de stage :</span>
              <span className="badge badge-primary">
                {TYPE_LABELS[internshipType || "ACADEMIC"]}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">Durée :</span>
              <span>{step2.duration} mois</span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-300">
              <span className="font-semibold">Date de début :</span>
              <span>
                {step2.startDate
                  ? new Date(step2.startDate).toLocaleDateString("fr-FR")
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold">Rapport requis :</span>
              <span>{step2.reportRequired ? "✅ Oui" : "❌ Non"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Documents */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4 font-bold">
            📄 Documents uploadés
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-base-content/70">
              <strong>{uploadedFilesCount}</strong> / <strong>{requiredDocsCount}</strong>{" "}
              document(s) requis uploadé(s)
            </p>
            {uploadedFilesCount === requiredDocsCount ? (
              <div className="alert alert-success py-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  className="w-4 h-4"
                >
                  <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.017 1.052L7.88 12.414a.732.732 0 0 1-1.047.020L3.254 8.766a.732.732 0 0 1 0-1.047.733.733 0 0 1 1.047 0l3.236 3.236 5.83-6.868a.732.732 0 0 1 .029-.022Z" />
                </svg>
                Tous les documents ont été uploadés
              </div>
            ) : (
              <div className="alert alert-warning py-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4v2m0 4v2M7.47 11a9.01 9.01 0 1116.06 0M12 5a7 7 0 110 14 7 7 0 010-14z"
                  />
                </svg>
                Certains documents manquent
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avertissement final */}
      <div className="alert">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>
          Vérifiez que toutes les informations sont correctes. Une fois envoyée, votre
          demande sera examinée par notre équipe RH. Un code de suivi vous sera envoyé
          par email pour consulter l'état d'avancement.
        </span>
      </div>
    </div>
  );
}
