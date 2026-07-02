// src/app/admin/layout.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation admin */}
      <nav className="bg-white border-b p-4 flex justify-between items-center">
        <span className="font-bold text-gray-700">Espace Administration</span>
        <Link
          href="/"
          className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Retour au site public
        </Link>
      </nav>

      {/* Le contenu des pages */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}