import "server-only";

import { prisma } from "@/shared/db/prisma";
import { getAppUrl } from "@/shared/config/app-url";
import { STATUS_LABELS, TYPE_LABELS } from "@/shared/constants/domain";
import { notifyTrackingCodeReminder } from "@/features/notifications/send-notification";

/**
 * Renvoi du code de suivi à l'adresse du dossier.
 *
 * Depuis que l'écran de confirmation n'affiche plus le code, l'email de
 * soumission en est le seul porteur : sans cette porte de sortie, un candidat
 * sans compte qui perd cet email n'a plus aucun accès à son dossier.
 *
 * Le code n'est jamais renvoyé à l'écran, uniquement à l'adresse enregistrée
 * sur le dossier — sinon le formulaire deviendrait un moyen de récupérer le
 * code de n'importe qui à partir de son adresse.
 *
 * Volontairement hors d'un fichier "use server" : ces fonctions ne doivent pas
 * être exposées comme Server Actions.
 */

/**
 * Délai minimal entre deux renvois pour une même adresse. Plus long que celui
 * de la vérification d'adresse ou du mot de passe (2 min) : rien ne presse ici,
 * le candidat consulte sa boîte quand il veut, et le palier protège d'autant
 * mieux la boîte d'un tiers dont on connaîtrait l'adresse.
 */
const RESEND_COOLDOWN_MS = 5 * 60 * 1000;

function isWithinCooldown(sentAt: Date | null): boolean {
  if (!sentAt) return false;
  return Date.now() - sentAt.getTime() < RESEND_COOLDOWN_MS;
}

/**
 * Envoie à `email` les codes de suivi de tous les dossiers rattachés à cette
 * adresse. Sans effet si l'adresse ne porte aucun dossier, ou si un envoi a
 * déjà eu lieu récemment.
 *
 * @returns `true` si un email est parti.
 */
export async function resendTrackingCodes(email: string): Promise<boolean> {
  // `Profile.email` n'est pas unique : une même adresse peut porter plusieurs
  // candidatures. On les regroupe dans un seul email plutôt que d'en envoyer un
  // par dossier, qui ressemblerait à du spam et multiplierait le palier.
  //
  // `mode: "insensitive"` : le formulaire de candidature enregistre l'adresse
  // telle que saisie, sans passer en minuscules. Une comparaison stricte
  // laisserait sans recours quiconque a écrit « Jean.Dupont@… » à l'époque.
  const profiles = await prisma.profile.findMany({
    where: {
      email: { equals: email, mode: "insensitive" },
      request: { isNot: null },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      trackingCodeSentAt: true,
      request: {
        select: {
          trackingCode: true,
          type: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: { request: { createdAt: "desc" } },
  });

  if (profiles.length === 0) return false;

  const lastSentAt = profiles.reduce<Date | null>((latest, profile) => {
    if (!profile.trackingCodeSentAt) return latest;
    if (!latest || profile.trackingCodeSentAt > latest) {
      return profile.trackingCodeSentAt;
    }
    return latest;
  }, null);

  if (isWithinCooldown(lastSentAt)) return false;

  const items = profiles.flatMap((profile) =>
    profile.request
      ? [
          {
            trackingCode: profile.request.trackingCode,
            typeLabel: TYPE_LABELS[profile.request.type],
            statusLabel: STATUS_LABELS[profile.request.status],
            submittedOn: profile.request.createdAt.toLocaleDateString("fr-FR"),
          },
        ]
      : []
  );

  if (items.length === 0) return false;

  const [firstProfile] = profiles;
  const candidateName =
    `${firstProfile.firstName} ${firstProfile.lastName}`.trim() || "Candidat";

  // Le palier est posé avant l'envoi : `safeSend` avale les échecs SMTP, donc
  // attendre le retour ne dirait rien de plus et laisserait une fenêtre pour
  // relancer en boucle si le transport est lent.
  await prisma.profile.updateMany({
    where: { id: { in: profiles.map((profile) => profile.id) } },
    data: { trackingCodeSentAt: new Date() },
  });

  // Destinataire : l'adresse telle qu'enregistrée sur le dossier, pas la forme
  // normalisée servant à la recherche.
  await notifyTrackingCodeReminder({
    to: firstProfile.email,
    candidateName,
    items,
    suiviUrl: `${getAppUrl()}/suivi`,
  });

  return true;
}
