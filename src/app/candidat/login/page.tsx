import Link from "next/link";
import { CandidateLoginForm } from "@/features/compte-candidat/components/CandidateLoginForm";
import { ResendVerificationForm } from "@/features/compte-candidat/components/ResendVerificationForm";
import { ArrowLeft } from "lucide-react";

export default function CandidateLoginPage() {
  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="text-sm link link-primary inline-flex gap-1 items-center">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Accueil
        </Link>
        <CandidateLoginForm />
        <ResendVerificationForm />
      </div>
    </main>
  );
}
