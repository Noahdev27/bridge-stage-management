import "server-only";

import type { InternshipType, RequestStatus } from "@prisma/client";
import { render } from "@react-email/render";
import { sendEmail } from "@/shared/mail/mailer";
import { STATUS_LABELS, TYPE_LABELS } from "@/shared/constants/domain";
import SubmissionConfirmationEmail from "@/features/notifications/templates/SubmissionConfirmationEmail";
import StatusChangedEmail from "@/features/notifications/templates/StatusChangedEmail";
import TutorAssignedEmail from "@/features/notifications/templates/TutorAssignedEmail";
import NewApplicationEmail from "@/features/notifications/templates/NewApplicationEmail";
import EmailVerificationEmail from "@/features/notifications/templates/EmailVerificationEmail";
import PasswordResetEmail from "@/features/notifications/templates/PasswordResetEmail";
import StaffPasswordResetCodeEmail from "@/features/notifications/templates/StaffPasswordResetCodeEmail";
import PasswordChangedEmail from "@/features/notifications/templates/PasswordChangedEmail";
import { getAppUrl } from "@/shared/config/app-url";
import TrackingCodeReminderEmail, {
  type TrackingCodeReminderItem,
} from "@/features/notifications/templates/TrackingCodeReminderEmail";

/**
 * Envoi des emails transactionnels.
 *
 * Ce module n'est PAS un fichier "use server" : exposer ces fonctions comme
 * Server Actions permettrait à n'importe qui d'envoyer des emails arbitraires
 * via la plateforme. Elles sont appelées uniquement depuis du code serveur.
 */

// Envoi tolérant aux pannes : une notification qui échoue ne doit jamais
// bloquer le parcours candidat ni le traitement RH.
// Renvoie `false` en cas d'échec, pour les rares appelants qui doivent prévenir
// l'utilisateur (le code de suivi n'est transmis que par email).
const safeSend = async (params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> => {
  try {
    await sendEmail(params);
    return true;
  } catch (error) {
    console.error("Notification email échouée (non bloquant) :", error);
    return false;
  }
};

export const notifySubmission = async (
  email: string,
  name: string,
  code: string
): Promise<boolean> => {
  const html = await render(
    <SubmissionConfirmationEmail candidateName={name} trackingCode={code} />
  );
  return safeSend({
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

export const notifyStaffPasswordResetCode = async ({
  to,
  name,
  code,
  validityMinutes,
}: {
  to: string;
  name: string | null;
  code: string;
  validityMinutes: number;
}) => {
  const html = await render(
    <StaffPasswordResetCodeEmail
      name={name || "collègue"}
      code={code}
      validityMinutes={validityMinutes}
    />
  );
  await safeSend({
    to,
    // Le code figure dans l'objet : il se lit dans la notification du
    // téléphone sans ouvrir l'email.
    subject: `${code} : votre code de réinitialisation - Bridge`,
    html,
  });
};

/**
 * Alerte envoyée après tout changement ou réinitialisation de mot de passe :
 * c'est le seul moyen pour le titulaire de remarquer qu'un tiers a pris la
 * main sur son compte.
 */
export const notifyPasswordChanged = async ({
  to,
  name,
  role,
  method,
}: {
  to: string;
  name: string | null;
  role: string;
  method: "change" | "reset";
}) => {
  const isStaff = role !== "CANDIDATE";
  const changedAt = new Date().toLocaleString("fr-FR", {
    timeZone: "Africa/Douala",
    dateStyle: "long",
    timeStyle: "short",
  });
  const html = await render(
    <PasswordChangedEmail
      name={name || (isStaff ? "collègue" : "Candidat")}
      changedAt={changedAt}
      method={method}
      isStaff={isStaff}
      recoveryUrl={`${getAppUrl()}${isStaff ? "/admin" : "/candidat"}/mot-de-passe-oublie`}
    />
  );
  await safeSend({
    to,
    subject: "Votre mot de passe a été modifié - Bridge",
    html,
  });
};

export const notifyTrackingCodeReminder = async ({
  to,
  candidateName,
  items,
  suiviUrl,
}: {
  to: string;
  candidateName: string;
  items: TrackingCodeReminderItem[];
  suiviUrl: string;
}) => {
  const html = await render(
    <TrackingCodeReminderEmail
      candidateName={candidateName}
      items={items}
      suiviUrl={suiviUrl}
    />
  );
  await safeSend({
    to,
    subject:
      items.length > 1
        ? "Vos codes de suivi - Bridge"
        : "Votre code de suivi - Bridge",
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

/**
 * Prévient l'équipe RH d'une nouvelle candidature.
 *
 * Un message par destinataire plutôt qu'un envoi groupé : les adresses de
 * l'équipe ne doivent pas apparaître les unes aux autres.
 */
export const notifyNewApplication = async ({
  recipients,
  candidateName,
  internshipType,
  offerTitle,
  dossierUrl,
}: {
  recipients: string[];
  candidateName: string;
  internshipType: InternshipType;
  offerTitle: string | null;
  dossierUrl: string;
}) => {
  if (recipients.length === 0) return;
  const html = await render(
    <NewApplicationEmail
      candidateName={candidateName}
      internshipTypeLabel={TYPE_LABELS[internshipType]}
      offerTitle={offerTitle}
      dossierUrl={dossierUrl}
    />
  );
  await Promise.all(
    recipients.map((to) =>
      safeSend({
        to,
        subject: `Nouvelle candidature : ${candidateName}`,
        html,
      })
    )
  );
};
