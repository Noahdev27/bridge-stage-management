import { redirect } from "next/navigation";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { TutorCreateForm } from "@/features/tuteurs/components/TutorCreateForm";

export default async function CreateTutorPage() {
  try {
    await requireManager();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/tuteurs");
    throw error;
  }

  return <TutorCreateForm />;
}
