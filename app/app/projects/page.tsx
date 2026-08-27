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
import { IconPlus, IconPencil, IconTrash } from "../../components/icons";
import { formatMoney } from "../../utils/format";
import type { Project } from "../../types";

export default function Projects() {
  // Projects need client data because every project belongs to one client.
  const { projects, clients, getClient, timeEntries, deleteProject } =
    useData();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [modalProject, setModalProject] = useState<Project | "new" | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const activeClients = clients.filter((c) => !c.archived);
  const visible = projects.filter(
    (p) => filter === "all" || p.status === filter,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Projects</h1>
          <p className="mt-1 text-sm text-ink-500">
            Grouped work, one client each.
          </p>
        </div>
        <Button
          onClick={() => setModalProject("new")}
          disabled={activeClients.length === 0}
        >
          <IconPlus className="h-4 w-4" />
          New project
        </Button>
      </div>

      {activeClients.length === 0 && (
        <p className="mb-5 rounded-lg border border-amber/30 bg-amber-light px-4 py-3 text-sm text-ink-700">
          Add an active client first — every project needs one to belong to.
        </p>
      )}

      <div className="mb-5 flex gap-1 border-b border-ink-100">
        {(["all", "active", "completed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors ${
              filter === t
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
          title="No projects here yet"
          body="Projects belong to one client and can override that client's default rate."
          action={
            activeClients.length > 0 && (
              <Button onClick={() => setModalProject("new")}>
                <IconPlus className="h-4 w-4" />
                New project
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => {
            const client = getClient(p.clientId);
            return (
              <Card key={p.id} className="group p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg leading-snug text-ink">
                    {p.name}
                  </h3>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setModalProject(p)}
                      aria-label={`Edit ${p.name}`}
                      className="rounded-md p-1 text-ink-300 transition-colors hover:bg-ink-100 hover:text-ink"
                    >
                      <IconPencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      aria-label={`Delete ${p.name}`}
                      className="rounded-md p-1 text-ink-300 transition-colors hover:bg-rust-light hover:text-rust"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  {client?.name ?? "Unknown client"}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge tone={p.status === "active" ? "stamp" : "neutral"}>
                    {p.status}
                  </Badge>
                  <span className="font-mono tabular text-sm text-ink-700">
                    {formatMoney(
                      p.rateOverride ?? client?.defaultRate ?? 0,
                      client?.currency,
                    )}
                    /hr
                    {p.rateOverride != null && (
                      <span className="ml-1 text-xs text-amber">override</span>
                    )}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ProjectModal
        open={modalProject !== null}
        onClose={() => setModalProject(null)}
        project={
          modalProject === "new" ? undefined : (modalProject ?? undefined)
        }
      />

      {deleteTarget && (
        <ConfirmDeleteProjectModal
          project={deleteTarget}
          entryCount={
            timeEntries.filter((e) => e.projectId === deleteTarget.id).length
          }
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            const result = await deleteProject(deleteTarget.id);
            if (!result.error) setDeleteTarget(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function ConfirmDeleteProjectModal({
  project,
  entryCount,
  onCancel,
  onConfirm,
}: {
  project: Project;
  entryCount: number;
  onCancel: () => void;
  onConfirm: () => Promise<{ error: string | null }>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const blocked = entryCount > 0;

  // Destructive and permanent, so this always requires an explicit
  // confirmation click rather than deleting straight from the row.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={onCancel}
        className="fixed inset-0 bg-ink/40"
      />
      <div className="relative w-full max-w-sm rounded-xl border border-ink-100 bg-white p-6 shadow-xl">
        <h2 className="font-display text-lg text-ink">
          {blocked ? "Can't delete this project" : "Delete this project?"}
        </h2>
        {blocked ? (
          <p className="mt-2 text-sm text-ink-500">
            <strong className="text-ink">{project.name}</strong> has{" "}
            {entryCount} time {entryCount === 1 ? "entry" : "entries"} logged
            against it, including any that have already been invoiced. Delete
            those time entries first, or mark the project completed instead
            of deleting it.
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink-500">
            <strong className="text-ink">{project.name}</strong> will be
            removed for good. It has no time entries or invoices attached, so
            nothing else will be affected — but this can't be undone.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-rust">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            {blocked ? "Close" : "Cancel"}
          </Button>
          {!blocked && (
            <Button
              variant="danger"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                setError("");
                const result = await onConfirm();
                setDeleting(false);
                if (result.error) setError(result.error);
              }}
            >
              {deleting ? "Deleting…" : "Delete project"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectModal({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project;
}) {
  const { clients, addProject, updateProject } = useData();
  const activeClients = clients.filter((c) => !c.archived);

  const [clientId, setClientId] = useState(
    project?.clientId ?? activeClients[0]?.id ?? "",
  );
  const [name, setName] = useState(project?.name ?? "");
  const [status, setStatus] = useState<Project["status"]>(
    project?.status ?? "active",
  );
  const [useOverride, setUseOverride] = useState(project?.rateOverride != null);
  const [rateOverride, setRateOverride] = useState(
    project?.rateOverride != null ? String(project.rateOverride) : "",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setClientId(project?.clientId ?? activeClients[0]?.id ?? "");
      setName(project?.name ?? "");
      setStatus(project?.status ?? "active");
      setUseOverride(project?.rateOverride != null);
      setRateOverride(
        project?.rateOverride != null ? String(project.rateOverride) : "",
      );
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project]);

  // This dialog receives an optional project: no project means "create", otherwise "edit".
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? "Edit project" : "New project"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!clientId) {
            setError("Choose which client this project belongs to.");
            return;
          }
          if (!name.trim()) {
            setError("Give the project a name.");
            return;
          }
          const override =
            useOverride && rateOverride ? Number(rateOverride) : null;
          const payload = {
            clientId,
            name: name.trim(),
            status,
            rateOverride: override,
          };
          if (project) updateProject(project.id, payload);
          else addProject(payload);
          onClose();
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
        <Field label="Project name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Website Redesign"
            autoFocus
          />
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Project["status"])}
            className={inputClass}
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
        <div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={useOverride}
              onChange={(e) => setUseOverride(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-stamp focus-visible:ring-stamp"
            />
            Override the client's default rate for this project
          </label>
          {useOverride && (
            <input
              type="number"
              min={0}
              step="0.01"
              value={rateOverride}
              onChange={(e) => setRateOverride(e.target.value)}
              className={`${inputClass} mt-2`}
              placeholder="Hourly rate for this project"
            />
          )}
        </div>
        {error && <p className="text-sm text-rust">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {project ? "Save changes" : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
