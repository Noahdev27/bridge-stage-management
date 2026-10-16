"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  ShieldCheck,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Réservé aux administrateurs (la page vérifie aussi le rôle). */
  adminOnly?: boolean;
};

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Demandes", icon: FileText },
  { href: "/admin/offres", label: "Offres", icon: LayoutDashboard },
  { href: "/admin/tuteurs", label: "Tuteurs", icon: Users },
  { href: "/admin/rh", label: "Comptes RH", icon: ShieldCheck },
  { href: "/admin/journal", label: "Journal d'audit", icon: ScrollText, adminOnly: true },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({
  onNavigate,
  isAdmin = false,
}: {
  onNavigate?: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <ul className="menu w-full gap-1 p-0">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);

        return (
          <li key={label}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 font-medium ${
                active ? "active bg-primary/10 text-primary" : ""
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
