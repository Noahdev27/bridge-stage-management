import "server-only";

import QRCode from "qrcode";
import { getAppUrl } from "@/shared/config/app-url";
import { ensureVerifyCode } from "./queries";

/** Chemin public de la page de vérification d'une attestation. */
export const VERIFY_PAGE_PATH = "/attestation/verifier";

/**
 * Données de vérification imprimées sur l'attestation : code dédié, adresse
 * de la page publique et QR code menant à cette page, déjà renseignée.
 */
export async function buildAttestationVerification(requestId: string) {
  const code = await ensureVerifyCode(requestId);
  const url = `${getAppUrl()}${VERIFY_PAGE_PATH}?code=${code}`;
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#014B6A", light: "#FFFFFF" },
  });
  return { verificationCode: code, verificationUrl: url, verificationQrSvg: svg };
}
