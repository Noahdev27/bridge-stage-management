import { redirect } from "next/navigation";
import { AuthorizationError, requireStaff } from "@/shared/auth/guards";
import { prisma } from "@/shared/db/prisma";
import { ProfileForm } from "@/features/parametres/components/ProfileForm";
import { ChangePasswordForm } from "@/features/parametres/components/ChangePasswordForm";
import { AttestationBrandingForm } from "@/features/attestation/components/AttestationBrandingForm";
import {
  getAttestationSettings,
  loadAttestationBranding,
} from "@/features/attestation/settings";

export default async function ParametresPage() {
  let viewer;
  try {
    viewer = await requireStaff();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/login");
    throw error;
  }

  // La griffe engage l'entreprise : seul un administrateur la consulte et la
  // modifie, un gestionnaire RH ne voit que son propre compte.
  const isAdmin = viewer.role === "ADMIN";

  const [account, branding, brandingMeta] = await Promise.all([
    prisma.user.findUnique({
      where: { email: viewer.email },
      select: { name: true },
    }),
    isAdmin
      ? loadAttestationBranding()
      : Promise.resolve({ signatureDataUri: null, stampDataUri: null }),
    isAdmin ? getAttestationSettings() : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-base-content/60 mt-1">
          {isAdmin
            ? "Gérez votre compte et les mentions apposées sur les documents délivrés."
            : "Gérez les informations de votre compte et votre mot de passe."}
        </p>
      </div>

      <ProfileForm
        email={viewer.email}
        role={viewer.role}
        currentName={account?.name ?? null}
      />

      <ChangePasswordForm />

      {isAdmin && (
        <AttestationBrandingForm
          signaturePreview={branding.signatureDataUri}
          stampPreview={branding.stampDataUri}
          updatedByEmail={brandingMeta?.updatedByEmail ?? null}
          updatedAt={brandingMeta?.updatedAt ?? null}
        />
      )}
    </div>
  );
}
