"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "../../context/DataContext";
import {
  Button,
  Card,
  EmptyState,
  Field,
  inputClass,
  Modal,
  Badge,
} from "../../components/ui";
import { IconPlus } from "../../components/icons";
import {
  formatDate,
  formatMoney,
  minutesToHM,
  todayISO,
} from "../../utils/format";

export default function Invoices() {
  // Invoices are generated from unbilled time entries and displayed newest first.
  const { invoices, getClient, clients, markInvoiceStatus } = useData();
  const [tab, setTab] = useState<"all" | "unpaid" | "paid">("all");
  const [genOpen, setGenOpen] = useState(false);

  const visible = invoices.filter((i) => tab === "all" || i.status === tab);
  const activeClients = clients.filter((c) => !c.archived);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Invoices</h1>
          <p className="mt-1 text-sm text-ink-500">
            Generated from your unbilled hours.
          </p>
        </div>
        <Button
          onClick={() => setGenOpen(true)}
          disabled={activeClients.length === 0}
        >
          <IconPlus className="h-4 w-4" />
          Generate invoice
        </Button>
      </div>

      <div className="mb-5 flex gap-1 border-b border-ink-100">
        {(["all", "unpaid", "paid"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-ink text-ink"
                : "border-transparent text-ink-400 hover:text-ink-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          body="Once you've logged unbilled time, generate an invoice for a client and date range."
          action={
            activeClients.length > 0 && (
              <Button onClick={() => setGenOpen(true)}>
                <IconPlus className="h-4 w-4" />
                Generate invoice
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Horizontal scroll region keeps the Status column reachable on
              tablet / mobile instead of being clipped off-screen. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Period</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {visible.map((inv) => (
                  <tr key={inv.id} className="hover:bg-paper-dim/60">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/app/invoices/${inv.id}`}
                        className="font-mono text-ink hover:text-stamp"
                      >
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink-700">
                      {getClient(inv.clientId)?.name}
                    </td>
                    <td className="px-5 py-3.5 text-ink-500">
                      {formatDate(inv.rangeStart)} – {formatDate(inv.rangeEnd)}
                    </td>
                    <td className="px-5 py-3.5 font-mono tabular text-ink">
                      {formatMoney(inv.total, inv.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() =>
                          markInvoiceStatus(
                            inv.id,
                            inv.status === "paid" ? "unpaid" : "paid",
                          )
                        }
                      >
                        <Badge tone={inv.status === "paid" ? "stamp" : "rust"}>
                          {inv.status === "paid" ? "Paid" : "Unpaid"}
                        </Badge>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <GenerateInvoiceModal open={genOpen} onClose={() => setGenOpen(false)} />
    </div>
  );
}

function GenerateInvoiceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    clients,
    projects,
    timeEntries,
    getClient,
    rateForProject,
    generateInvoice,
  } = useData();
  const activeClients = clients.filter((c) => !c.archived);
  const [clientId, setClientId] = useState(activeClients[0]?.id ?? "");
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(todayISO());
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    number: string;
    total: number;
    currency: string;
  } | null>(null);

  const preview = useMemo(() => {
    if (!clientId) return { minutes: 0, count: 0, total: 0 };
    const projectIds = new Set(
      projects.filter((p) => p.clientId === clientId).map((p) => p.id),
    );
    const eligible = timeEntries.filter(
      (e) =>
        !e.billed &&
        projectIds.has(e.projectId) &&
        e.date >= start &&
        e.date <= end,
    );
    const minutes = eligible.reduce((s, e) => s + e.minutes, 0);
    const total = eligible.reduce(
      (s, e) => s + (e.minutes / 60) * rateForProject(e.projectId),
      0,
    );
    return { minutes, count: eligible.length, total };
  }, [clientId, projects, timeEntries, start, end, rateForProject]);

  // Reset draft fields so reopening the dialog starts a fresh invoice workflow.
  function close() {
    setResult(null);
    setError("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={result ? "Invoice generated" : "Generate invoice"}
    >
      {result ? (
        <div>
          <p className="text-sm text-ink-600">
            <span className="font-mono text-ink">{result.number}</span> is ready
            for {formatMoney(result.total, result.currency as never)}. Those
            hours are now marked billed.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              Close
            </Button>
            <Link href="/app/invoices" onClick={close}>
              <Button>View invoices</Button>
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!clientId) {
              setError("Choose a client to invoice.");
              return;
            }
            if (start > end) {
              setError("Start date needs to come before the end date.");
              return;
            }
            const invoice = generateInvoice(clientId, start, end);
            if (!invoice) {
              setError(
                "No unbilled time entries fall inside that range for this client.",
              );
              return;
            }
            setResult({
              number: invoice.number,
              total: invoice.total,
              currency: invoice.currency,
            });
          }}
          className="space-y-4"
        >
          <Field label="Client">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={inputClass}
            >
              {activeClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="From">
              <input
                type="date"
                value={start}
                max={end}
                onChange={(e) => setStart(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                value={end}
                min={start}
                max={todayISO()}
                onChange={(e) => setEnd(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="rounded-lg bg-paper-dim px-4 py-3 text-sm text-ink-600">
            {preview.count === 0 ? (
              <span className="text-ink-400">
                No unbilled hours in this range yet.
              </span>
            ) : (
              <span>
                <strong className="text-ink">{preview.count}</strong> unbilled{" "}
                {preview.count === 1 ? "entry" : "entries"} ·{" "}
                {minutesToHM(preview.minutes)} ·{" "}
                {formatMoney(preview.total, getClient(clientId)?.currency)}
              </span>
            )}
          </div>

          {error && <p className="text-sm text-rust">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={preview.count === 0}>
              Generate invoice
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}