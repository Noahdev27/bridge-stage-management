import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Ajoute le champ `role` au type User / Session de NextAuth.
declare module "next-auth" {
  interface User {
    role: Role;
    sessionVersion?: number;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
    /** Donnée de mise à jour uniquement (voir shared/auth/session-version.ts). */
    sessionRefresh?: { version: number; proof: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    userId?: string;
    sessionVersion?: number;
  }
}
