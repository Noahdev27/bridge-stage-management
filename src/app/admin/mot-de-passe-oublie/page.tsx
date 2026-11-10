import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StaffForgotPasswordForm } from "@/features/reinitialisation-rh/components/StaffForgotPasswordForm";

export const metadata = { title: "Mot de passe oublié - Espace RH" };

export default function StaffForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Image
            src="/logo-bridge.png"
            alt="Bridge Technologies Solutions"
            width={150}
            height={48}
            priority
            className="h-10 w-auto mx-auto"
          />
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body p-6 sm:p-8">
            <StaffForgotPasswordForm />
          </div>
        </div>

        <div className="text-center mt-4">
          <Link
            href="/admin/login"
            className="text-sm link link-hover text-base-content/60 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </main>
  );
}
