"use client";

import type { Step1InfosInput } from "../schema";

interface StepInfosProps {
  data: Partial<Step1InfosInput>;
  onChange: (field: keyof Step1InfosInput, value: string) => void;
  errors?: Record<string, string>;
}

export function StepInfos({ data, onChange, errors = {} }: StepInfosProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prénom */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              Prénom <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            placeholder="Votre prénom"
            className={`input input-bordered ${
              errors.firstName ? "input-error" : ""
            }`}
            value={data.firstName || ""}
            onChange={(e) => onChange("firstName", e.target.value)}
            required
          />
          {errors.firstName && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.firstName}
              </span>
            </label>
          )}
        </div>

        {/* Nom */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              Nom <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            placeholder="Votre nom"
            className={`input input-bordered ${errors.lastName ? "input-error" : ""}`}
            value={data.lastName || ""}
            onChange={(e) => onChange("lastName", e.target.value)}
            required
          />
          {errors.lastName && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.lastName}
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">
            Email <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="email"
          placeholder="votre@email.com"
          className={`input input-bordered ${errors.email ? "input-error" : ""}`}
          value={data.email || ""}
          onChange={(e) => onChange("email", e.target.value)}
          required
        />
        {errors.email && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.email}</span>
          </label>
        )}
      </div>

      {/* Téléphone 1 */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">
            Téléphone 1 <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="tel"
          placeholder="+237 6 71 23 45 67"
          className={`input input-bordered ${errors.phone1 ? "input-error" : ""}`}
          value={data.phone1 || ""}
          onChange={(e) => onChange("phone1", e.target.value)}
          required
        />
        {errors.phone1 && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.phone1}</span>
          </label>
        )}
      </div>

      {/* Téléphone 2 */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">
            Téléphone 2{" "}
            <span className="text-base-content/50 font-normal">(facultatif)</span>
          </span>
        </label>
        <input
          type="tel"
          placeholder="+237 6 90 12 34 56"
          className={`input input-bordered ${errors.phone2 ? "input-error" : ""}`}
          value={data.phone2 || ""}
          onChange={(e) => onChange("phone2", e.target.value)}
        />
        {errors.phone2 && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.phone2}</span>
          </label>
        )}
      </div>

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
        <span>Le Téléphone 1 est obligatoire. Le Téléphone 2 est facultatif — s'il est renseigné, il doit être au format international valide (ex. +237…).</span>
      </div>
    </div>
  );
}
