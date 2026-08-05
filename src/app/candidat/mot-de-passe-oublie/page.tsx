import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/features/compte-candidat/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/"
          className="text-sm link link-primary inline-flex gap-1 items-center"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Accueil
        </Link>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
