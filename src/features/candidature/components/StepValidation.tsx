"use client";

import type { ComponentType } from "react";
import type { Step1InfosInput, Step2ParcoursInput } from "../schema";
import { TYPE_LABELS, REQUIRED_DOCUMENTS } from "@/shared/constants/domain";
import type { InternshipType } from "@prisma/client";
import {
  User,
  Mail,
  Phone,
  MapPin,
  PhoneCall,
  School,
  BookOpen,
  GraduationCap,
  Briefcase,
  Clock,
  CalendarDays,
  ClipboardCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  UserRound,
} from "lucide-react";

interface StepValidationProps {
  step1: Partial<Step1InfosInput>;
  step2: Partial<Step2ParcoursInput>;
  uploadedFilesCount: number;
}

/** Une ligne « libellé → valeur » avec une icône discrète. */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon className="w-4 h-4 text-primary/70 shrink-0" aria-hidden="true" />
      <span className="text-sm text-base-content/60">{label}</span>
      <span className="ml-auto text-sm font-medium text-base-content text-right">
        {value || <span className="text-base-content/40">—</span>}
      </span>
    </div>
  );
}

/** Une carte de section avec en-tête coloré. */
function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-box border border-base-300 bg-base-100 overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-3.5 bg-primary/5 border-b border-base-300">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
        <h3 className="font-semibold text-secondary">{title}</h3>
      </header>
      <div className="px-5 divide-y divide-base-200">{children}</div>
    </section>
  );
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
  const allDocsReady =
    requiredDocsCount > 0 && uploadedFilesCount >= requiredDocsCount;

  return (
    <div className="flex flex-col gap-5">
      {/* Informations personnelles */}
      <SectionCard icon={UserRound} title="Informations personnelles">
        <InfoRow
          icon={User}
          label="Nom complet"
          value={
            step1.firstName || step1.lastName
              ? `${step1.firstName ?? ""} ${step1.lastName ?? ""}`.trim()
              : ""
          }
        />
        <InfoRow icon={Mail} label="Email" value={step1.email} />
        <InfoRow icon={Phone} label="Téléphone" value={step1.phone} />
        <InfoRow icon={MapPin} label="Domicile (lieu-dit)" value={step1.lieudit} />
        <InfoRow
          icon={MapPin}
          label="Coordonnées GPS"
          value={
            step1.latitude != null && step1.longitude != null
              ? `${step1.latitude}, ${step1.longitude}`
              : ""
          }
        />
        <InfoRow
          icon={PhoneCall}
          label="Proche 1"
          value={step1.relativePhone1}
        />
        <InfoRow
          icon={PhoneCall}
          label="Proche 2"
          value={step1.relativePhone2}
        />
      </SectionCard>

      {/* Parcours et stage */}
      <SectionCard icon={GraduationCap} title="Parcours et stage">
        <InfoRow icon={School} label="École / Université" value={step2.school} />
        <InfoRow icon={BookOpen} label="Filière" value={step2.field} />
        <InfoRow icon={GraduationCap} label="Niveau d'étude" value={step2.level} />
        <InfoRow
          icon={Briefcase}
          label="Type de stage"
          value={
            internshipType ? (
              <span className="badge badge-primary badge-sm font-medium">
                {TYPE_LABELS[internshipType]}
              </span>
            ) : (
              ""
            )
          }
        />
        <InfoRow
          icon={Clock}
          label="Durée"
          value={step2.duration ? `${step2.duration} mois` : ""}
        />
        <InfoRow
          icon={CalendarDays}
          label="Date de début"
          value={
            step2.startDate
              ? new Date(step2.startDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : ""
          }
        />
        <InfoRow
          icon={ClipboardCheck}
          label="Rapport de fin de stage"
          value={
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                step2.reportRequired ? "text-success" : "text-base-content/50"
              }`}
            >
              {step2.reportRequired ? (
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {step2.reportRequired ? "Oui" : "Non"}
            </span>
          }
        />
      </SectionCard>

      {/* Documents */}
      <SectionCard icon={FileText} title="Documents">
        <div className="flex items-center gap-3 py-4">
          <span
            className={`grid place-items-center w-10 h-10 rounded-full ${
              allDocsReady
                ? "bg-success/15 text-success"
                : "bg-warning/15 text-warning"
            }`}
          >
            {allDocsReady ? (
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-base-content">
              <span className="tabular-nums">{uploadedFilesCount}</span> /{" "}
              <span className="tabular-nums">{requiredDocsCount}</span> document(s)
              requis
            </p>
            <p className="text-xs text-base-content/60">
              {allDocsReady
                ? "Tous les documents requis sont joints."
                : "Il manque des documents pour ce type de stage."}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Rappel avant envoi */}
      <div className="flex gap-3 rounded-box border border-accent/40 bg-accent/10 px-4 py-3.5">
        <ShieldCheck
          className="w-5 h-5 text-secondary shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p className="text-sm text-base-content/80">
          Vérifiez vos informations avant l'envoi. Après soumission, votre demande
          sera examinée par l'équipe RH et un{" "}
          <span className="font-semibold text-secondary">code de suivi</span> vous
          sera envoyé par email.
        </p>
      </div>
    </div>
  );
}
