// This is the temporary in-browser data layer. A future backend will replace these
// localStorage reads and state updates with database requests.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Client, Project, TimeEntry, Invoice, Currency, InvoiceLineItem } from '../types'
import { seedClients, seedProjects, seedTimeEntries, seedInvoices } from '../utils/seed'
import { uid, todayISO, minutesToHours, isWithinRange } from '../utils/format'

// The browser key used to persist the demo data between page refreshes.
const STORAGE_KEY = 'tally.data.v1'

interface ActiveTimer {
  projectId: string
  startedAt: number // The exact start time in milliseconds since 1 January 1970.
  note: string
}

interface DataShape {
  clients: Client[]
  projects: Project[]
  timeEntries: TimeEntry[]
  invoices: Invoice[]
  activeTimer: ActiveTimer | null
  invoiceSeq: number
}

interface DataContextValue extends DataShape {
  // clients
  addClient: (c: Omit<Client, 'id' | 'archived' | 'createdAt'>) => void
  updateClient: (id: string, patch: Partial<Client>) => void
  archiveClient: (id: string, archived: boolean) => void
  // projects
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  // time entries
  addTimeEntry: (e: Omit<TimeEntry, 'id' | 'billed' | 'invoiceId' | 'createdAt'>) => void
  updateTimeEntry: (id: string, patch: Partial<TimeEntry>) => void
  deleteTimeEntry: (id: string) => void
  // timer
  startTimer: (projectId: string) => void
  stopTimer: (note?: string) => void
  discardTimer: () => void
  // invoices
  generateInvoice: (clientId: string, start: string, end: string) => Invoice | null
  markInvoiceStatus: (id: string, status: Invoice['status']) => void
  // derived helpers
  getClient: (id: string) => Client | undefined
  getProject: (id: string) => Project | undefined
  rateForProject: (projectId: string) => number
  currencyForProject: (projectId: string) => Currency
  unbilledMinutesForClient: (clientId: string) => number
}

// The shared data object starts empty and is filled by DataProvider.
const DataContext = createContext<DataContextValue | null>(null)

