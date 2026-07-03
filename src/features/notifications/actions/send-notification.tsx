"use server";

import type { RequestStatus } from "@prisma/client";
import { render } from "@react-email/render";
import { sendEmail } from "@/shared/mail/mailer";
import { STATUS_LABELS } from "@/shared/constants/domain";
import SubmissionConfirmationEmail from "@/features/notifications/templates/SubmissionConfirmationEmail";
import StatusChangedEmail from "@/features/notifications/templates/StatusChangedEmail";

// Envoi tolérant aux pannes : une notification qui échoue ne doit jamais
// bloquer le parcours candidat ni le traitement RH.
const safeSend = async (params: { to: string; subject: string; html: string }) => {
  try {
    await sendEmail(params);
  } catch (error) {
    console.error("Notification email échouée (non bloquant) :", error);
  }
};

export const notifySubmission = async (email: string, name: string, code: string) => {
  const html = await render(
    <SubmissionConfirmationEmail candidateName={name} trackingCode={code} />
  );
  await safeSend({
    to: email,
    subject: "Confirmation de candidature - Bridge",
    html,
  });
};

export const notifyStatusChange = async (
  email: string,
  name: string,
  status: RequestStatus,
  code: string,
) => {
  const html = await render(
    <StatusChangedEmail candidateName={name} status={status} trackingCode={code} />
  );
  await safeSend({
    to: email,
    subject: `Statut de votre candidature : ${STATUS_LABELS[status]}`,
    html,
  });
};
