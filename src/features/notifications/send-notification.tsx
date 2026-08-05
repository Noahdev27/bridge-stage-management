import "server-only";

import type { InternshipType, RequestStatus } from "@prisma/client";
import { render } from "@react-email/render";
import { sendEmail } from "@/shared/mail/mailer";
import { STATUS_LABELS, TYPE_LABELS } from "@/shared/constants/domain";
import SubmissionConfirmationEmail from "@/features/notifications/templates/SubmissionConfirmationEmail";
import StatusChangedEmail from "@/features/notifications/templates/StatusChangedEmail";
import TutorAssignedEmail from "@/features/notifications/templates/TutorAssignedEmail";
import EmailVerificationEmail from "@/features/notifications/templates/EmailVerificationEmail";
import PasswordResetEmail from "@/features/notifications/templates/PasswordResetEmail";

/**
 * Envoi des emails transactionnels.
 *
 * Ce module n'est PAS un fichier "use server" : exposer ces fonctions comme
 * Server Actions permettrait à n'importe qui d'envoyer des emails arbitraires
 * via la plateforme. Elles sont appelées uniquement depuis du code serveur.
 */

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
  comment?: string | null,
) => {
  const html = await render(
    <StatusChangedEmail
      candidateName={name}
      status={STATUS_LABELS[status]}
      trackingCode={code}
      comment={comment}
      isRejection={status === "REJECTED"}
    />
  );
  await safeSend({
    to: email,
    subject: `Statut de votre candidature : ${STATUS_LABELS[status]}`,
    html,
  });
};

export const notifyEmailVerification = async ({
  to,
  candidateName,
  verificationUrl,
}: {
  to: string;
  candidateName: string | null;
  verificationUrl: string;
}) => {
  const html = await render(
    <EmailVerificationEmail
      candidateName={candidateName || "Candidat"}
      verificationUrl={verificationUrl}
    />
  );
  await safeSend({
    to,
    subject: "Confirmez votre adresse email - Bridge",
    html,
  });
};

export const notifyPasswordReset = async ({
  to,
  candidateName,
  resetUrl,
}: {
  to: string;
  candidateName: string | null;
  resetUrl: string;
}) => {
  const html = await render(
    <PasswordResetEmail
      candidateName={candidateName || "Candidat"}
      resetUrl={resetUrl}
    />
  );
  await safeSend({
    to,
    subject: "Réinitialisation de votre mot de passe - Bridge",
    html,
  });
};

export const notifyTutorAssignment = async ({
  to,
  tutorName,
  candidateName,
  internshipType,
  startDate,
}: {
  to: string;
  tutorName: string | null;
  candidateName: string;
  internshipType: InternshipType;
  startDate: Date;
  requestId: string;
}) => {
  const html = await render(
    <TutorAssignedEmail
      tutorName={tutorName || "Tuteur"}
      candidateName={candidateName}
      internshipTypeLabel={TYPE_LABELS[internshipType]}
      startDateLabel={startDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    />
  );
  await safeSend({
    to,
    subject: `Nouveau stagiaire à encadrer : ${candidateName}`,
    html,
  });
};
