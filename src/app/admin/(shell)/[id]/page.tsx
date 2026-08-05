import { redirect } from "next/navigation";
import { getCandidatureById, getTutors } from "@/features/demandes-admin/queries";
import {
  AuthorizationError,
  MANAGER_ROLES,
  requireStaff,
} from "@/shared/auth/guards";
import { EvaluationForm } from "@/features/demandes-admin/components/EvaluationForm";
import { StatusActionBar } from "@/features/demandes-admin/components/StatusActionBar";
import { TutorAssignForm } from "@/features/demandes-admin/components/TutorAssignForm";
import { DocumentViewer } from "@/features/demandes-admin/components/DocumentViewer";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Star,
  UserCheck,
  MessageSquareText,
} from "lucide-react";
import { DEPARTMENT_LABELS } from "@/shared/constants/domain";

interface DetailAdminPageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailAdminPage({ params }: DetailAdminPageProps) {
  let viewer;
  try {
    viewer = await requireStaff();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/login");
    throw error;
  }

  const isManager = MANAGER_ROLES.includes(viewer.role);
  const { id } = await params;
  const [candidature, tutors] = await Promise.all([
    getCandidatureById(id, viewer),
    isManager ? getTutors() : Promise.resolve([]),
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

  const {
    profile,
    documents,
    status,
    type,
    createdAt,
    evaluation,
    tutor,
    offer,
    decisionComment,
  } = candidature;

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
            <StatusBadge status={status} size="md" />
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

        {isManager && (
          <StatusActionBar
            requestId={id}
            status={status}
            decisionComment={decisionComment}
          />
        )}
      </div>

      {/* Trace de ce que le candidat a réellement reçu avec sa décision. */}
      {decisionComment && (
        <div
          className={`card bg-base-100 border shadow-sm mb-8 ${
            status === "REJECTED" ? "border-error/30" : "border-success/30"
          }`}
        >
          <div className="card-body p-5 gap-2">
            <div className="flex items-center gap-2">
              <MessageSquareText
                className={`w-5 h-5 ${
                  status === "REJECTED" ? "text-error" : "text-success"
                }`}
                aria-hidden="true"
              />
              <h2 className="card-title text-lg">
                {status === "REJECTED"
                  ? "Motif communiqué au candidat"
                  : "Message communiqué au candidat"}
              </h2>
            </div>
            <p className="text-sm text-base-content/70 whitespace-pre-line">
              {decisionComment}
            </p>
            <p className="text-xs text-base-content/40">
              Envoyé par email à {profile.email}.
            </p>
          </div>
        </div>
      )}

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

        {/* Assignation et évaluation sont réservées à la RH ; le tuteur
            consulte le dossier qui lui a été confié en lecture seule. */}
        <div className="space-y-6">
          {isManager ? (
            <>
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
            </>
          ) : (
            <>
              <div className="card bg-base-100 border border-base-300 shadow-sm">
                <div className="card-body p-5 gap-2">
                  <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                    <UserCheck className="w-5 h-5 text-primary" aria-hidden="true" />
                    <h2 className="card-title text-lg">Tuteur</h2>
                  </div>
                  <p className="text-sm font-medium">
                    {tutor?.name || tutor?.email || "Aucun tuteur assigné"}
                  </p>
                </div>
              </div>
              {evaluation && (
                <div className="card bg-base-100 border border-base-300 shadow-sm">
                  <div className="card-body p-5 gap-2">
                    <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                      <Star className="w-5 h-5 text-primary" aria-hidden="true" />
                      <h2 className="card-title text-lg">Évaluation interne</h2>
                    </div>
                    <p className="text-sm font-medium">
                      Note : {evaluation.rating} / 5
                    </p>
                    {evaluation.comment && (
                      <p className="text-sm text-base-content/70 whitespace-pre-line">
                        {evaluation.comment}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
