# Tally

Time tracking and invoicing app for a solo freelance consultant. Next.js 14 (App Router) + TypeScript + Tailwind
CSS, with Supabase for auth and the database schema.

**Auth is real.** Sign-up and log-in go through Supabase Auth
(`supabase.auth.signUp` / `signInWithPassword`), and each new user gets a
`profiles` row created automatically by a database trigger.

**Everything else is still mocked.** Clients, projects, time entries, and
invoices run on an in-memory context that persists to `localStorage`
(`context/DataContext.tsx`), so the app behaves correctly across refreshes
and logout/login for demo purposes, but nothing is shared between browsers
or devices. See `BACKEND_TASKS.md` for what's left to wire up, and
`supabase/migrations/` for the schema those tables should land in.

## Running it

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project (or use an existing one) and push the schema:

   ```bash
   supabase db push
   ```

   This creates `profiles`, `clients`, `projects`, `time_entries`,
   `invoices`, `invoice_line_items`, and `invoice_counters`, all with
   row-level security scoped to `user_id`, plus the `generate_invoice()`
   function and the trigger that creates a `profiles` row on sign-up.

3. Copy `.env.local.example` to `.env.local` (or edit `.env.local` directly)
   and fill in your project's values:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

   These are the anon/publishable key pair — safe to expose in a browser
   bundle, since they're gated by the row-level security policies in the
   migration rather than by secrecy. `.env.local` is still gitignored as a
   matter of convention; don't commit it.

4. Run the dev server:

   ```bash
   npm run dev
   ```

Open the printed local URL. Sign up with any email and a 6+ character
password. Depending on your Supabase project's auth settings, you'll either
land straight in `/app` or be asked to confirm your email first. Once
logged in, the dashboard, clients, projects, time entries, and invoices
screens seed themselves with demo data on first load (see
`utils/seed.ts`) so every screen has something to look at immediately.
Clear `localStorage` (or open a private window) to reset that demo data —
this does not affect your real Supabase account.

## Project structure

```
app/
  app/            The authenticated app: dashboard, clients, projects,
                    time entries, invoices (+ detail), settings
  login/, signup/ Auth pages
  components/     Shared UI: AppShell (sidebar/nav), Modal, Button, icons,
                    TimeEntryModal, EarningsMeter (landing hero widget),
                    RequireAuth (route guard)
  context/        AuthContext (real Supabase session + profile) and
                    DataContext (mock backend — clients/projects/time
                    entries/invoices + the running timer)
  lib/supabase/   Browser and server Supabase client helpers
  types/          Shared TypeScript types — mirrors the data model the
                    rest of the backend should implement
  utils/          Formatting helpers and seed/demo data
supabase/
  migrations/     SQL schema, RLS policies, and the generate_invoice()
                    function
```

## Design notes

- Palette: warm paper background, near-black "ink" for text and the sidebar,
  a stamp-green accent for paid/positive states, rust for unpaid/attention,
  amber for the live-running timer.
- Type: Fraunces (display headings), IBM Plex Sans (body/UI), IBM Plex Mono
  (anything numeric — durations, money, invoice numbers) so figures read
  clearly and consistently, the way they would on an actual invoice.
- The landing page's hero is a live "earnings meter" — a running counter tied
  to an adjustable hourly rate — as the one deliberate signature element; the
  "how it works" numbering on that page is a real 3-step sequence, not
  decoration.

## What's mocked vs. real

| Feature                                  | Status                                                                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Auth (sign-up, log-in, session)          | Real — Supabase Auth                                                                                                |
| Business profile (Settings)              | Real — reads/writes the `profiles` table                                                                            |
| Clients / Projects CRUD, archive         | Mock (in-memory + localStorage)                                                                                     |
| Timer start/stop                         | Mock, ticks live, creates a time entry on stop                                                                      |
| Manual time entries, edit/delete         | Mock                                                                                                                 |
| Dashboard stats & chart                  | Computed live from the mock entries above                                                                           |
| Invoice generation from unbilled entries | Mock — pulls matching entries client-side, marks them billed. The real, atomic version already exists as the `generate_invoice()` Postgres function in the migration but isn't wired into the UI yet. |
| Invoice PDF                              | Uses the browser's print-to-PDF on a styled invoice page — good enough to demo, not a substitute for backend task 6 |
| Data persistence (clients/projects/time entries/invoices) | `localStorage` only — not shared across devices/browsers                                              |

## Known gaps to close before this is a real product

- Clients, projects, time entries, and invoices still need to be moved off
  `localStorage` and onto the Supabase tables the migration already
  defines.
- No validation beyond the client-side checks already in each form (e.g. no
  rate limiting on auth beyond what Supabase provides by default).
- No handling for concurrent edits, since there's only ever one browser tab's
  localStorage involved right now for the still-mocked data.
- Currency formatting assumes USD/EUR/GBP with straightforward symbol
  prefixes; real multi-currency invoicing may need locale-aware formatting.