"use client";

import { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import { Button, Card, EmptyState, Badge, inputClass } from "../../components/ui";
import {
  IconPlay,
  IconPlus,
  IconPencil,
  IconTrash,
} from "../../components/icons";
import { formatDate, minutesToHM } from "../../utils/format";
import TimeEntryModal from "../../components/TimeEntryModal";
import type { TimeEntry } from "../../types";

export default function TimeEntries() {
  // The page manages filtering, editing, and deletion UI for the shared time-entry list.
  const {
    timeEntries,
    projects,
    getProject,
    getClient,
    activeTimer,
    startTimer,
    deleteTimeEntry,
  } = useData();
  const [entryModal, setEntryModal] = useState<"new" | TimeEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TimeEntry | null>(null);
  const [projectFilter, setProjectFilter] = useState("all");
  const [startProjectId, setStartProjectId] = useState(projects[0]?.id ?? "");

  const activeProjects = projects.filter((p) => {
    const c = getClient(p.clientId);
    return c && !c.archived;
  });

  const filtered = useMemo(
    () =>
      projectFilter === "all"
        ? timeEntries
        : timeEntries.filter((e) => e.projectId === projectFilter),
    [timeEntries, projectFilter],
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Time Entries</h1>
          <p className="mt-1 text-sm text-ink-500">
            Every hour, logged and editable.
          </p>
        </div>
        <Button
          onClick={() => setEntryModal("new")}
          disabled={activeProjects.length === 0}
        >
          <IconPlus className="h-4 w-4" />
          Add entry
        </Button>
      </div>

      {activeProjects.length === 0 ? (
        <EmptyState
          title="Nothing to log time against yet"
          body="Add a client and an active project first, then come back to start tracking."
        />
      ) : (
        <>
          <Card className="mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <IconPlay className="hidden h-4 w-4 text-stamp sm:block" />
            <select
              value={startProjectId || activeProjects[0]?.id}
              onChange={(e) => setStartProjectId(e.target.value)}
              disabled={!!activeTimer}
              className={`${inputClass} sm:max-w-xs`}
            >
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {getClient(p.clientId)?.name} — {p.name}
                </option>
              ))}
            </select>
            <Button
              onClick={() => startTimer(startProjectId || activeProjects[0].id)}
              disabled={!!activeTimer}
              className="sm:ml-auto"
            >
              <IconPlay className="h-4 w-4" />
              {activeTimer ? "Timer already running" : "Start timer"}
            </Button>
          </Card>

          <div className="mb-4 flex items-center gap-2">
            <label htmlFor="project-filter" className="text-sm text-ink-500">
              Filter
            </label>
            <select
              id="project-filter"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className={`${inputClass} w-auto`}
            >
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No entries here"
              body="Try a different filter, or log your first session."
            />
          ) : (
            <Card className="overflow-hidden">
              {/* Horizontal scroll region so every column (including Note
                  and Status) stays reachable on tablet / mobile widths
                  instead of being clipped by the card's overflow-hidden. */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                      <th className="px-5 py-3 font-medium">Project</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Duration</th>
                      <th className="px-5 py-3 font-medium">Note</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {filtered.map((e) => {
                      const project = getProject(e.projectId);
                      return (
                        <tr key={e.id} className="group">
                          <td className="px-5 py-3.5 text-ink">
                            {project?.name ?? "Unknown"}
                            <p className="text-xs text-ink-400">
                              {project && getClient(project.clientId)?.name}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 text-ink-500">
                            {formatDate(e.date)}
                          </td>
                          <td className="px-5 py-3.5 font-mono tabular text-ink-700">
                            {minutesToHM(e.minutes)}
                          </td>
                          <td className="max-w-[200px] truncate px-5 py-3.5 text-ink-500">
                            {e.note || "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            {e.billed ? (
                              <Badge tone="stamp">Billed</Badge>
                            ) : (
                              <Badge>Unbilled</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => setEntryModal(e)}
                                disabled={e.billed}
                                aria-label="Edit entry"
                                className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink disabled:opacity-30"
                              >
                                <IconPencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(e)}
                                disabled={e.billed}
                                aria-label="Delete entry"
                                className="rounded-md p-1.5 text-ink-400 hover:bg-rust-light hover:text-rust disabled:opacity-30"
                              >
                                <IconTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <TimeEntryModal
        open={entryModal !== null}
        onClose={() => setEntryModal(null)}
        entry={entryModal === "new" ? undefined : (entryModal ?? undefined)}
      />

      {confirmDelete && (
        <ConfirmDeleteModal
          entry={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteTimeEntry(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}

function ConfirmDeleteModal({
  entry,
  onCancel,
  onConfirm,
}: {
  entry: TimeEntry;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Confirm before deleting because this operation removes a saved work record.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={onCancel}
        className="fixed inset-0 bg-ink/40"
      />
      <div className="relative w-full max-w-sm rounded-xl border border-ink-100 bg-white p-6 shadow-xl">
        <h2 className="font-display text-lg text-ink">Delete this entry?</h2>
        <p className="mt-2 text-sm text-ink-500">
          {minutesToHM(entry.minutes)} on {formatDate(entry.date)} will be
          removed for good.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete entry
          </Button>
        </div>
      </div>
    </div>
  );
}