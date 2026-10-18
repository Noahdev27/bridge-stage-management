"use client";

import { useRouter, useSearchParams } from "next/navigation";

const MONTH_OPTIONS = [
  { value: "", label: "Tous les mois" },
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

interface PeriodFilterProps {
  years: number[];
  selectedYear: number;
  selectedMonth?: number;
}

export function PeriodFilter({
  years,
  selectedYear,
  selectedMonth,
}: PeriodFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updatePeriod = (year: string, month: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year);
    if (month) {
      params.set("month", month);
    } else {
      params.delete("month");
    }
    router.push(`/admin?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <label className="flex flex-col gap-1.5 w-full sm:w-40">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-base-content">Année</span>
        </span>
        <select
          className="select w-full select-sm"
          value={String(selectedYear)}
          onChange={(e) =>
            updatePeriod(e.target.value, selectedMonth ? String(selectedMonth) : "")
          }
          aria-label="Filtrer par année"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 w-full sm:w-48">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-base-content">Mois</span>
        </span>
        <select
          className="select w-full select-sm"
          value={selectedMonth ? String(selectedMonth) : ""}
          onChange={(e) => updatePeriod(String(selectedYear), e.target.value)}
          aria-label="Filtrer par mois"
        >
          {MONTH_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
