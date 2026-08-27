// Clients and projects are real now: they're read from and written to the
// `clients` / `projects` Supabase tables (see supabase/migrations), scoped
// by row-level security to the signed-in user. Time entries, invoices, and
// the timer are still the temporary in-browser layer described below — a
// future backend task replaces those localStorage reads/writes too.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Client, Project, TimeEntry, Invoice, Currency, InvoiceLineItem } from '../types'
import { uid, todayISO, minutesToHours, isWithinRange } from '../utils/format'
import { createClient } from '../lib/supabase/client'
import { useAuth } from './AuthContext'

// The browser key used to persist the still-mocked data between page refreshes.
const STORAGE_KEY = 'tally.data.v1'

interface ActiveTimer {
  projectId: string
  startedAt: number // The exact start time in milliseconds since 1 January 1970.
  note: string
}

// clients/projects are intentionally not part of this shape — they live in
// their own useState, loaded from Supabase rather than localStorage.
interface DataShape {
  timeEntries: TimeEntry[]
  invoices: Invoice[]
  activeTimer: ActiveTimer | null
  invoiceSeq: number
}

// A row-shaped client/project record from Supabase (snake_case columns).
interface ClientRow {
  id: string
  name: string
  contact_email: string
  default_rate: number | string
  currency: Currency
  archived: boolean
  created_at: string
}

interface ProjectRow {
  id: string
  client_id: string
  name: string
  status: Project['status']
  rate_override: number | string | null
  created_at: string
}

function clientFromRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    contactEmail: row.contact_email,
    defaultRate: Number(row.default_rate),
    currency: row.currency,
    archived: row.archived,
    createdAt: row.created_at,
  }
}

function projectFromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    status: row.status,
    rateOverride: row.rate_override == null ? null : Number(row.rate_override),
    createdAt: row.created_at,
  }
}

// Every client/project write resolves to this so callers (the edit forms)
// can show a real error instead of silently failing.
type Result = { error: string | null }

