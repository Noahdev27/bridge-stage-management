"use client";

import { useState } from "react";
import {
  Info,
  MapPin,
  LoaderCircle,
  LocateFixed,
  CircleCheck,
  TriangleAlert,
  ExternalLink,
} from "lucide-react";
import type { Step1InfosInput } from "../schema";
import { FieldGroup, FormField } from "@/shared/ui/FormField";

interface StepInfosProps {
  data: Partial<Step1InfosInput>;
  onChange: (field: keyof Step1InfosInput, value: string) => void;
  errors?: Record<string, string>;
}

type GeoState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; accuracy: number }
  | { status: "error"; message: string };

/**
 * Au-delà de cette précision (en mètres), la position vient en général de
 * l'adresse IP ou du Wi-Fi, pas du GPS : elle peut tomber à plusieurs
 * kilomètres du domicile, ce qu'on signale au candidat.
 */
const LOW_ACCURACY_METERS = 500;

// Messages FR pour les codes d'erreur standard de l'API Geolocation.
function describeGeolocationError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Accès à votre position refusé. Vous pouvez l'autoriser dans les réglages du navigateur, ou continuer sans.";
    case error.POSITION_UNAVAILABLE:
      return "Position indisponible. Activez la localisation de votre appareil, ou continuez sans.";
    case error.TIMEOUT:
      return "La recherche a pris trop de temps. Réessayez, de préférence à l'extérieur, ou continuez sans.";
    default:
      return "Impossible de récupérer votre position. Vous pouvez continuer sans.";
  }
}

