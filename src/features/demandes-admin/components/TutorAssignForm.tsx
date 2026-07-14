"use client";

import { useTransition } from "react";
import { UserCheck } from "lucide-react";
import { assignTutor } from "../actions";
import { useToast } from "@/shared/ui/ToastProvider";

type TutorOption = {
  id: string;
  name: string | null;
  email: string;
};

interface TutorAssignFormProps {
  requestId: string;
  currentTutorId?: string | null;
  tutors: TutorOption[];
}

export function TutorAssignForm({
  requestId,
  currentTutorId,
  tutors,
}: TutorAssignFormProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleChange = (value: string) => {
    startTransition(async () => {
      const result = await assignTutor(requestId, value || null);
      if (result.error) {
        showToast({ type: "error", message: result.error });
        return;
      }
      showToast({
        type: "success",
        message: value ? "Tuteur assigné." : "Tuteur retiré.",
      });
    });
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-5 gap-3">
        <div className="flex items-center gap-2 border-b border-base-200 pb-3">
          <UserCheck className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="card-title text-lg">Tuteur</h2>
        </div>
        <label className="form-control">
          <span className="label py-1">
            <span className="label-text font-semibold">Assigner un tuteur</span>
          </span>
          <select
            className="select select-bordered select-sm"
            defaultValue={currentTutorId ?? ""}
            disabled={isPending || tutors.length === 0}
            onChange={(e) => handleChange(e.target.value)}
            aria-label="Sélectionner un tuteur"
          >
            <option value="">Aucun tuteur</option>
            {tutors.map((tutor) => (
              <option key={tutor.id} value={tutor.id}>
                {tutor.name || tutor.email}
              </option>
            ))}
          </select>
        </label>
        {tutors.length === 0 && (
          <p className="text-xs text-base-content/50">
            Aucun compte tuteur disponible. Créez un utilisateur avec le rôle
            Tuteur.
          </p>
        )}
      </div>
    </div>
  );
}
