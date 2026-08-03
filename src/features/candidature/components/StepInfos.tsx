"use client";

import { useState } from "react";
import { Info, MapPin, LoaderCircle } from "lucide-react";
import type { Step1InfosInput } from "../schema";

interface StepInfosProps {
  data: Partial<Step1InfosInput>;
  onChange: (field: keyof Step1InfosInput, value: string) => void;
  errors?: Record<string, string>;
}

type GeoStatus = "idle" | "pending" | "success" | "error";

// Messages FR pour les codes d'erreur standard de l'API Geolocation.
function describeGeolocationError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Autorisation refusée. Vous pouvez saisir vos coordonnées manuellement.";
    case error.POSITION_UNAVAILABLE:
      return "Position indisponible. Vérifiez votre connexion GPS ou saisissez manuellement.";
    case error.TIMEOUT:
      return "Délai dépassé. Réessayez ou saisissez manuellement.";
    default:
      return "Impossible de récupérer votre position. Saisissez-la manuellement.";
  }
}

export function StepInfos({ data, onChange, errors = {} }: StepInfosProps) {
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoStatus("error");
      setGeoMessage(
        "Votre navigateur ne supporte pas la géolocalisation. Saisissez vos coordonnées manuellement."
      );
      return;
    }

    setGeoStatus("pending");
    setGeoMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange("latitude", position.coords.latitude.toFixed(6));
        onChange("longitude", position.coords.longitude.toFixed(6));
        setGeoStatus("success");
        setGeoMessage("Coordonnées renseignées depuis votre appareil.");
      },
      (error) => {
        setGeoStatus("error");
        setGeoMessage(describeGeolocationError(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      }
    );
  };

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

      {/* Téléphone du candidat */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">
            Téléphone <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="tel"
          placeholder="+237 6 71 23 45 67"
          className={`input input-bordered ${errors.phone ? "input-error" : ""}`}
          value={data.phone || ""}
          onChange={(e) => onChange("phone", e.target.value)}
          required
        />
        {errors.phone && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.phone}</span>
          </label>
        )}
      </div>

      {/* Domicile — Lieu-dit */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">
            Domicile (lieu-dit) <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="text"
          placeholder="Ex : Nkolbisson, face pharmacie…"
          className={`input input-bordered ${errors.lieudit ? "input-error" : ""}`}
          value={data.lieudit || ""}
          onChange={(e) => onChange("lieudit", e.target.value)}
          required
        />
        {errors.lieudit && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.lieudit}</span>
          </label>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geoStatus === "pending"}
          className="btn btn-outline btn-sm gap-2"
          aria-live="polite"
        >
          {geoStatus === "pending" ? (
            <LoaderCircle
              className="w-4 h-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <MapPin className="w-4 h-4" aria-hidden="true" />
          )}
          {geoStatus === "pending"
            ? "Recherche de votre position…"
            : "Utiliser ma position actuelle"}
        </button>
        {geoMessage && (
          <span
            className={`text-xs ${
              geoStatus === "error" ? "text-error" : "text-success"
            }`}
            role="status"
          >
            {geoMessage}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              Latitude GPS <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ex : 3.8480"
            className={`input input-bordered ${errors.latitude ? "input-error" : ""}`}
            value={data.latitude?.toString() || ""}
            onChange={(e) => onChange("latitude", e.target.value)}
            required
          />
          {errors.latitude && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.latitude}</span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              Longitude GPS <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ex : 11.5021"
            className={`input input-bordered ${errors.longitude ? "input-error" : ""}`}
            value={data.longitude?.toString() || ""}
            onChange={(e) => onChange("longitude", e.target.value)}
            required
          />
          {errors.longitude && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.longitude}</span>
            </label>
          )}
        </div>
      </div>

      {/* Texte d'aide, et non un libellé : un <label> sans contrôle associé
          n'apporte rien aux lecteurs d'écran. */}
      <p className="-mt-2 text-xs text-base-content/50">
        Utilisez le bouton ci-dessus pour renseigner automatiquement vos
        coordonnées, ou saisissez-les manuellement (ex. depuis Google Maps). Le
        plan de localisation reste requis à l&apos;étape « Documents ».
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Téléphone proche 1 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              Téléphone d&apos;un proche 1 <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="tel"
            placeholder="+237 6 90 12 34 56"
            className={`input input-bordered ${
              errors.relativePhone1 ? "input-error" : ""
            }`}
            value={data.relativePhone1 || ""}
            onChange={(e) => onChange("relativePhone1", e.target.value)}
            required
          />
          {errors.relativePhone1 && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.relativePhone1}
              </span>
            </label>
          )}
        </div>

        {/* Téléphone proche 2 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              Téléphone d&apos;un proche 2 <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="tel"
            placeholder="+237 6 55 66 77 88"
            className={`input input-bordered ${
              errors.relativePhone2 ? "input-error" : ""
            }`}
            value={data.relativePhone2 || ""}
            onChange={(e) => onChange("relativePhone2", e.target.value)}
            required
          />
          {errors.relativePhone2 && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.relativePhone2}
              </span>
            </label>
          )}
        </div>
      </div>

      <div className="alert alert-info">
        <Info className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span>
          Tous les numéros doivent être au format international (ex. +237…). Les
          deux contacts proches sont obligatoires.
        </span>
      </div>
    </div>
  );
}
