import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    // 1. Conteneur principal avec "relative overflow-hidden" pour retenir les bulles
    <main className="relative min-h-screen overflow-hidden bg-base-100">
      
      {/* --- ANIMATIONS CSS POUR LES BULLES PLUS INTENSES --- */}
      <style>{`
        @keyframes blobOne {
          0%, 100% { transform: scale(1); opacity: 0; }
          30% { transform: scale(1.3); opacity: 0.7; }  /* Intensité augmentée à 70% */
          60% { transform: scale(0.9); opacity: 0; }
        }
        @keyframes blobTwo {
          0%, 100% { transform: scale(0.9); opacity: 0; }
          40% { transform: scale(0.9); opacity: 0; }
          75% { transform: scale(1.4); opacity: 0.65; } /* Intensité augmentée à 65% */
        }
        .animate-blob-1 { animation: blobOne 12s infinite ease-in-out; }
        .animate-blob-2 { animation: blobTwo 12s infinite ease-in-out; }
      `}</style>

      {/* --- LES BULLES BLEUES ET CYAN EN ARRIÈRE-PLAN --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Première bulle - Flou réduit à 60px pour concentrer le bleu Bridge */}
        <div className="absolute top-[20%] left-[10%] w-80 h-80 bg-blue-600 rounded-full filter blur-[60px] animate-blob-1"></div>
        
        {/* Deuxième bulle - Flou réduit à 70px pour le Cyan */}
        <div className="absolute bottom-[25%] right-[10%] w-96 h-96 bg-cyan-500 rounded-full filter blur-[70px] animate-blob-2"></div>
      </div>

      {/* --- CONTENU VISUEL SURÉLEVÉ PAR LE Z-10 --- */}
      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        
        <div>
          {/* En-tête */}
          <header className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-300 px-4 sm:px-8">
            <div className="flex-1">
              <Image
                src="/logo-bridge.png"
                alt="Bridge Technologies Solutions"
                width={150}
                height={48}
                priority
                className="h-10 w-auto"
              />
            </div>
            <div className="flex-none">
              <Link href="/admin" className="btn btn-ghost btn-sm text-secondary font-semibold">
                Espace RH
              </Link>
            </div>
          </header>

          {/* Hero (Transparent pour laisser passer les superbes lueurs) */}
          <section className="hero bg-transparent py-20">
            <div className="hero-content text-center">
              <div className="max-w-2xl">
                <h1 className="text-4xl sm:text-5xl font-bold text-secondary">
                  Gérez vos demandes de stage en toute simplicité
                </h1>
                <p className="py-6 text-base-content/70 text-lg">
                  Postulez à un stage académique ou professionnel, suivez votre
                  dossier en temps réel, et laissez notre équipe vous accompagner.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/candidature" className="btn btn-primary btn-lg">
                    Déposer ma candidature
                  </Link>
                  <Link href="/suivi" className="btn btn-outline btn-lg">
                    Suivre ma demande
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Étapes */}
          <section className="py-16 px-4 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-secondary mb-10">
              Comment ça marche ?
            </h2>
            <ul className="steps steps-vertical sm:steps-horizontal w-full">
              <li className="step step-primary">Je remplis le formulaire</li>
              <li className="step step-primary">Je joins mes documents</li>
              <li className="step">Je reçois mon code de suivi</li>
              <li className="step">Je suis informé(e) par email</li>
            </ul>
          </section>
        </div>

        {/* Pied de page */}
        <footer className="footer footer-center bg-secondary text-secondary-content p-6">
          <aside>
            <p className="font-medium">Bridge Technologies Solutions</p>
            <p className="text-sm opacity-80">
              We drive your digital transformation
            </p>
          </aside>
        </footer>

      </div>
    </main>
  );
}