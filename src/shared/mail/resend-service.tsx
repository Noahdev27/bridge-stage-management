// src/shared/mail/resend-service.tsx
import { Resend } from "resend";
import type { ReactElement } from "react";

// Nécessite RESEND_API_KEY dans le .env.
const resend = new Resend(process.env.RESEND_API_KEY);

// Adresse expéditrice configurable via EMAIL_FROM (fallback domaine de test Resend).
const FROM = process.env.EMAIL_FROM ?? "Bridge <onboarding@resend.dev>";

type SendEmailParams = {
  to: string;
  subject: string;
  react: ReactElement;
};

export const sendEmail = async ({ to, subject, react }: SendEmailParams) => {
  return resend.emails.send({
    from: FROM,
    to: [to],
    subject,
    react,
  });
};