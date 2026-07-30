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
};

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Demandes", icon: FileText },
  { href: "/admin/offres", label: "Offres", icon: LayoutDashboard },
  { href: "/admin/tuteurs", label: "Tuteurs", icon: Users },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="menu w-full gap-1 p-0">
      {ITEMS.map(({ href, label, icon: Icon }) => {
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
