"use client";

import { useState } from "react";
import { REQUIRED_DOCUMENTS } from "@/shared/constants/domain";
import { validatePdf } from "@/shared/validation/file";
import type { InternshipType } from "@prisma/client";
import { AlertTriangle, Info, CheckCircle2, FileText } from "lucide-react";

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
}: StepDocumentsProps) {
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  if (!internshipType) {
    return (
      <div className="alert alert-warning">
        <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span>
          Veuillez d&apos;abord sélectionner un type de stage à l&apos;étape précédente.
        </span>
      </div>
    );
  }

  const requiredDocs = REQUIRED_DOCUMENTS[internshipType];

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    docLabel: string
  ) => {
    const file = e.target.files?.[0];
    const newErrors = { ...fileErrors };

    if (file) {
      const error = validatePdf(file);
      if (error) {
        newErrors[docLabel] = error;
        setFileErrors(newErrors);
        return;
      }
      delete newErrors[docLabel];
    }

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
        <Info className="w-5 h-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">
            Format PDF uniquement, 2 Mo maximum par fichier.
          </p>
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
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
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
                  aria-label={`Téléverser : ${docLabel}`}
                />

                {error && (
                  <label className="label mt-2">
                    <span className="label-text-alt text-error text-xs">
                      {error}
                    </span>
                  </label>
                )}

                {file && (
                  <div className="flex items-center gap-1.5 text-xs text-base-content/60 mt-2">
                    <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{file.name}</span>
                    <span className="tabular-nums whitespace-nowrap">
                      ({(file.size / 1024 / 1024).toFixed(2)} Mo)
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={`alert ${isAllUploaded ? "alert-success" : "alert-warning"}`}>
        {isAllUploaded ? (
          <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
        ) : (
          <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
        )}
        <span>
          {isAllUploaded
            ? "Tous les documents requis ont été uploadés."
            : `${uploadedFiles.size} / ${requiredDocs.length} document(s) uploadé(s)`}
        </span>
      </div>
    </div>
  );
}