interface DataContextValue extends DataShape {
  clients: Client[]
  projects: Project[]
  // True until each table's first Supabase read for the signed-in user
  // resolves, so pages can show a loading state instead of "no clients yet".
  clientsLoading: boolean
  projectsLoading: boolean
  // clients
  addClient: (c: Omit<Client, 'id' | 'archived' | 'createdAt'>) => Promise<Result>
  updateClient: (id: string, patch: Partial<Client>) => Promise<Result>
  archiveClient: (id: string, archived: boolean) => Promise<Result>
  // projects
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => Promise<Result>
  updateProject: (id: string, patch: Partial<Project>) => Promise<Result>
  deleteProject: (id: string) => Promise<Result>
  // True once this project has any time entries (billed or not), which is
  // when deletion must be blocked — the entries (and any invoice built from
  // them) would otherwise be left pointing at a project that no longer exists.
  projectHasTimeEntries: (id: string) => boolean
  // time entries
  addTimeEntry: (e: Omit<TimeEntry, 'id' | 'billed' | 'invoiceId' | 'createdAt'>) => void
  updateTimeEntry: (id: string, patch: Partial<TimeEntry>) => void
  deleteTimeEntry: (id: string) => Result
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

// Read saved data; start empty otherwise. Note: utils/seed.ts's demo time
// entries/invoices reference a fixed set of made-up project/client ids that
// only made sense back when clients/projects were mocked too. Now that those
// tables are real per-user Supabase data, seeding against those stale ids
// would just produce time entries pointing at projects that don't exist, so
// this no longer auto-seeds them — a signed-up user starts with a clean
// slate and adds real clients/projects/time entries through the app.
function loadState(): DataShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error('no data yet')
    const parsed = JSON.parse(raw)
    return {
      timeEntries: parsed.timeEntries ?? [],
      invoices: parsed.invoices ?? [],
      activeTimer: parsed.activeTimer ?? null,
      invoiceSeq: parsed.invoiceSeq ?? 1003,
    }
  } catch {
    return {
      timeEntries: [],
      invoices: [],
      activeTimer: null,
      invoiceSeq: 1003,
    }
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  // Stable across renders, same pattern as AuthProvider, so the effect below
  // doesn't tear down and resubscribe on every render.
  const [supabase] = useState(() => createClient())

  // Every change to the still-mocked data updates this one state object.
  const [state, setState] = useState<DataShape>(loadState)

  // clients/projects live outside DataShape: they're not persisted to
  // localStorage, they're fetched from Supabase per signed-in user.
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [projectsLoading, setProjectsLoading] = useState(true)

  // Persist every state change so the demo continues to work after a refresh.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Load this user's clients and projects whenever the signed-in user
  // changes (sign-in, sign-out, or switching accounts). Row-level security
  // already scopes these queries to the caller, but the explicit user_id
  // filters keep the intent obvious and match the pattern used elsewhere
  // (see AuthContext's profiles query).
  useEffect(() => {
    if (!userId) {
      setClients([])
      setProjects([])
      setClientsLoading(false)
      setProjectsLoading(false)
      return
    }
    let cancelled = false
    setClientsLoading(true)
    setProjectsLoading(true)

    supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Failed to load clients:', error.message)
        setClients(error || !data ? [] : (data as ClientRow[]).map(clientFromRow))
        setClientsLoading(false)
      })

    supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Failed to load projects:', error.message)
        setProjects(error || !data ? [] : (data as ProjectRow[]).map(projectFromRow))
        setProjectsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, supabase])

  // Lookup helpers let pages display related client/project information from an ID.
  const getClient = (id: string) => clients.find((c) => c.id === id)
  const getProject = (id: string) => projects.find((p) => p.id === id)

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
    const projectIds = new Set(projects.filter((p) => p.clientId === clientId).map((p) => p.id))
    return state.timeEntries
      .filter((e) => !e.billed && projectIds.has(e.projectId))
      .reduce((sum, e) => sum + e.minutes, 0)
  }

  // Add a client and generate fields the form should not be allowed to
  // choose. Requires a signed-in user since `user_id` is what RLS checks
  // the row against, and there's no server-side default for that column.
  const addClient = async (c: Omit<Client, 'id' | 'archived' | 'createdAt'>): Promise<Result> => {
    if (!userId) return { error: 'You need to be signed in to add a client.' }
    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        name: c.name,
        contact_email: c.contactEmail,
        default_rate: c.defaultRate,
        currency: c.currency,
      })
      .select()
      .single()
    if (error || !data) return { error: error?.message ?? 'Could not add client.' }
    setClients((cur) => [...cur, clientFromRow(data as ClientRow)])
    return { error: null }
  }

  // Update only the supplied fields while preserving the rest of the client record.
  const updateClient = async (id: string, patch: Partial<Client>): Promise<Result> => {
    const payload: Record<string, unknown> = {}
    if (patch.name !== undefined) payload.name = patch.name
    if (patch.contactEmail !== undefined) payload.contact_email = patch.contactEmail
    if (patch.defaultRate !== undefined) payload.default_rate = patch.defaultRate
    if (patch.currency !== undefined) payload.currency = patch.currency
    if (patch.archived !== undefined) payload.archived = patch.archived

    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error || !data) return { error: error?.message ?? 'Could not update client.' }
    const updated = clientFromRow(data as ClientRow)
    setClients((cur) => cur.map((c) => (c.id === id ? updated : c)))
    return { error: null }
  }

  // Archive keeps historical invoices intact instead of deleting the client.
  const archiveClient = (id: string, archived: boolean) => updateClient(id, { archived })

  // Create a project linked to an existing client. The clients/projects
  // composite foreign key (see the migration) rejects this at the database
  // level if client_id belongs to a different user, so a bad clientId
  // surfaces here as an error rather than a silent cross-account link.
  const addProject = async (p: Omit<Project, 'id' | 'createdAt'>): Promise<Result> => {
    if (!userId) return { error: 'You need to be signed in to add a project.' }
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        client_id: p.clientId,
        name: p.name,
        status: p.status,
        rate_override: p.rateOverride,
      })
      .select()
      .single()
    if (error || !data) return { error: error?.message ?? 'Could not add project.' }
    setProjects((cur) => [...cur, projectFromRow(data as ProjectRow)])
    return { error: null }
  }

  // Apply changes to one matching project.
  const updateProject = async (id: string, patch: Partial<Project>): Promise<Result> => {
    const payload: Record<string, unknown> = {}
    if (patch.clientId !== undefined) payload.client_id = patch.clientId
    if (patch.name !== undefined) payload.name = patch.name
    if (patch.status !== undefined) payload.status = patch.status
    if (patch.rateOverride !== undefined) payload.rate_override = patch.rateOverride

    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error || !data) return { error: error?.message ?? 'Could not update project.' }
    const updated = projectFromRow(data as ProjectRow)
    setProjects((cur) => cur.map((p) => (p.id === id ? updated : p)))
    return { error: null }
  }

  // A project is deletable only once nothing references it — every time
  // entry (and, transitively, every invoice line item built from one) keeps
  // a projectId, so removing a referenced project would orphan that history.
  const projectHasTimeEntries = (id: string): boolean =>
    state.timeEntries.some((e) => e.projectId === id)

  // Deletes a project outright. Guarded the same way on both sides: the
  // button that opens this is disabled/hidden once the project has time
  // entries, and this check runs again here so the rule holds even if
  // something else calls it.
  const deleteProject = async (id: string): Promise<Result> => {
    if (projectHasTimeEntries(id)) {
      return {
        error:
          'This project has time entries logged against it and can\u2019t be deleted. Mark it completed instead, or delete its time entries first.',
      }
    }
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) return { error: error.message }
    setProjects((cur) => cur.filter((p) => p.id !== id))
    return { error: null }
  }

  const value: DataContextValue = useMemo(
    () => ({
      ...state,
      clients,
      projects,
      clientsLoading,
      projectsLoading,
      getClient,
      getProject,
      rateForProject,
      currencyForProject,
      unbilledMinutesForClient,
      projectHasTimeEntries,
      addClient,
      updateClient,
      archiveClient,
      addProject,
      updateProject,
      deleteProject,

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

      // Remove one entry. Once an entry is billed it's part of an issued
      // invoice's history, so deletion is refused here too, not just by
      // disabling the button — matches the same belt-and-suspenders check
      // deleteProject does below.
      deleteTimeEntry: (id) => {
        const entry = state.timeEntries.find((e) => e.id === id)
        if (entry?.billed) {
          return { error: 'This entry has already been billed and can\u2019t be deleted.' }
        }
        setState((s) => ({ ...s, timeEntries: s.timeEntries.filter((e) => e.id !== id) }))
        return { error: null }
      },

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
        // Client/project lookups read the Supabase-backed state above
        // (closed over here) rather than `s`, since clients/projects are no
        // longer part of the mock DataShape that setState updates.
        let created: Invoice | null = null
        setState((s) => {
          const client = clients.find((c) => c.id === clientId)
          if (!client) return s
          const projectIds = new Set(
            projects.filter((p) => p.clientId === clientId).map((p) => p.id),
          )
          // Only unbilled entries belonging to this client's projects can appear on the invoice.
          const eligible = s.timeEntries.filter(
            (e) => !e.billed && projectIds.has(e.projectId) && isWithinRange(e.date, start, end),
          )
          if (eligible.length === 0) return s

          // Convert each time entry into the immutable invoice line item shown to the client.
          const lineItems: InvoiceLineItem[] = eligible.map((e) => {
            const rate = e.projectId
              ? (projects.find((p) => p.id === e.projectId)?.rateOverride ??
                client.defaultRate)
              : client.defaultRate
            const hours = minutesToHours(e.minutes)
            return {
              entryId: e.id,
              date: e.date,
              projectName: projects.find((p) => p.id === e.projectId)?.name ?? 'Project',
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
    [state, clients, projects, clientsLoading, projectsLoading, userId, supabase],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  // A small helper for reading shared data inside any child page or component.
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}