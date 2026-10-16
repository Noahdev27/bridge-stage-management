import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/db/prisma";

/**
 * Configuration NextAuth (Auth.js v5) pour le back-office.
 * Authentification par identifiants (email + mot de passe) avec rôles.
 * Stratégie JWT (obligatoire avec le provider Credentials).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!rawEmail || !password) return null;

        // Même normalisation qu'à l'inscription, sinon une différence de casse
        // empêcherait de retrouver le compte.
        const email = rawEmail.trim().toLowerCase();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // Un compte candidat non vérifié n'ouvre pas de session : c'est le
        // contrôle qui fait autorité, l'inscription seule ne prouve pas que le
        // titulaire détient l'adresse déclarée. Les comptes du back-office sont
        // provisionnés par un administrateur et ne sont pas concernés.
        if (user.role === "CANDIDATE" && !user.emailVerifiedAt) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.userId = user.id;
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
