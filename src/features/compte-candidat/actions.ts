"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/shared/db/prisma";
import { candidateRegisterSchema } from "./schema";
import { auth, signIn } from "@/shared/auth/auth";

export type CandidateActionState = {
  error?: string;
  success?: boolean;
};

export async function registerCandidate(
  _prev: CandidateActionState,
  formData: FormData
): Promise<CandidateActionState> {
  const parsed = candidateRegisterSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const password = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      email: parsed.data.email,
      password,
      name: `${parsed.data.firstName} ${parsed.data.lastName}`,
      role: "CANDIDATE",
    },
  });

  return { success: true };
}

export async function loginCandidate(
  formData: FormData
): Promise<CandidateActionState | void> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/espace-candidat",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    throw err;
  }
}

export async function getCandidateRequests() {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "CANDIDATE") {
    return [];
  }

  return prisma.internshipRequest.findMany({
    where: { profile: { email: session.user.email } },
    include: { profile: true },
    orderBy: { createdAt: "desc" },
  });
}
