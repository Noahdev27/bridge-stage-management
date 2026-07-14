import { getCandidatureById, getTutors } from "@/features/demandes-admin/queries";
import { EvaluationForm } from "@/features/demandes-admin/components/EvaluationForm";
import { StatusActionBar } from "@/features/demandes-admin/components/StatusActionBar";
import { TutorAssignForm } from "@/features/demandes-admin/components/TutorAssignForm";
import { DocumentViewer } from "@/features/demandes-admin/components/DocumentViewer";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import {
  DEPARTMENT_LABELS,
  STATUS_LABELS,
} from "@/shared/constants/domain";
import type { RequestStatus } from "@prisma/client";

interface DetailAdminPageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailAdminPage({ params }: DetailAdminPageProps) {
  const { id } = await params;
  const [candidature, tutors] = await Promise.all([
    getCandidatureById(id),
    getTutors(),
  ]);

  if (!candidature) {
    return (
      <main className="p-6 max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-error">Dossier introuvable</h1>
        <p className="text-base-content/60 mt-2">
          La candidature demandée n&apos;existe pas ou a été supprimée.
        </p>
        <Link href="/admin" className="btn btn-primary mt-6 gap-2">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Retourner à la liste
        </Link>
      </main>
    );
  }

  const { profile, documents, status, type, createdAt, evaluation, tutor, offer } =
    candidature;

  const getStatusBadgeClass = (currentStatus: string) => {
    switch (currentStatus) {
      case "PENDING":
        return "badge-warning text-warning-content";
      case "PROCESS":
        return "badge-info text-info-content";
      case "ACCEPTED":
        return "badge-success text-white";
      case "REJECTED":
        return "badge-error text-white";
      default:
        return "badge-ghost";
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm link link-hover text-primary font-medium inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Retour à l&apos;Espace Recrutement
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-base-300 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">
              {profile.firstName} {profile.lastName}
            </h1>
            <span
              className={`badge ${getStatusBadgeClass(status)} font-semibold px-2.5 py-1`}
            >
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
            {new Date(createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <StatusActionBar requestId={id} status={status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-lg border-b border-base-200 pb-2 mb-4">
                Informations personnelles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-base-content/50 font-medium">
                    Email
                  </span>
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-primary link link-hover font-semibold"
                  >
                    {profile.email}
                  </a>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">
                    Téléphone
                  </span>
                  <span className="font-semibold text-base-content">
                    {profile.phone}
                  </span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">
                    Domicile (lieu-dit)
                  </span>
                  <span className="font-semibold text-base-content">
                    {profile.lieudit}
                  </span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">
                    Coordonnées GPS
                  </span>
                  <span className="font-semibold text-base-content">
                    {profile.latitude}, {profile.longitude}
                  </span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">
                    Proche 1
                  </span>
                  <span className="font-semibold text-base-content">
                    {profile.relativePhone1}
                  </span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">
                    Proche 2
                  </span>
                  <span className="font-semibold text-base-content">
                    {profile.relativePhone2}
                  </span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">
                    Établissement / École
                  </span>
                  <span className="font-semibold text-base-content">
                    {profile.school}
                  </span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">
                    Filière / Spécialité
                  </span>
                  <span className="font-semibold text-base-content">
                    {profile.field}
                  </span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">
                    Niveau d&apos;études
                  </span>
                  <span className="font-semibold text-base-content">
                    {profile.level}
                  </span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">
                    Durée demandée
                  </span>
                  <span className="font-semibold text-base-content">
                    {candidature.duration} mois
                  </span>
                </div>
                <div>
                  <span className="block text-base-content/50 font-medium">
                    Rapport de stage
                  </span>
                  <span className="font-semibold text-base-content">
                    {candidature.reportRequired ? "Oui" : "Non"}
                  </span>
                </div>
                {offer && (
                  <div className="sm:col-span-2">
                    <span className="block text-base-content/50 font-medium">
                      Offre liée
                    </span>
                    <span className="font-semibold text-base-content">
                      {offer.title} ({DEPARTMENT_LABELS[offer.department]})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-lg border-b border-base-200 pb-2 mb-4">
                Pièces jointes
              </h2>
              <DocumentViewer documents={documents} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <TutorAssignForm
            requestId={candidature.id}
            currentTutorId={tutor?.id}
            tutors={tutors}
          />
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
