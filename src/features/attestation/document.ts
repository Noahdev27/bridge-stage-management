import "server-only";

import { TYPE_LABELS } from "@/shared/constants/domain";
import {
  ATTESTATION_CITY,
  ATTESTATION_SIGNATORY_MENTION,
  COMPANY_LEGAL_NAME,
  LETTERHEAD_BOTTOM,
  LETTERHEAD_TOP,
} from "./constants";
import type { AttestationBranding } from "./settings";
import type { AttestationRequest } from "./queries";

/**
 * Rendu HTML de l'attestation de stage (maquette « charte Bridge »).
 *
 * Le document est servi en HTML imprimable plutôt que converti en PDF côté
 * serveur : générer un PDF fidèle demanderait d'embarquer un Chromium, ce qui
 * ne tient pas dans une fonction serverless Vercel. L'impression navigateur
 * (Ctrl+P → « Enregistrer au format PDF ») produit le même A4 au pixel près.
 */

const LONG_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

function frDate(value: Date): string {
  return value.toLocaleDateString("fr-FR", { ...LONG_DATE, timeZone: "UTC" });
}

/** Nombre de mois entre deux dates, arrondi au plus proche (minimum 1). */
export function monthsBetween(start: Date, end: Date): number {
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth()) +
    (end.getUTCDate() - start.getUTCDate()) / 30;
  return Math.max(1, Math.round(months));
}

/** Échappe le texte injecté dans le gabarit : les données viennent du candidat. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type AttestationRenderOptions = {
  /** Déclenche la boîte d'impression à l'ouverture. */
  autoPrint?: boolean;
  /** Code de suivi rappelé en pied de document pour la vérification. */
  verificationCode: string;
  reference: string;
  issuedAt: Date;
  /**
   * Griffe et cachet de l'entreprise. Absents, le document laisse la place
   * libre : il est alors signé à la main, comme le modèle papier actuel.
   */
  branding?: AttestationBranding;
};

