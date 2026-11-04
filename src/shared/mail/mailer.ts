import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envoi des emails transactionnels.
 *
 * Deux canaux, choisis par la configuration :
 * - **Resend** (recommandé) dès que `RESEND_API_KEY` est défini. Microsoft
 *   désactive par défaut l'envoi SMTP par mot de passe à partir de décembre
 *   2026, avant de le supprimer : un service transactionnel ne dépend pas de
 *   ce calendrier.
 * - **SMTP** (Office 365 par défaut) sinon, via SMTP_HOST / SMTP_PORT /
 *   SMTP_SECURE / SMTP_USER / SMTP_PASS / SMTP_FROM.
 */

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Expéditeur affiché, par exemple « Bridge Stages <stages@bridgetech-solutions.com> ». */
function senderAddress(): string | undefined {
  return process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
}

async function sendWithResend({ to, subject, html }: SendEmailParams) {
  const from = senderAddress();
  if (!from) {
    throw new Error("MAIL_FROM manquant : adresse d'expédition requise par Resend.");
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
    // Un envoi bloqué ne doit pas retenir la requête du candidat indéfiniment.
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    // Le corps porte le motif exact (domaine non vérifié, clé invalide…).
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend a refusé l'envoi (${response.status}) : ${detail.slice(0, 300)}`);
  }
}

// Créé à la première utilisation : sans configuration SMTP, rien n'est ouvert.
let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter {
  smtpTransporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    // false = STARTTLS sur le port 587 (Office 365) ; true = TLS direct (port 465).
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return smtpTransporter;
}

/** Canal utilisé, pour les messages de diagnostic. */
export function mailChannel(): "resend" | "smtp" {
  return process.env.RESEND_API_KEY ? "resend" : "smtp";
}

/** Envoie un email HTML par le canal configuré. Lève une erreur en cas d'échec. */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  if (mailChannel() === "resend") {
    await sendWithResend(params);
    return;
  }
  // En SMTP, l'expéditeur doit correspondre au compte authentifié.
  await getSmtpTransporter().sendMail({ from: senderAddress(), ...params });
}
