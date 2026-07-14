"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";

type DocItem = {
  id: string;
  label: string;
  url: string;
};

interface DocumentViewerProps {
  documents: DocItem[];
}

export function DocumentViewer({ documents }: DocumentViewerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = documents.find((doc) => doc.id === activeId);

  if (documents.length === 0) {
    return (
      <p className="text-sm text-base-content/50 italic">
        Aucun document transmis.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => setActiveId(doc.id)}
            className={`flex items-center justify-between p-3 rounded-lg border text-sm text-left transition-all ${
              activeId === doc.id
                ? "border-primary bg-primary/10"
                : "border-base-200 bg-base-200/30 hover:bg-base-200 hover:border-base-300"
            }`}
          >
            <span className="inline-flex items-center gap-1.5 font-medium text-base-content/80 truncate">
              <FileText className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{doc.label}</span>
            </span>
            <span className="text-xs text-primary font-semibold shrink-0">
              Aperçu
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div className="rounded-box border border-base-300 overflow-hidden bg-base-200">
          <div className="flex items-center justify-between px-3 py-2 border-b border-base-300 bg-base-100">
            <p className="text-sm font-medium truncate">{active.label}</p>
            <div className="flex items-center gap-2">
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-xs"
              >
                Nouvel onglet
              </a>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square"
                onClick={() => setActiveId(null)}
                aria-label="Fermer l'aperçu"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <iframe
            title={active.label}
            src={active.url}
            className="w-full h-[28rem] bg-base-100"
          />
        </div>
      )}
    </div>
  );
}
