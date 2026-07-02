"use client";

import type { Step2ParcoursInput } from "../schema";
import type { InternshipType } from "@prisma/client";
import { TYPE_LABELS, MIN_DURATION_MONTHS } from "@/shared/constants/domain";

interface StepParcoursProps {
  data: Partial<Step2ParcoursInput>;
  onChange: (field: keyof Step2ParcoursInput, value: string | boolean) => void;
  errors?: Record<string, string>;
}

export function StepParcours({ data, onChange, errors = {} }: StepParcoursProps) {
  const internshipType = data.internshipType as InternshipType | undefined;
  const minDuration = internshipType ? MIN_DURATION_MONTHS[internshipType] : 1;

  return (
    <div className="flex flex-col gap-4">
      {/* École */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">
            École / Université <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="text"
          placeholder="Ex: Université Paris-Saclay"
          className={`input input-bordered ${errors.school ? "input-error" : ""}`}
          value={data.school || ""}
          onChange={(e) => onChange("school", e.target.value)}
          required
        />
        {errors.school && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.school}</span>
          </label>
        )}
      </div>

      {/* Filière */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">
            Filière <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="text"
          placeholder="Ex: Informatique, Gestion, etc."
          className={`input input-bordered ${errors.field ? "input-error" : ""}`}
          value={data.field || ""}
          onChange={(e) => onChange("field", e.target.value)}
          required
        />
        {errors.field && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.field}</span>
          </label>
        )}
      </div>

      {/* Niveau d'étude */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">
            Niveau d'étude <span className="text-error">*</span>
          </span>
        </label>
        <select
          className={`select select-bordered ${errors.level ? "select-error" : ""}`}
          value={data.level || ""}
          onChange={(e) => onChange("level", e.target.value)}
          required
        >
          <option value="">-- Sélectionnez --</option>
          <option value="L1">Licence 1</option>
          <option value="L2">Licence 2</option>
          <option value="L3">Licence 3</option>
          <option value="M1">Master 1</option>
          <option value="M2">Master 2</option>
          <option value="BAC+3">BAC+3</option>
          <option value="BAC+4">BAC+4</option>
          <option value="BAC+5">BAC+5</option>
        </select>
        {errors.level && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.level}</span>
          </label>
        )}
      </div>

      {/* Type de stage */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">
            Type de stage <span className="text-error">*</span>
          </span>
        </label>
        <div className="flex gap-4 mt-2">
          {["ACADEMIC", "PROFESSIONAL"].map((type) => (
            <label
              key={type}
              className="label cursor-pointer flex gap-2 justify-start"
            >
              <input
                type="radio"
                name="internshipType"
                className="radio radio-primary"
                value={type}
                checked={data.internshipType === type}
                onChange={(e) => onChange("internshipType", e.target.value)}
                required
              />
              <span className="label-text">{TYPE_LABELS[type as InternshipType]}</span>
            </label>
          ))}
        </div>
        {errors.internshipType && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.internshipType}
            </span>
          </label>
        )}
      </div>

      {internshipType && (
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
          <span>
            Stage {TYPE_LABELS[internshipType]}: durée minimale de{" "}
            <strong>{minDuration} mois</strong>
          </span>
        </div>
      )}

      {/* Durée */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">
            Durée (en mois) <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="number"
          min={minDuration || 1}
          placeholder="Ex: 3"
          className={`input input-bordered ${errors.duration ? "input-error" : ""}`}
          value={data.duration || ""}
          onChange={(e) => onChange("duration", e.target.value)}
          required
        />
        {errors.duration && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.duration}
            </span>
          </label>
        )}
      </div>

      {/* Date de début */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">
            Date de début souhaitée <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="date"
          className={`input input-bordered ${errors.startDate ? "input-error" : ""}`}
          value={data.startDate || ""}
          onChange={(e) => onChange("startDate", e.target.value)}
          required
        />
        {errors.startDate && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.startDate}
            </span>
          </label>
        )}
      </div>

      {/* Rapport à produire */}
      <div className="form-control">
        <label className="label cursor-pointer">
          <span className="label-text font-semibold">
            Rapport à produire à la fin du stage
          </span>
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={data.reportRequired || false}
            onChange={(e) => onChange("reportRequired", e.target.checked)}
          />
        </label>
      </div>
    </div>
  );
}
