"use client";

import { useEffect, useState } from "react";
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
import { IconPlus, IconPencil, IconArchive } from "../../components/icons";
import { formatMoney, initials } from "../../utils/format";
import type { Client, Currency } from "../../types";

const AVATAR_TONES = [
  "bg-stamp/15 text-stamp-dark",
  "bg-amber-light text-amber",
  "bg-ink-100 text-ink-600",
  "bg-rust-light text-rust-dark",
];

export default function Clients() {
  // Client actions update DataContext, which currently saves to localStorage.
  const { clients, archiveClient } = useData();
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [modalClient, setModalClient] = useState<Client | "new" | null>(null);

  const visible = clients.filter((c) =>
    tab === "active" ? !c.archived : c.archived,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Clients</h1>
          <p className="mt-1 text-sm text-ink-500">
            Who you bill, and what they pay.
          </p>
        </div>
        <Button onClick={() => setModalClient("new")}>
          <IconPlus className="h-4 w-4" />
          Add client
        </Button>
      </div>

      <div className="mb-5 flex gap-1 border-b border-ink-100">
        {(["active", "archived"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-ink text-ink"
                : "border-transparent text-ink-400 hover:text-ink-600"
            }`}
          >
            {t} (
            {
              clients.filter((c) => (t === "active" ? !c.archived : c.archived))
                .length
            }
            )
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={
            tab === "active" ? "No active clients yet" : "No archived clients"
          }
          body={
            tab === "active"
              ? "Add your first client to start logging time and building invoices."
              : "Clients you archive will show up here, with their history intact."
          }
          action={
            tab === "active" && (
              <Button onClick={() => setModalClient("new")}>
                <IconPlus className="h-4 w-4" />
                Add client
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Horizontal scroll region so Currency and the row actions stay
              reachable on tablet / mobile instead of being clipped. */}
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Default rate</th>
                <th className="px-5 py-3 font-medium">Currency</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {visible.map((c, i) => (
                <tr key={c.id} className="group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${AVATAR_TONES[i % AVATAR_TONES.length]}`}
                      >
                        {initials(c.name)}
                      </span>
                      <span className="font-medium text-ink">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-ink-500">{c.contactEmail}</td>
                  <td className="px-5 py-3.5 font-mono tabular text-ink-700">
                    {formatMoney(c.defaultRate, c.currency)}/hr
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge>{c.currency}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => setModalClient(c)}
                        aria-label={`Edit ${c.name}`}
                        className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink"
                      >
                        <IconPencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => archiveClient(c.id, !c.archived)}
                        aria-label={
                          c.archived ? `Restore ${c.name}` : `Archive ${c.name}`
                        }
                        className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink"
                      >
                        <IconArchive className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      <ClientModal
        open={modalClient !== null}
        onClose={() => setModalClient(null)}
        client={modalClient === "new" ? undefined : (modalClient ?? undefined)}
      />
    </div>
  );
}

function ClientModal({
  open,
  onClose,
  client,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client;
}) {
  const { addClient, updateClient } = useData();
  const [name, setName] = useState(client?.name ?? "");
  const [contactEmail, setContactEmail] = useState(client?.contactEmail ?? "");
  const [defaultRate, setDefaultRate] = useState(
    client ? String(client.defaultRate) : "100",
  );
  const [currency, setCurrency] = useState<Currency>(client?.currency ?? "USD");
  const [error, setError] = useState("");

  // Clear the draft after the dialog is saved or closed.
  function reset() {
    setName(client?.name ?? "");
    setContactEmail(client?.contactEmail ?? "");
    setDefaultRate(client ? String(client.defaultRate) : "100");
    setCurrency(client?.currency ?? "USD");
    setError("");
  }

  useEffect(() => {
    if (open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client]);

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        reset();
      }}
      title={client ? "Edit client" : "Add client"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) {
            setError("Give the client a name.");
            return;
          }
          const rate = Number(defaultRate);
          if (!rate || rate <= 0) {
            setError("Set a default hourly rate greater than zero.");
            return;
          }
          const payload = {
            name: name.trim(),
            contactEmail: contactEmail.trim(),
            defaultRate: rate,
            currency,
          };
          if (client) updateClient(client.id, payload);
          else addClient(payload);
          onClose();
        }}
        className="space-y-4"
        onReset={reset}
      >
        <Field label="Client name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Acme Robotics"
            autoFocus
          />
        </Field>
        <Field label="Contact email">
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className={inputClass}
            placeholder="billing@acme.com"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Default hourly rate">
            <input
              type="number"
              min={0}
              step="0.01"
              value={defaultRate}
              onChange={(e) => setDefaultRate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Currency">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className={inputClass}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </Field>
        </div>
        {error && <p className="text-sm text-rust">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {client ? "Save changes" : "Add client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}