"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AdminNav } from "./AdminNav";

export function AdminShell({
  email,
  logoutAction,
  children,
}: {
  email: string;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-base-200 lg:flex">
      {/* Sidebar (desktop, repliable) */}
      <aside
        className={`hidden lg:flex flex-col bg-base-100 border-base-300 h-screen sticky top-0 transition-all duration-200 ${
          open ? "w-64 border-r" : "w-0 overflow-hidden"
        }`}
      >
        <div className="h-16 flex items-center px-5 border-b border-base-300 shrink-0">
          <Link href="/admin" aria-label="Accueil espace RH">
            <Image
              src="/logo-bridge.png"
              alt="Bridge Technologies Solutions"
              width={130}
              height={40}
              priority
              className="h-8 w-auto"
            />
          </Link>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <AdminNav />
        </nav>
        <div className="p-4 border-t border-base-300 text-xs text-base-content/40">
          Espace RH — Bridge
        </div>
      </aside>

      {/* Colonne principale */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-base-100 border-b border-base-300 flex items-center justify-between gap-3 px-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            {/* Bascule sidebar (desktop) */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="hidden lg:inline-flex btn btn-ghost btn-sm btn-square"
              aria-label={open ? "Masquer le menu" : "Afficher le menu"}
              aria-pressed={open}
            >
              {open ? (
                <PanelLeftClose className="w-5 h-5" aria-hidden="true" />
              ) : (
                <PanelLeftOpen className="w-5 h-5" aria-hidden="true" />
              )}
            </button>

            {/* Menu déroulant (mobile) */}
            <div className="dropdown lg:hidden">
              <div
                tabIndex={0}
                role="button"
                aria-label="Ouvrir le menu"
                className="btn btn-ghost btn-sm btn-square"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </div>
              <div
                tabIndex={0}
                className="dropdown-content mt-2 w-56 rounded-box bg-base-100 border border-base-300 shadow-lg p-2 z-30"
              >
                <AdminNav />
              </div>
            </div>

            {/* Logo dans le header : mobile toujours, desktop quand la sidebar est repliée */}
            <Image
              src="/logo-bridge.png"
              alt="Bridge"
              width={110}
              height={34}
              className={`h-7 w-auto ${open ? "lg:hidden" : ""}`}
            />
          </div>

          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden sm:inline text-sm text-base-content/60 font-mono">
                {email}
              </span>
            )}
            <form action={logoutAction}>
              <button type="submit" className="btn btn-sm btn-outline gap-2">
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
