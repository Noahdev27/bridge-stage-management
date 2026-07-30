import { redirect } from "next/navigation";
import { AuthorizationError, requireStaff } from "@/shared/auth/guards";
import { prisma } from "@/shared/db/prisma";
import { ProfileForm } from "@/features/parametres/components/ProfileForm";
import { ChangePasswordForm } from "@/features/parametres/components/ChangePasswordForm";

export default async function ParametresPage() {
  let viewer;
  try {
    viewer = await requireStaff();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/login");
    throw error;
  }

  const account = await prisma.user.findUnique({
    where: { email: viewer.email },
    select: { name: true },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-base-content/60 mt-1">
          Gérez les informations de votre compte et votre mot de passe.
        </p>
      </div>

      <ProfileForm
        email={viewer.email}
        role={viewer.role}
        currentName={account?.name ?? null}
      />

      <ChangePasswordForm />
    </div>
  );
}
