"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // On récupère le statut actuel dans l'URL, sinon "ALL" par défaut
  const currentStatus = searchParams.get("status") || "ALL";

  const filters = [
    { label: "Tous", value: "ALL" },
    { label: "En attente", value: "PENDING" },
    { label: "En cours", value: "PROCESS" },
    { label: "Acceptés", value: "ACCEPTED" },
    { label: "Refusés", value: "REJECTED" },
  ];

  const handleFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status"); // Nettoie l'URL si on veut tout voir
    } else {
      params.set("status", status);
    }
    // Redirige vers la même page avec les nouveaux paramètres de recherche
    router.push(`/admin?${params.toString()}`);
  };

  return (
    <div className="tabs tabs-boxed mb-6 inline-flex grid-cols-5 bg-base-200 p-1">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => handleFilterChange(filter.value)}
          className={`tab tab-sm md:tab-md transition-all ${
            currentStatus === filter.value 
              ? "tab-active bg-primary text-primary-content font-semibold" 
              : "hover:bg-base-300"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}