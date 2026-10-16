import { redirect } from "next/navigation";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { RhCreateForm } from "@/features/comptes-rh/components/RhCreateForm";

export default async function CreateRhPage() {
  try {
    await requireManager();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/rh");
    throw error;
  }

  return <RhCreateForm />;
}
