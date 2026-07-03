import { signIn } from "@/shared/auth/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Mail, Lock, AlertTriangle, ArrowLeft } from "lucide-react";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function handleLogin(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/admin",
      });
    } catch (err) {
      // Mauvais identifiants : on revient au login avec un indicateur d'erreur.
      if (err instanceof AuthError) {
        redirect("/admin/login?error=1");
      }
      // Succès : signIn lève une redirection (NEXT_REDIRECT) à laisser remonter.
      throw err;
    }
  }

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
            <h1 className="text-xl font-bold text-secondary text-center">
              Espace RH
            </h1>
            <p className="text-sm text-base-content/60 text-center mb-4">
              Connectez-vous pour accéder au back-office.
            </p>

            {error && (
              <div
                role="alert"
                className="alert alert-error text-sm py-2 mb-2 text-white"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                Identifiants incorrects. Veuillez réessayer.
              </div>
            )}

            <form action={handleLogin} className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  Email
                </label>
                <div className="input input-bordered flex items-center gap-2 w-full">
                  <Mail
                    className="w-4 h-4 text-base-content/50 shrink-0"
                    aria-hidden="true"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="vous@bridgetech-solutions.com"
                    className="grow"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1"
                >
                  Mot de passe
                </label>
                <div className="input input-bordered flex items-center gap-2 w-full">
                  <Lock
                    className="w-4 h-4 text-base-content/50 shrink-0"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="grow"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full gap-2">
                <LogIn className="w-4 h-4" aria-hidden="true" />
                Se connecter
              </button>
            </form>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link
            href="/"
            className="text-sm link link-hover text-base-content/60 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Retour au site public
          </Link>
        </div>
      </div>
    </main>
  );
}
