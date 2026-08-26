"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "../context/DataContext";
import { Card, Button, Badge } from "../components/ui";
import { IconPlus, IconArrowRight } from "../components/icons";
import {
  formatMoney,
  minutesToHM,
  formatDate,
  startOfWeekISO,
  startOfMonthISO,
} from "../utils/format";
import TimeEntryModal from "../components/TimeEntryModal";

export default function Dashboard() {
  // Read all records once; the values below are calculated views of this shared data.
  const { projects, timeEntries, getProject, getClient, rateForProject } =
    useData();
  const [entryModalOpen, setEntryModalOpen] = useState(false);

  const weekStart = startOfWeekISO();
  const monthStart = startOfMonthISO();

  const hoursThisWeek = useMemo(
    () =>
      timeEntries
        .filter((e) => e.date >= weekStart)
        .reduce((s, e) => s + e.minutes, 0),
    [timeEntries, weekStart],
  );
  const entriesThisMonth = useMemo(
    () => timeEntries.filter((e) => e.date >= monthStart),
    [timeEntries, monthStart],
  );
  const hoursThisMonth = entriesThisMonth.reduce((s, e) => s + e.minutes, 0);

  const earningsByClient = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entriesThisMonth) {
      const project = getProject(e.projectId);
      if (!project) continue;
      const rate = rateForProject(project.id);
      const earnings = (e.minutes / 60) * rate;
      map.set(project.clientId, (map.get(project.clientId) ?? 0) + earnings);
    }
    return [...map.entries()]
      .map(([clientId, total]) => ({ client: getClient(clientId), total }))
      .filter((row) => row.client)
      .sort((a, b) => b.total - a.total);
  }, [entriesThisMonth, getProject, getClient, rateForProject]);

  const totalEarningsThisMonth = earningsByClient.reduce(
    (s, r) => s + r.total,
    0,
  );

  const weeklySeries = useMemo(() => {
    const weeks: { label: string; minutes: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const start = startOfWeekISO(d);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const endISO = end.toISOString().slice(0, 10);
      const minutes = timeEntries
        .filter((e) => e.date >= start && e.date <= endISO)
        .reduce((s, e) => s + e.minutes, 0);
      weeks.push({ label: formatDate(start).replace(/, \d{4}/, ""), minutes });
    }
    return weeks;
  }, [timeEntries]);

  const maxMinutes = Math.max(...weeklySeries.map((w) => w.minutes), 60);
  const recent = timeEntries.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">
            Here's where things stand today.
          </p>
        </div>
        <Button onClick={() => setEntryModalOpen(true)}>
          <IconPlus className="h-4 w-4" />
          New time entry
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-xl text-ink">
            Start by adding a client
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
            Tally needs at least one client and project before you can log time
            against it.
          </p>
          <Link href="/app/clients">
            <Button className="mt-5">Go to clients</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Hours this week"
              value={minutesToHM(hoursThisWeek)}
            />
            <StatCard
              label="Hours this month"
              value={minutesToHM(hoursThisMonth)}
            />
            <StatCard
              label="Earnings this month"
              value={formatMoney(totalEarningsThisMonth)}
              accent
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg text-ink">
                  Hours, last six weeks
                </h2>
              </div>
              <div className="mt-6 flex items-end gap-3 sm:gap-5">
                {weeklySeries.map((w, i) => (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <span className="font-mono tabular text-xs text-ink-400">
                      {(w.minutes / 60).toFixed(1)}h
                    </span>
                    <div className="flex h-32 w-full items-end rounded-md bg-paper-dim">
                      <div
                        className="w-full rounded-md bg-stamp transition-all"
                        style={{
                          height: `${Math.max(4, (w.minutes / maxMinutes) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-ink-400">{w.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg text-ink">
                Earnings by client
              </h2>
              <p className="text-xs text-ink-400">This month</p>
              <div className="mt-5 space-y-4">
                {earningsByClient.length === 0 && (
                  <p className="text-sm text-ink-400">
                    No hours logged yet this month.
                  </p>
                )}
                {earningsByClient.map((row) => (
                  <div key={row.client!.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-ink-700">{row.client!.name}</span>
                      <span className="font-mono tabular text-ink">
                        {formatMoney(row.total, row.client!.currency)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-paper-dim">
                      <div
                        className="h-1.5 rounded-full bg-ink-700"
                        style={{
                          width: `${totalEarningsThisMonth ? (row.total / totalEarningsThisMonth) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-ink">
                Recent time entries
              </h2>
              <Link
                href="/app/time"
                className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink"
              >
                View all
                <IconArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-4 divide-y divide-ink-100">
              {recent.map((e) => {
                const project = getProject(e.projectId);
                const client = project
                  ? getClient(project.clientId)
                  : undefined;
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink-700">
                        {project?.name ?? "Unknown project"}{" "}
                        <span className="text-ink-400">· {client?.name}</span>
                      </p>
                      <p className="text-xs text-ink-400">
                        {formatDate(e.date)} {e.note && `· ${e.note}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {e.billed && <Badge tone="stamp">Billed</Badge>}
                      <span className="font-mono tabular text-sm text-ink">
                        {minutesToHM(e.minutes)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {recent.length === 0 && (
                <p className="py-6 text-center text-sm text-ink-400">
                  No time logged yet.
                </p>
              )}
            </div>
          </Card>
        </>
      )}

      <TimeEntryModal
        open={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  // Reusable presentation component for one dashboard total.
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-400">
        {label}
      </p>
      <p
        className={`mt-2 font-mono tabular text-2xl ${accent ? "text-stamp-dark" : "text-ink"}`}
      >
        {value}
      </p>
    </Card>
  );
}