export function renderAttestationHtml(
  request: AttestationRequest,
  options: AttestationRenderOptions
): string {
  const { profile, tutor, type, startDate, endDate } = request;

  if (!endDate) {
    throw new Error("Attestation demandée sans date de fin.");
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const durationMonths = monthsBetween(startDate, endDate);
  const tutorLabel = tutor?.name || tutor?.email || null;

  const encadrement = tutorLabel
    ? `, sous l'encadrement de <strong>${esc(tutorLabel)}</strong>`
    : "";

  // Les griffes sont des `data:` URI produites côté serveur, jamais une saisie
  // utilisateur : elles ne passent pas par `esc`, qui casserait le base64.
  const { signatureDataUri, stampDataUri } = options.branding ?? {
    signatureDataUri: null,
    stampDataUri: null,
  };
  const marques = [
    signatureDataUri
      ? `<img class="paraphe" src="${signatureDataUri}" alt="Signature">`
      : "",
    stampDataUri ? `<img class="tampon" src="${stampDataUri}" alt="Cachet">` : "",
  ].join("");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Attestation de stage — ${esc(fullName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--bleu:#0088C1;--bleu-fonce:#014B6A;--bleu-pale:#D6F2FE;--gris:#878786;}
  *{box-sizing:border-box;}
  body{margin:0;background:#525659;font-family:Montserrat,system-ui,sans-serif;}
  .page{position:relative;width:210mm;height:297mm;margin:0 auto;background:#fff;overflow:hidden;}
  .entete{position:absolute;top:12mm;left:12mm;width:186mm;}
  .pied{position:absolute;bottom:0;left:0;width:210mm;}
  .corps{position:absolute;top:52mm;left:22mm;right:22mm;bottom:100mm;
         font-size:10.5pt;line-height:1.8;color:#14242c;}
  .corps p{margin:0 0 13px;text-align:justify;}
  .kicker{text-align:center;font-size:9pt;letter-spacing:.22em;text-transform:uppercase;
          color:var(--bleu);font-weight:600;margin-bottom:5px;}
  h1{text-align:center;font-size:23pt;font-weight:700;color:var(--bleu-fonce);
     margin:0 0 4px;line-height:1.15;}
  p.reference{text-align:center;font-size:10pt;color:var(--gris);margin:0 0 22px;}
  .encadre{background:var(--bleu-pale);border-left:4px solid var(--bleu);
           padding:14px 18px;margin:18px 0;}
  p.nom{font-size:16pt;font-weight:700;color:var(--bleu-fonce);margin:0;text-align:left;}
  p.cursus{margin:6px 0 0;font-size:9.5pt;color:#4a5b64;text-align:left;}
  .signature{margin-top:26px;text-align:right;}
  .signature .lieu-date{margin:0;text-align:right;}
  .griffe{display:inline-flex;align-items:flex-end;gap:3mm;margin-top:10px;}
  .griffe .mention{font-weight:700;font-size:11pt;white-space:nowrap;padding-bottom:6mm;}
  /* Zone réservée aux marques : garde la même hauteur sans griffe installée,
     pour que le document imprimé laisse la place d'une signature manuscrite. */
  .marques{position:relative;display:inline-block;width:66mm;height:36mm;}
  .marques img{position:absolute;}
  /* Le mode multiply fait disparaître le fond blanc d'un cachet scanné en
     JPEG : sans lui, un carré opaque masquerait ce qu'il recouvre. */
  .marques .paraphe{left:0;bottom:3mm;max-height:31mm;max-width:44mm;mix-blend-mode:multiply;}
  .marques .tampon{right:0;bottom:0;max-height:35mm;max-width:38mm;mix-blend-mode:multiply;}
  .verif{margin-top:14px;padding-top:10px;border-top:1px solid #e3edf2;display:flex;
         gap:12px;align-items:center;font-size:8pt;color:var(--gris);}
  @page{size:A4;margin:0;}
  @media print{body{background:#fff;}.page{margin:0;}}
</style>
</head>
<body>
<div class="page">
  <img class="entete" src="${LETTERHEAD_TOP}" alt="Bridge Technologies Solutions">
  <div class="corps">
    <div class="kicker">Bridge Technologies Solutions</div>
    <h1>Attestation de stage</h1>
    <p class="reference">Réf. ${esc(options.reference)}</p>

    <p>La société <strong>${COMPANY_LEGAL_NAME}</strong> atteste que :</p>

    <div class="encadre">
      <p class="nom">${esc(fullName)}</p>
      <p class="cursus">${esc(profile.field)} — ${esc(profile.level)}<br>${esc(profile.school)}</p>
    </div>

    <p>a effectué un <strong>stage ${TYPE_LABELS[type].toLowerCase()}</strong> au sein de
      notre entreprise du <strong>${frDate(startDate)}</strong> au
      <strong>${frDate(endDate)}</strong>, soit une durée de
      <strong>${durationMonths} mois</strong>${encadrement}.</p>

    <p>En foi de quoi nous lui délivrons la présente attestation pour servir et
      valoir ce que de droit.</p>

    <div class="signature">
      <p class="lieu-date">${esc(ATTESTATION_CITY)}, le ${frDate(options.issuedAt)}</p>
      <div class="griffe">
        <span class="mention">${esc(ATTESTATION_SIGNATORY_MENTION)}</span>
        <span class="marques">${marques}</span>
      </div>
    </div>

    <div class="verif">
      <div>Document généré par la plateforme Bridge. Authenticité vérifiable
        auprès de la DRH avec la référence ${esc(options.reference)} et le code
        de suivi <strong>${esc(options.verificationCode)}</strong>.</div>
    </div>
  </div>
  <img class="pied" src="${LETTERHEAD_BOTTOM}" alt="">
</div>
${options.autoPrint ? '<script>window.addEventListener("load",()=>window.print());</script>' : ""}
</body>
</html>`;
}