// Read saved data. On a first visit (or corrupted saved data), create demo records instead.
function loadState(): DataShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error('no data yet')
    const parsed = JSON.parse(raw)
    return {
      clients: parsed.clients ?? [],
      projects: parsed.projects ?? [],
      timeEntries: parsed.timeEntries ?? [],
      invoices: parsed.invoices ?? [],
      activeTimer: parsed.activeTimer ?? null,
      invoiceSeq: parsed.invoiceSeq ?? 1003,
    }
  } catch {
    return {
      clients: seedClients(),
      projects: seedProjects(),
      timeEntries: seedTimeEntries(),
      invoices: seedInvoices(),
      activeTimer: null,
      invoiceSeq: 1003,
    }
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  // Every change in the app updates this one state object.
  const [state, setState] = useState<DataShape>(loadState)

  // Persist every state change so the demo continues to work after a refresh.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Lookup helpers let pages display related client/project information from an ID.
  const getClient = (id: string) => state.clients.find((c) => c.id === id)
  const getProject = (id: string) => state.projects.find((p) => p.id === id)

  const rateForProject = (projectId: string): number => {
    const project = getProject(projectId)
    if (!project) return 0
    // A project-specific rate wins; otherwise use the client-wide default rate.
    if (project.rateOverride != null) return project.rateOverride
    return getClient(project.clientId)?.defaultRate ?? 0
  }

  const currencyForProject = (projectId: string): Currency => {
    const project = getProject(projectId)
    if (!project) return 'USD'
    return getClient(project.clientId)?.currency ?? 'USD'
  }

  const unbilledMinutesForClient = (clientId: string): number => {
    // First find this client's projects, then total only their unbilled entries.
    const projectIds = new Set(state.projects.filter((p) => p.clientId === clientId).map((p) => p.id))
    return state.timeEntries
      .filter((e) => !e.billed && projectIds.has(e.projectId))
      .reduce((sum, e) => sum + e.minutes, 0)
  }

  const value: DataContextValue = useMemo(
    () => ({
      ...state,
      getClient,
      getProject,
      rateForProject,
      currencyForProject,
      unbilledMinutesForClient,

      // Add a client and generate fields the form should not be allowed to choose.
      addClient: (c) =>
        setState((s) => ({
          ...s,
          clients: [
            ...s.clients,
            { ...c, id: uid('client'), archived: false, createdAt: todayISO() },
          ],
        })),

      // Update only the supplied fields while preserving the rest of the client record.
      updateClient: (id, patch) =>
        setState((s) => ({
          ...s,
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      // Archive keeps historical invoices intact instead of deleting the client.
      archiveClient: (id, archived) =>
        setState((s) => ({
          ...s,
          clients: s.clients.map((c) => (c.id === id ? { ...c, archived } : c)),
        })),

      // Create a project linked to an existing client.
      addProject: (p) =>
        setState((s) => ({
          ...s,
          projects: [...s.projects, { ...p, id: uid('proj'), createdAt: todayISO() }],
        })),

      // Apply changes to one matching project.
      updateProject: (id, patch) =>
        setState((s) => ({
          ...s,
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      // New entries begin unbilled and are placed first so recent work appears at the top.
      addTimeEntry: (e) =>
        setState((s) => ({
          ...s,
          timeEntries: [
            { ...e, id: uid('entry'), billed: false, invoiceId: null, createdAt: todayISO() },
            ...s.timeEntries,
          ],
        })),

      // Edit a single time entry without changing the rest of the list.
      updateTimeEntry: (id, patch) =>
        setState((s) => ({
          ...s,
          timeEntries: s.timeEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      // Remove one entry. A real backend must also forbid removal of billed entries.
      deleteTimeEntry: (id) =>
        setState((s) => ({ ...s, timeEntries: s.timeEntries.filter((e) => e.id !== id) })),

      // Store the start timestamp; elapsed time is calculated later from this value.
      startTimer: (projectId) =>
        setState((s) => ({ ...s, activeTimer: { projectId, startedAt: Date.now(), note: '' } })),

      // Turn a running timer into a permanent time entry.
      stopTimer: (note = '') =>
        setState((s) => {
          if (!s.activeTimer) return s
          // Convert milliseconds into minutes and record at least one minute of work.
          const minutes = Math.max(1, Math.round((Date.now() - s.activeTimer.startedAt) / 60000))
          const entry: TimeEntry = {
            id: uid('entry'),
            projectId: s.activeTimer.projectId,
            date: todayISO(),
            minutes,
            note,
            billed: false,
            invoiceId: null,
            createdAt: todayISO(),
          }
          return { ...s, activeTimer: null, timeEntries: [entry, ...s.timeEntries] }
        }),

      // Forget a running timer without creating a billable entry.
      discardTimer: () => setState((s) => ({ ...s, activeTimer: null })),

      // Create an invoice from this client's unbilled entries in the selected date range.
      generateInvoice: (clientId, start, end) => {
        let created: Invoice | null = null
        setState((s) => {
          const client = s.clients.find((c) => c.id === clientId)
          if (!client) return s
          const projectIds = new Set(
            s.projects.filter((p) => p.clientId === clientId).map((p) => p.id),
          )
          // Only unbilled entries belonging to this client's projects can appear on the invoice.
          const eligible = s.timeEntries.filter(
            (e) => !e.billed && projectIds.has(e.projectId) && isWithinRange(e.date, start, end),
          )
          if (eligible.length === 0) return s

          // Convert each time entry into the immutable invoice line item shown to the client.
          const lineItems: InvoiceLineItem[] = eligible.map((e) => {
            const rate = e.projectId
              ? (s.projects.find((p) => p.id === e.projectId)?.rateOverride ??
                client.defaultRate)
              : client.defaultRate
            const hours = minutesToHours(e.minutes)
            return {
              entryId: e.id,
              date: e.date,
              projectName: s.projects.find((p) => p.id === e.projectId)?.name ?? 'Project',
              hours,
              rate,
              subtotal: Math.round(hours * rate * 100) / 100,
            }
          })
          // Add subtotals and round to two decimal places for currency.
          const total = Math.round(lineItems.reduce((sum, li) => sum + li.subtotal, 0) * 100) / 100

          const invoice: Invoice = {
            id: uid('inv'),
            number: `TAL-${s.invoiceSeq}`,
            clientId,
            issueDate: todayISO(),
            rangeStart: start,
            rangeEnd: end,
            lineItems,
            total,
            currency: client.currency,
            status: 'unpaid',
            createdAt: todayISO(),
          }
          created = invoice

          // Remember included IDs so the original time entries can be marked as billed.
          const eligibleIds = new Set(eligible.map((e) => e.id))
          return {
            ...s,
            invoiceSeq: s.invoiceSeq + 1,
            invoices: [invoice, ...s.invoices],
            timeEntries: s.timeEntries.map((e) =>
              eligibleIds.has(e.id) ? { ...e, billed: true, invoiceId: invoice.id } : e,
            ),
          }
        })
        return created
      },

      // Change only the paid/unpaid status of a matching invoice.
      markInvoiceStatus: (id, status) =>
        setState((s) => ({
          ...s,
          invoices: s.invoices.map((i) => (i.id === id ? { ...i, status } : i)),
        })),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [state],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  // A small helper for reading shared data inside any child page or component.
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
