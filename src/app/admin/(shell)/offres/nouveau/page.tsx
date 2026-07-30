import { redirect } from "next/navigation";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { OfferForm } from "@/features/offres/components/admin/OfferForm";

export default async function CreateOfferPage() {
  try {
    await requireManager();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/offres");
    throw error;
  }

  return <OfferForm mode="create" />;
}
