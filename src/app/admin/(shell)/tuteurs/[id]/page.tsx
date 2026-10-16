import { notFound, redirect } from "next/navigation";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { getTutorById } from "@/features/tuteurs/queries";
import { TutorEditForm } from "@/features/tuteurs/components/TutorEditForm";

interface EditTutorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTutorPage({ params }: EditTutorPageProps) {
  try {
    await requireManager();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/tuteurs");
    throw error;
  }

  const { id } = await params;
  const tutor = await getTutorById(id);

  if (!tutor) notFound();

  return <TutorEditForm tutor={tutor} />;
}
