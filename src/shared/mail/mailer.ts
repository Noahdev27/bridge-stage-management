import "server-only";
import nodemailer from "nodemailer";

/**
 * Transport SMTP (Office365 par défaut). Config via variables d'environnement :
 * SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS / SMTP_FROM.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  // false = STARTTLS sur le port 587 (Office365) ; true = TLS direct (port 465).
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

/** Envoie un email HTML. L'expéditeur doit correspondre au compte SMTP authentifié. */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  return transporter.sendMail({ from, to, subject, html });
}
