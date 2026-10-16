import { notFound, redirect } from "next/navigation";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { getOfferByIdAdmin } from "@/features/offres/queries";
import { OfferForm } from "@/features/offres/components/admin/OfferForm";

interface EditOfferPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOfferPage({ params }: EditOfferPageProps) {
  try {
    await requireManager();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/offres");
    throw error;
  }

  const { id } = await params;
  const offer = await getOfferByIdAdmin(id);

  if (!offer) notFound();

  return <OfferForm mode="edit" offer={offer} />;
}
