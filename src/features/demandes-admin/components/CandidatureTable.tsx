// src/features/demandes-admin/components/CandidatureTable.tsx
'use client';

import { useState } from 'react';

type Candidature = {
  id: string;
  nom: string;
  email: string;
  statut: string;
};

export default function CandidatureTable({ data }: { data: Candidature[] }) {
  const [filtreStatut, setFiltreStatut] = useState('Tous');

  const safeData = Array.isArray(data) ? data : [];

  // Debug : affichons les statuts bruts dans la console du navigateur pour comprendre
  console.log("Éléments dans le tableau client :", safeData);

  const candidaturesFiltrees = safeData.filter((c) => {
    if (filtreStatut === 'Tous') return true;
    return c.statut === filtreStatut;
  });

  return (
    <div className="space-y-4">
      {/* Sélecteur de filtre */}
      <div className="flex items-center space-x-2">
        <label htmlFor="filtre" className="text-sm font-medium text-gray-700">
          Filtrer par statut :
        </label>
        <select
          id="filtre"
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="rounded-md border border-gray-300 py-1.5 px-3 text-sm shadow-sm"
        >
          <option value="Tous">Tous</option>
          <option value="En attente">En attente</option>
          <option value="Validé">Validé</option>
        </select>
      </div>

      {/* Tableau d'affichage */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut (BDD)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {safeData.length > 0 ? (
              // Affichons TOUTES les lignes sans le filtre d'abord pour vérifier le rendu
              safeData.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.nom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    <span className="bg-gray-100 px-2 py-1 rounded">{c.statut}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline cursor-pointer">
                    Voir
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucune donnée reçue dans le tableau.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}