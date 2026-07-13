import { getCandidatureById } from "@/features/demandes-admin/queries";
import { updateCandidatureStatus } from "@/features/demandes-admin/actions";
import { EvaluationForm } from "@/features/demandes-admin/components/EvaluationForm";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Settings2,
  Check,
  X,
  FileText,
} from "lucide-react";
import { STATUS_LABELS } from "@/shared/constants/domain";
import type { RequestStatus } from "@prisma/client";

interface DetailAdminPageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailAdminPage({ params }: DetailAdminPageProps) {
  const { id } = await params;
  const candidature = await getCandidatureById(id);

  if (!candidature) {
    return (
      <main className="p-6 max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-error">Dossier introuvable</h1>
        <p className="text-base-content/60 mt-2">La candidature demandée n'existe pas ou a été supprimée.</p>
        <Link href="/admin" className="btn btn-primary mt-6 gap-2">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Retourner à la liste
        </Link>
      </main>
    );
  }

  const { profile, documents, status, type, createdAt, evaluation } = candidature;

  const handleStatusChange = async (formData: FormData) => {
    "use server";
    const nextStatus = formData.get("status");
    if (
      nextStatus === "PENDING" ||
      nextStatus === "PROCESS" ||
      nextStatus === "ACCEPTED" ||
      nextStatus === "REJECTED"
    ) {
      await updateCandidatureStatus(id, nextStatus);
    }
  };
  const getStatusBadgeClass = (currentStatus: string) => {
    switch (currentStatus) {
      case "PENDING": return "badge-warning text-warning-content";
      case "PROCESS": return "badge-info text-info-content";
      case "ACCEPTED": return "badge-success text-white";
      case "REJECTED": return "badge-error text-white";
      default: return "badge-ghost";
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      {/* Fil d'Ariane / Retour */}
      <div className="mb-6">
        <Link href="/admin" className="text-sm link link-hover text-primary font-medium inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Retour à l'Espace Recrutement
        </Link>
      </div>

      {/* En-tête du Dossier */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-base-300 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">
              {profile.firstName} {profile.lastName}
            </h1>
            <span className={`badge ${getStatusBadgeClass(status)} font-semibold px-2.5 py-1`}>
              {STATUS_LABELS[status as RequestStatus]}
            </span>
          </div>
          <p className="text-base-content/60 mt-1 inline-flex items-center gap-1.5 flex-wrap">
            Demande de stage
            {type === "ACADEMIC" ? (
              <GraduationCap className="w-4 h-4 text-primary" aria-hidden="true" />
            ) : (
              <Briefcase className="w-4 h-4 text-primary" aria-hidden="true" />
            )}
            <span className="font-medium text-base-content/80">
              {type === "ACADEMIC" ? "Académique" : "Professionnel"}
            </span>
            — Soumis le{" "}
            {new Date(createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Barre d'actions RH rapide */}
        <form action={handleStatusChange} className="flex gap-2 flex-wrap">
          {status !== "PROCESS" && status !== "ACCEPTED" && status !== "REJECTED" && (
            <button type="submit" name="status" value="PROCESS" className="btn btn-sm btn-info text-white gap-1.5">
              <Settings2 className="w-4 h-4" aria-hidden="true" />
              Traiter
            </button>
          )}
          {status !== "ACCEPTED" && (
            <button type="submit" name="status" value="ACCEPTED" className="btn btn-sm btn-success text-white gap-1.5">
              <Check className="w-4 h-4" aria-hidden="true" />
              Accepter
            </button>
          )}
          {status !== "REJECTED" && (
            <button type="submit" name="status" value="REJECTED" className="btn btn-sm btn-error text-white gap-1.5">
              <X className="w-4 h-4" aria-hidden="true" />
              Refuser
            </button>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Infos Personnelles & Éducation */}
        <div className="md:col-span-2 space-y-6">
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-lg border-b border-base-200 pb-2 mb-4">Informations Personnelles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-base-content/50 font-medium">Email</span>
                  <a href={`mailto:${profile.email}`} className="text-primary link link-hover font-semibold">
                    {profile.email}
                  </a>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">Téléphone</span>
                  <span className="font-semibold text-base-content">{profile.phone}</span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">Établissement / École</span>
                  <span className="font-semibold text-base-content">{profile.school}</span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">Filière / Spécialité</span>
                  <span className="font-semibold text-base-content">{profile.field}</span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">Niveau d'études</span>
                  <span className="font-semibold text-base-content">{profile.level}</span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">Durée demandée</span>
                  <span className="font-semibold text-base-content">{candidature.duration} mois</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des Documents Jointe */}
        <div className="space-y-6">
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-lg border-b border-base-200 pb-2 mb-4">Pièces Jointes</h2>
              {documents.length === 0 ? (
                <p className="text-sm text-base-content/50 italic">Aucun document transmis.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-base-200 bg-base-200/30 hover:bg-base-200 hover:border-base-300 transition-all text-sm group"
                    >
                      <span className="inline-flex items-center gap-1.5 font-medium text-base-content/80 truncate max-w-[180px]">
                        <FileText className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" />
                        <span className="truncate">{doc.label}</span>
                      </span>
                      <span className="text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Ouvrir
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <EvaluationForm
            requestId={candidature.id}
            initialRating={evaluation?.rating}
            initialComment={evaluation?.comment}
            lastUpdatedAt={evaluation?.updatedAt}
            authorLabel={
              evaluation?.author?.name || evaluation?.author?.email || null
            }
          />
        </div>
      </div>
    </main>
  );
}