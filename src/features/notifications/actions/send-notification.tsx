"use server"; // Indispensable pour une Server Action

import type { ReactElement } from "react";
import type { RequestStatus } from "@prisma/client";
import { sendEmail } from "@/shared/mail/resend-service";
import { STATUS_LABELS } from "@/shared/constants/domain";
import SubmissionConfirmationEmail from "@/features/notifications/templates/SubmissionConfirmationEmail";
import StatusChangedEmail from "@/features/notifications/templates/StatusChangedEmail";

// Envoi tolérant aux pannes : une notification qui échoue ne doit jamais
// bloquer le parcours candidat ni le traitement RH.
const safeSend = async (params: { to: string; subject: string; react: ReactElement }) => {
  try {
    await sendEmail(params);
  } catch (error) {
    console.error("Notification email échouée (non bloquant) :", error);
  }
};

export const notifySubmission = async (email: string, name: string, code: string) => {
  await safeSend({
    to: email,
    subject: "Confirmation de candidature - Bridge",
    react: <SubmissionConfirmationEmail candidateName={name} trackingCode={code} />,
  });
};

export const notifyStatusChange = async (
  email: string,
  name: string,
  status: RequestStatus,
  code: string,
) => {
  await safeSend({
    to: email,
    subject: `Statut de votre candidature : ${STATUS_LABELS[status]}`,
    react: <StatusChangedEmail candidateName={name} status={status} trackingCode={code} />,
  });
};