import { notFound, redirect } from "next/navigation";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { getRhById } from "@/features/comptes-rh/queries";
import { RhEditForm } from "@/features/comptes-rh/components/RhEditForm";

interface EditRhPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRhPage({ params }: EditRhPageProps) {
  try {
    await requireManager();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/rh");
    throw error;
  }

  const { id } = await params;
  // `getRhById` filtre sur `role: "RH"` : un id d'ADMIN retombe sur notFound,
  // cet écran ne sert pas à modifier un compte au-dessus du sien.
  const rh = await getRhById(id);

  if (!rh) notFound();

  return <RhEditForm rh={rh} />;
}
