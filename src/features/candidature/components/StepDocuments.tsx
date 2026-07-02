"use client";

import { useState } from "react";
import { REQUIRED_DOCUMENTS } from "@/shared/constants/domain";
import { validatePdf } from "@/shared/validation/file";
import type { InternshipType } from "@prisma/client";

interface StepDocumentsProps {
  internshipType?: InternshipType;
  onFilesChange: (files: Map<string, File>) => void;
  uploadedFiles?: Map<string, File>;
  errors?: Record<string, string>;
}

export function StepDocuments({
  internshipType,
  onFilesChange,
  uploadedFiles = new Map(),
  errors = {},
}: StepDocumentsProps) {
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  if (!internshipType) {
    return (
      <div className="alert alert-warning">
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
            d="M12 9v2m0 4v2m0 4v2M7.47 11a9.01 9.01 0 1116.06 0M12 5a7 7 0 110 14 7 7 0 010-14z"
          ></path>
        </svg>
        <span>Veuillez d'abord sélectionner un type de stage à l'étape précédente.</span>
      </div>
    );
  }

  const requiredDocs = REQUIRED_DOCUMENTS[internshipType] || [];

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    docLabel: string
  ) => {
    const file = e.target.files?.[0];
    const newErrors = { ...fileErrors };

    if (file) {
      // Valider le PDF
      const error = validatePdf(file);
      if (error) {
        newErrors[docLabel] = error;
        setFileErrors(newErrors);
        return;
      }
      delete newErrors[docLabel];
    }

    // Mettre à jour les fichiers uploadés
    const newFiles = new Map(uploadedFiles);
    if (file) {
      newFiles.set(docLabel, file);
    } else {
      newFiles.delete(docLabel);
    }
    setFileErrors(newErrors);
    onFilesChange(newFiles);
  };

  const isAllUploaded = requiredDocs.every((doc) => uploadedFiles.has(doc));

  return (
    <div className="flex flex-col gap-4">
      <div className="alert alert-info">
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
        <div>
          <p className="font-semibold">Format PDF uniquement, 2 Mo maximum par fichier.</p>
          <p className="text-sm opacity-75 mt-1">
            {requiredDocs.length} document(s) requis pour ce type de stage.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {requiredDocs.map((docLabel) => {
          const isUploaded = uploadedFiles.has(docLabel);
          const file = uploadedFiles.get(docLabel);
          const error = fileErrors[docLabel];

          return (
            <div key={docLabel} className="card bg-base-100 border border-base-300">
              <div className="card-body p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-semibold text-sm">
                    {docLabel} <span className="text-error">*</span>
                  </label>
                  {isUploaded && (
                    <div className="badge badge-success gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                        className="w-4 h-4"
                      >
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.017 1.052L7.88 12.414a.732.732 0 0 1-1.047.020L3.254 8.766a.732.732 0 0 1 0-1.047.733.733 0 0 1 1.047 0l3.236 3.236 5.83-6.868a.732.732 0 0 1 .029-.022Z" />
                      </svg>
                      Uploadé
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  accept="application/pdf"
                  className={`file-input file-input-bordered w-full ${
                    error ? "file-input-error" : ""
                  }`}
                  onChange={(e) => handleFileChange(e, docLabel)}
                  aria-label={`Upload ${docLabel}`}
                />

                {error && (
                  <label className="label mt-2">
                    <span className="label-text-alt text-error text-xs">
                      {error}
                    </span>
                  </label>
                )}

                {file && (
                  <div className="text-xs text-base-content/60 mt-2">
                    📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} Mo)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={`alert ${isAllUploaded ? "alert-success" : "alert-warning"}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          {isAllUploaded ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4v2m0 4v2M7.47 11a9.01 9.01 0 1116.06 0M12 5a7 7 0 110 14 7 7 0 010-14z"
            />
          )}
        </svg>
        <span>
          {isAllUploaded
            ? "Tous les documents requis ont été uploadés ✔"
            : `${uploadedFiles.size} / ${requiredDocs.length} document(s) uploadé(s)`}
        </span>
      </div>
    </div>
  );
}
