import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Search,
  Paperclip,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";

const STEPS = [
  {
    icon: FileText,
    title: "Je remplis le formulaire",
    description: "Informations personnelles, parcours et projet de stage.",
  },
  {
    icon: Paperclip,
    title: "Je joins mes documents",
    description: "CV, lettre de motivation et pièces requises, au format PDF.",
  },
  {
    icon: KeyRound,
    title: "Je reçois mon code de suivi",
    description: "Un code unique pour consulter l'état de mon dossier.",
  },
  {
    icon: Mail,
    title: "Je suis informé(e) par email",
    description: "Une notification à chaque étape du traitement.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-base-100">
      {/* Halo décoratif — teintes de marque, discret, respecte prefers-reduced-motion */}
      <style>{`
        @keyframes bridgeGlowA {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.15); opacity: 0.5; }
        }
        @keyframes bridgeGlowB {
          0%, 100% { transform: scale(1.1); opacity: 0.3; }
          50% { transform: scale(0.95); opacity: 0.45; }
        }
        .animate-glow-a { animation: bridgeGlowA 14s infinite ease-in-out; }
        .animate-glow-b { animation: bridgeGlowB 14s infinite ease-in-out 1s; }
        @media (prefers-reduced-motion: reduce) {
          .animate-glow-a, .animate-glow-b { animation: none; }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[15%] left-[8%] w-72 h-72 sm:w-96 sm:h-96 bg-primary rounded-full blur-[90px] animate-glow-a" />
        <div className="absolute bottom-[20%] right-[8%] w-64 h-64 sm:w-80 sm:h-80 bg-accent rounded-full blur-[90px] animate-glow-b" />
      </div>

      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* En-tête : uniquement le logo — aucune entrée admin sur la page publique */}
        <header className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-300 px-4 sm:px-8">
          <div className="flex-1">
            <Image
              src="/logo-bridge.png"
              alt="Bridge Technologies Solutions"
              width={150}
              height={48}
              priority
              className="h-9 sm:h-10 w-auto"
            />
          </div>
        </header>

        <div className="flex-1 flex flex-col">
          {/* Hero */}
          <section className="py-20 sm:py-28 px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-secondary tracking-tight text-balance">
                Gérez vos demandes de stage en toute simplicité
              </h1>
              <p className="mt-5 text-base-content/70 text-lg text-balance">
                Postulez à un stage académique ou professionnel, suivez votre
                dossier en temps réel, et laissez notre équipe vous accompagner.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/candidature" className="btn btn-primary btn-lg gap-2">
                  <FileText className="w-5 h-5" aria-hidden="true" />
                  Déposer ma candidature
                </Link>
                <Link href="/suivi" className="btn btn-outline btn-lg gap-2">
                  <Search className="w-5 h-5" aria-hidden="true" />
                  Suivre ma demande
                </Link>
              </div>
            </div>
          </section>

          {/* Comment ça marche */}
          <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-center text-secondary mb-12">
                Comment ça marche ?
              </h2>
              <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {STEPS.map(({ icon: Icon, title, description }, i) => (
                  <li key={title} className="relative">
                    <div className="flex flex-col items-center text-center gap-3 rounded-box border border-base-300 bg-base-100 p-6 h-full">
                      <span className="grid place-items-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-semibold text-primary tabular-nums">
                        Étape {i + 1}
                      </span>
                      <h3 className="font-semibold text-base-content">{title}</h3>
                      <p className="text-sm text-base-content/60">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>

        {/* Pied de page */}
        <footer className="footer footer-center bg-secondary text-secondary-content p-6 gap-2">
          <aside>
            <p className="font-medium">Bridge Technologies Solutions</p>
            <p className="text-sm opacity-80">We drive your digital transformation</p>
          </aside>
          <nav>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 text-xs opacity-50 hover:opacity-90 transition-opacity"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Espace RH
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
