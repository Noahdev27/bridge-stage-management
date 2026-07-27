import type { ComponentType } from "react";
import {
  Inbox,
  Hourglass,
  LoaderCircle,
  CircleCheck,
  CircleX,
  BarChart3,
} from "lucide-react";
import type { MonthlyStats, RequestStats } from "../queries";

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

interface StatsDashboardProps {
  stats: RequestStats;
  monthlyBreakdown: MonthlyStats[];
  year: number;
  month?: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accentClass,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accentClass: string;
}) {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-5 gap-3">
        <div className="flex items-center justify-between">
          <span className={`grid place-items-center w-10 h-10 rounded-lg ${accentClass}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="text-3xl font-bold tabular-nums text-base-content">
            {value}
          </span>
        </div>
        <p className="text-sm font-medium text-base-content/70">{label}</p>
      </div>
    </div>
  );
}

export function StatsDashboard({
  stats,
  monthlyBreakdown,
  year,
  month,
}: StatsDashboardProps) {
  const periodLabel = month
    ? `${MONTH_LABELS[month - 1]} ${year}`
    : `Année ${year}`;

  return (
    <section className="mb-8 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-bold text-secondary">Tableau de bord</h2>
          <p className="text-sm text-base-content/60">{periodLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          icon={Inbox}
          label="Reçues"
          value={stats.received}
          accentClass="bg-primary/15 text-primary"
        />
        <StatCard
          icon={Hourglass}
          label="En attente"
          value={stats.pending}
          accentClass="bg-warning/15 text-warning"
        />
        <StatCard
          icon={LoaderCircle}
          label="En traitement"
          value={stats.processed}
          accentClass="bg-info/15 text-info"
        />
        <StatCard
          icon={CircleCheck}
          label="Acceptées"
          value={stats.accepted}
          accentClass="bg-success/15 text-success"
        />
        <StatCard
          icon={CircleX}
          label="Rejetées"
          value={stats.rejected}
          accentClass="bg-error/15 text-error"
        />
      </div>

      {!month && monthlyBreakdown.some((row) => row.stats.received > 0) && (
        <div className="overflow-x-auto border border-base-300 rounded-xl bg-base-100 shadow-sm">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th>Mois</th>
                <th className="text-right font-semibold">Reçues</th>
                <th className="text-right">En attente</th>
                <th className="text-right">En traitement</th>
                <th className="text-right">Acceptées</th>
                <th className="text-right">Rejetées</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBreakdown.map((row) => (
                <tr
                  key={row.month}
                  className={row.stats.received === 0 ? "opacity-40" : ""}
                >
                  <td className="font-medium">{row.label}</td>
                  <td className="text-right tabular-nums font-semibold">
                    {row.stats.received}
                  </td>
                  <td className="text-right tabular-nums">{row.stats.pending}</td>
                  <td className="text-right tabular-nums">{row.stats.processed}</td>
                  <td className="text-right tabular-nums">{row.stats.accepted}</td>
                  <td className="text-right tabular-nums">{row.stats.rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