function formatAccuracy(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1).replace(".", ",")} km`
    : `${Math.round(meters)} m`;
}

export function StepInfos({ data, onChange, errors = {} }: StepInfosProps) {
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });

  const latitude = data.latitude?.toString() ?? "";
  const longitude = data.longitude?.toString() ?? "";
  const hasCoordinates = latitude !== "" && longitude !== "";
  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`
    : null;

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeo({
        status: "error",
        message:
          "Votre navigateur ne permet pas la localisation. Vous pouvez continuer sans.",
      });
      return;
    }

    // Les navigateurs bloquent la géolocalisation hors HTTPS, sans toujours
    // le dire clairement : on l'annonce plutôt que de laisser échouer.
    if (!window.isSecureContext) {
      setGeo({
        status: "error",
        message:
          "La localisation n'est disponible que sur une connexion sécurisée (https). Vous pouvez continuer sans.",
      });
      return;
    }

    setGeo({ status: "pending" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange("latitude", position.coords.latitude.toFixed(6));
        onChange("longitude", position.coords.longitude.toFixed(6));
        setGeo({ status: "success", accuracy: position.coords.accuracy });
      },
      (error) => {
        setGeo({ status: "error", message: describeGeolocationError(error) });
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 0,
      }
    );
  };

  const handleClearLocation = () => {
    onChange("latitude", "");
    onChange("longitude", "");
    setGeo({ status: "idle" });
  };

  const isPending = geo.status === "pending";

  return (
    <div className="flex flex-col gap-8">
      <FieldGroup title="Identité et contact">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Prénom" required error={errors.firstName}>
            {(control) => (
              <input
                {...control}
                type="text"
                autoComplete="given-name"
                placeholder="Votre prénom"
                className={`input w-full ${errors.firstName ? "input-error" : ""}`}
                value={data.firstName || ""}
                onChange={(e) => onChange("firstName", e.target.value)}
                required
              />
            )}
          </FormField>

          <FormField label="Nom" required error={errors.lastName}>
            {(control) => (
              <input
                {...control}
                type="text"
                autoComplete="family-name"
                placeholder="Votre nom"
                className={`input w-full ${errors.lastName ? "input-error" : ""}`}
                value={data.lastName || ""}
                onChange={(e) => onChange("lastName", e.target.value)}
                required
              />
            )}
          </FormField>

          <FormField label="Email" required error={errors.email}>
            {(control) => (
              <input
                {...control}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="votre@email.com"
                className={`input w-full ${errors.email ? "input-error" : ""}`}
                value={data.email || ""}
                onChange={(e) => onChange("email", e.target.value)}
                required
              />
            )}
          </FormField>

          <FormField label="Téléphone" required error={errors.phone}>
            {(control) => (
              <input
                {...control}
                type="tel"
                autoComplete="tel"
                placeholder="+237 6 71 23 45 67"
                className={`input w-full ${errors.phone ? "input-error" : ""}`}
                value={data.phone || ""}
                onChange={(e) => onChange("phone", e.target.value)}
                required
              />
            )}
          </FormField>
        </div>
      </FieldGroup>

      <FieldGroup
        title="Domicile"
        description="Où vous résidez pendant le stage."
      >
        <FormField
          label="Lieu-dit"
          required
          error={errors.lieudit}
          hint="Quartier et repère connu, pour vous situer facilement."
        >
          {(control) => (
            <input
              {...control}
              type="text"
              placeholder="Ex : Nkolbisson, face pharmacie…"
              className={`input w-full ${errors.lieudit ? "input-error" : ""}`}
              value={data.lieudit || ""}
              onChange={(e) => onChange("lieudit", e.target.value)}
              required
            />
          )}
        </FormField>

        {/* Position GPS facultative : remplie uniquement par le bouton, sans
            coordonnées à saisir. Le candidat voit l'état et peut vérifier la
            position sur une carte, jamais des chiffres bruts. */}
        <div className="rounded-box border border-base-300 bg-base-200/40 p-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="grid place-items-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                <MapPin className="w-5 h-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Position GPS</p>
                <p className="text-xs text-base-content/60">
                  Depuis votre téléphone, sur place, la position est la plus
                  précise.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isPending}
              className="btn btn-primary gap-2 w-full sm:w-auto shrink-0"
            >
              {isPending ? (
                <LoaderCircle className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <LocateFixed className="w-4 h-4" aria-hidden="true" />
              )}
              {isPending
                ? "Localisation…"
                : hasCoordinates
                  ? "Relocaliser"
                  : "Me localiser"}
            </button>
          </div>

          <div aria-live="polite">
            {geo.status === "success" && (
              <div
                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                  geo.accuracy > LOW_ACCURACY_METERS
                    ? "bg-warning/10"
                    : "bg-success/10 text-success"
                }`}
              >
                {geo.accuracy > LOW_ACCURACY_METERS ? (
                  <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-warning" aria-hidden="true" />
                ) : (
                  <CircleCheck className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                )}
                <span className="text-base-content/80">
                  {geo.accuracy > LOW_ACCURACY_METERS
                    ? `Position approximative (à ${formatAccuracy(geo.accuracy)} près). Vérifiez-la sur la carte, ou relocalisez-vous depuis votre téléphone.`
                    : `Position enregistrée (à ${formatAccuracy(geo.accuracy)} près).`}
                </span>
              </div>
            )}
            {geo.status === "idle" && hasCoordinates && (
              <div className="flex items-start gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                <CircleCheck className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span className="text-base-content/80">Position enregistrée.</span>
              </div>
            )}
            {geo.status === "error" && (
              <div className="flex items-start gap-2 rounded-lg bg-error/10 px-3 py-2 text-sm">
                <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-error" aria-hidden="true" />
                <span className="text-base-content/80">{geo.message}</span>
              </div>
            )}
          </div>

          {hasCoordinates && geo.status !== "pending" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary inline-flex items-center gap-1 font-medium"
                >
                  Vérifier sur la carte
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
              <button
                type="button"
                onClick={handleClearLocation}
                className="link link-hover text-base-content/60"
              >
                Retirer ma position
              </button>
            </div>
          )}

          <p className="text-xs text-base-content/55">
            Facultatif. Sans position, votre plan de localisation (étape
            « Documents ») suffit.
          </p>
        </div>
      </FieldGroup>

      <FieldGroup
        title="Personnes à contacter"
        description="Deux proches joignables en cas de besoin."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Téléphone du proche 1" required error={errors.relativePhone1}>
            {(control) => (
              <input
                {...control}
                type="tel"
                placeholder="+237 6 90 12 34 56"
                className={`input w-full ${errors.relativePhone1 ? "input-error" : ""}`}
                value={data.relativePhone1 || ""}
                onChange={(e) => onChange("relativePhone1", e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Téléphone du proche 2" required error={errors.relativePhone2}>
            {(control) => (
              <input
                {...control}
                type="tel"
                placeholder="+237 6 55 66 77 88"
                className={`input w-full ${errors.relativePhone2 ? "input-error" : ""}`}
                value={data.relativePhone2 || ""}
                onChange={(e) => onChange("relativePhone2", e.target.value)}
                required
              />
            )}
          </FormField>
        </div>
      </FieldGroup>

      <div className="flex items-start gap-2 rounded-box bg-info/10 px-4 py-3 text-sm text-base-content/80">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-info" aria-hidden="true" />
        <span>
          Tous les numéros doivent être au format international (ex. +237…). Le
          plan de localisation reste à fournir à l&apos;étape « Documents ».
        </span>
      </div>
    </div>
  );
}
