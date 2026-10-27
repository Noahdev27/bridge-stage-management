"use client";

import { GraduationCap, Briefcase, Info } from "lucide-react";
import type { Step2ParcoursInput } from "../schema";
import type { InternshipType } from "@prisma/client";
import { TYPE_LABELS, MIN_DURATION_MONTHS } from "@/shared/constants/domain";
import { FieldGroup, FormField } from "@/shared/ui/FormField";

interface StepParcoursProps {
  data: Partial<Step2ParcoursInput>;
  onChange: (field: keyof Step2ParcoursInput, value: string | boolean) => void;
  errors?: Record<string, string>;
  /** Type imposé par l'offre choisie : il ne peut plus être modifié. */
  lockedType?: InternshipType;
  /** Durée minimale fixée par l'offre, si elle dépasse le minimum légal. */
  offerMinDuration?: number;
}

const TYPE_OPTIONS: {
  value: InternshipType;
  icon: typeof GraduationCap;
  description: string;
}[] = [
  {
    value: "ACADEMIC",
    icon: GraduationCap,
    description: "Dans le cadre de vos études",
  },
  {
    value: "PROFESSIONAL",
    icon: Briefcase,
    description: "Pour une première expérience pro",
  },
];

const LEVELS = [
  { value: "L1", label: "Licence 1" },
  { value: "L2", label: "Licence 2" },
  { value: "L3", label: "Licence 3" },
  { value: "M1", label: "Master 1" },
  { value: "M2", label: "Master 2" },
  { value: "BAC+3", label: "BAC+3" },
  { value: "BAC+4", label: "BAC+4" },
  { value: "BAC+5", label: "BAC+5" },
];

export function StepParcours({
  data,
  onChange,
  errors = {},
  lockedType,
  offerMinDuration,
}: StepParcoursProps) {
  const internshipType = data.internshipType as InternshipType | undefined;
  const minDuration = Math.max(
    internshipType ? MIN_DURATION_MONTHS[internshipType] : 1,
    offerMinDuration ?? 0
  );

  return (
    <div className="flex flex-col gap-8">
      <FieldGroup title="Votre formation">
        <FormField label="École / Université" required error={errors.school}>
          {(control) => (
            <input
              {...control}
              type="text"
              placeholder="Ex : Université de Douala"
              className={`input w-full ${errors.school ? "input-error" : ""}`}
              value={data.school || ""}
              onChange={(e) => onChange("school", e.target.value)}
              required
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Filière" required error={errors.field}>
            {(control) => (
              <input
                {...control}
                type="text"
                placeholder="Ex : Génie informatique"
                className={`input w-full ${errors.field ? "input-error" : ""}`}
                value={data.field || ""}
                onChange={(e) => onChange("field", e.target.value)}
                required
              />
            )}
          </FormField>

          <FormField label="Niveau d'étude" required error={errors.level}>
            {(control) => (
              <select
                {...control}
                className={`select w-full ${errors.level ? "select-error" : ""}`}
                value={data.level || ""}
                onChange={(e) => onChange("level", e.target.value)}
                required
              >
                <option value="" disabled>
                  Sélectionnez votre niveau
                </option>
                {LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        </div>
      </FieldGroup>

      <FieldGroup title="Le stage souhaité">
        {/* Choix du type en cartes : deux options seulement, autant les
            montrer d'emblée avec ce qu'elles impliquent. */}
        <div className="flex flex-col gap-1.5">
          <span id="internship-type-label" className="text-sm font-semibold">
            Type de stage
            <span className="text-error ml-0.5" aria-hidden="true">
              *
            </span>
          </span>
          <div
            role="radiogroup"
            aria-labelledby="internship-type-label"
            aria-invalid={!!errors.internshipType}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {TYPE_OPTIONS.filter(
              (option) => !lockedType || option.value === lockedType
            ).map(({ value, icon: Icon, description }) => {
              const checked = data.internshipType === value;
              return (
                <label
                  key={value}
                  className={`flex items-center gap-3 rounded-box border-2 p-4 cursor-pointer transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary has-[:focus-visible]:outline-offset-2 ${
                    checked
                      ? "border-primary bg-primary/5"
                      : errors.internshipType
                        ? "border-error/50 hover:border-error"
                        : "border-base-300 hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="internshipType"
                    className="radio radio-primary radio-sm"
                    value={value}
                    checked={checked}
                    onChange={(e) => onChange("internshipType", e.target.value)}
                    disabled={!!lockedType}
                    required
                  />
                  <Icon
                    className={`w-6 h-6 shrink-0 ${checked ? "text-primary" : "text-base-content/40"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold">
                      Stage {TYPE_LABELS[value].toLowerCase()}
                    </span>
                    <span className="block text-xs text-base-content/60">
                      {description} · {MIN_DURATION_MONTHS[value]} mois min.
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {lockedType && (
            <p className="text-xs text-base-content/55">
              Le type de stage est fixé par l&apos;offre à laquelle vous postulez.
            </p>
          )}
          {errors.internshipType && (
            <p className="text-xs text-error" role="alert">
              {errors.internshipType}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Durée (en mois)"
            required
            error={errors.duration}
            hint={
              offerMinDuration && offerMinDuration >= minDuration
                ? `Au moins ${minDuration} mois pour cette offre.`
                : internshipType
                  ? `Au moins ${minDuration} mois pour un stage ${TYPE_LABELS[internshipType].toLowerCase()}.`
                  : "Choisissez d'abord le type de stage."
            }
          >
            {(control) => (
              <input
                {...control}
                type="number"
                inputMode="numeric"
                min={minDuration || 1}
                placeholder={`Ex : ${Math.max(minDuration, 3)}`}
                className={`input w-full ${errors.duration ? "input-error" : ""}`}
                value={data.duration || ""}
                onChange={(e) => onChange("duration", e.target.value)}
                required
              />
            )}
          </FormField>

          <FormField label="Date de début souhaitée" required error={errors.startDate}>
            {(control) => (
              <input
                {...control}
                type="date"
                className={`input w-full ${errors.startDate ? "input-error" : ""}`}
                value={data.startDate || ""}
                onChange={(e) => onChange("startDate", e.target.value)}
                required
              />
            )}
          </FormField>
        </div>

        <label className="flex items-start gap-3 rounded-box border border-base-300 p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <input
            type="checkbox"
            className="checkbox checkbox-primary mt-0.5"
            checked={data.reportRequired || false}
            onChange={(e) => onChange("reportRequired", e.target.checked)}
          />
          <span>
            <span className="block text-sm font-semibold">
              Je dois produire un rapport de stage
            </span>
            <span className="block text-xs text-base-content/60">
              Cochez si votre établissement exige un rapport en fin de stage.
            </span>
          </span>
        </label>
      </FieldGroup>

      {internshipType === "ACADEMIC" && (
        <div className="flex items-start gap-2 rounded-box bg-info/10 px-4 py-3 text-sm text-base-content/80">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-info" aria-hidden="true" />
          <span>
            Un certificat de scolarité ou une lettre de recommandation de votre
            école vous sera demandé à l&apos;étape suivante.
          </span>
        </div>
      )}
    </div>
  );
}
