"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
};

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Demandes", icon: FileText, enabled: true },
  { href: "/offres", label: "Offres", icon: LayoutDashboard, enabled: true },
  { href: "#", label: "Tuteurs", icon: Users, enabled: false },
  { href: "#", label: "Paramètres", icon: Settings, enabled: false },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="menu w-full gap-1 p-0">
      {ITEMS.map(({ href, label, icon: Icon, enabled }) => {
        const active = enabled && pathname.startsWith("/admin") && href === "/admin";

        if (!enabled) {
          return (
            <li key={label}>
              <span className="flex items-center gap-3 text-base-content/40 cursor-not-allowed">
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
                <span className="badge badge-ghost badge-xs ml-auto">Bientôt</span>
              </span>
            </li>
          );
        }

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
