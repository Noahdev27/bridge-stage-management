import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/db/prisma";
import { recordAudit } from "@/shared/audit/audit";
import {
  RATE_LIMITS,
  clientIpFrom,
  consumeRateLimit,
  isRateLimited,
} from "@/shared/security/rate-limit";
import { buildSessionRefresh, readSessionRefresh } from "./session-version";

/**
 * Trop d'échecs récents : la connexion est refusée sans même comparer le mot
 * de passe. Le code est relu par les pages de connexion pour afficher un
 * message dédié plutôt que « identifiants incorrects ».
 */
export class TooManyLoginAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}

export const TOO_MANY_ATTEMPTS_CODE = "too_many_attempts";

/**
 * Empreinte bcrypt factice, comparée quand le compte n'existe pas : la
 * réponse prend alors le même temps qu'un mauvais mot de passe, et la durée
 * ne révèle plus quelles adresses sont inscrites.
 */
const DUMMY_HASH = "$2b$10$NokpYvhNfY.4oc6hVj7XtO4DY3UyjPIRoTyswAdKszDJGfCnd.31W";

/**
 * Les connexions ne sont journalisées que pour les comptes du back-office : ce
 * sont eux dont la compromission ouvre les dossiers. Les connexions candidates
 * n'y figurent pas (donnée personnelle, volume), pas plus que les tentatives
 * sur une adresse inconnue.
 */
const STAFF_ROLES = new Set(["ADMIN", "RH", "TUTOR"]);

/**
 * Configuration NextAuth (Auth.js v5) pour le back-office.
 * Authentification par identifiants (email + mot de passe) avec rôles.
 * Stratégie JWT (obligatoire avec le provider Credentials).
 */
export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        const rawEmail = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!rawEmail || !password) return null;

        // Même normalisation qu'à l'inscription, sinon une différence de casse
        // empêcherait de retrouver le compte.
        const email = rawEmail.trim().toLowerCase();
        const ip = clientIpFrom(request.headers);

        // Force brute : au-delà de 5 échecs sur un compte, ou de 20 depuis une
        // même adresse, en 15 minutes, on refuse avant toute vérification.
        const [accountLimit, ipLimit] = await Promise.all([
          isRateLimited(RATE_LIMITS.loginFailuresPerAccount, email),
          isRateLimited(RATE_LIMITS.loginFailuresPerIp, ip),
        ]);
        if (!accountLimit.allowed || !ipLimit.allowed) {
          throw new TooManyLoginAttempts();
        }

        const recordFailure = () =>
          Promise.all([
            consumeRateLimit(RATE_LIMITS.loginFailuresPerAccount, email),
            consumeRateLimit(RATE_LIMITS.loginFailuresPerIp, ip),
          ]);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await bcrypt.compare(password, DUMMY_HASH);
          await recordFailure();
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);
        const isStaff = STAFF_ROLES.has(user.role);

        if (!valid) {
          await recordFailure();
          // Un enchaînement d'échecs sur un compte du back-office est le signe
          // d'une attaque par force brute : c'est ce que cette trace rend visible.
          if (isStaff) {
            await recordAudit(
              { email: user.email, role: user.role },
              {
                action: "auth.login_failed",
                summary: "Mot de passe incorrect",
                targetType: "user",
                targetId: user.id,
              }
            );
          }
          return null;
        }

        // Un compte candidat non vérifié n'ouvre pas de session : c'est le
        // contrôle qui fait autorité, l'inscription seule ne prouve pas que le
        // titulaire détient l'adresse déclarée. Les comptes du back-office sont
        // provisionnés par un administrateur et ne sont pas concernés.
        if (user.role === "CANDIDATE" && !user.emailVerifiedAt) return null;

        if (isStaff) {
          await recordAudit(
            { email: user.email, role: user.role },
            {
              action: "auth.login_success",
              summary: "Connexion au back-office",
              targetType: "user",
              targetId: user.id,
            }
          );
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.userId = user.id;
        token.sessionVersion = user.sessionVersion ?? 0;
        return token;
      }

      // Chaque lecture de session côté serveur revérifie le compte : un mot de
      // passe changé (version incrémentée) ou un compte supprimé met fin aux
      // sessions ouvertes, sans attendre l'expiration du JWT.
      const userId = token.userId ?? token.sub;
      if (!userId) return token;

      try {
        const account = await prisma.user.findUnique({
          where: { id: userId },
          select: { sessionVersion: true },
        });
        if (!account) return null;

        if (trigger === "update") {
          const refreshed = readSessionRefresh(session, userId);
          if (refreshed !== null && refreshed === account.sessionVersion) {
            token.sessionVersion = refreshed;
          }
        }

        // Un JWT émis avant l'ajout de la version n'en porte pas : il vaut 0,
        // comme la version initiale de tout compte.
        if ((token.sessionVersion ?? 0) !== account.sessionVersion) return null;
      } catch (error) {
        // Base momentanément injoignable : on garde la session plutôt que de
        // déconnecter tout le monde. Les gardes refont leurs propres lectures.
        console.error("[auth] Vérification de session impossible :", error);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.role) {
          session.user.role = token.role as typeof session.user.role;
        }
        session.user.id = (token.userId as string | undefined) ?? token.sub ?? "";
      }
      return session;
    },
  },
});

/**
 * Garde ouverte la session de la personne qui vient de changer son mot de
 * passe : ses autres sessions, elles, sont refusées à leur prochaine lecture.
 */
export async function keepCurrentSession(userId: string, version: number): Promise<void> {
  try {
    await unstable_update({ sessionRefresh: buildSessionRefresh(userId, version) });
  } catch (error) {
    // Au pire, la personne devra se reconnecter : le changement reste acquis.
    console.error("[auth] Mise à jour de la session impossible :", error);
  }
}
