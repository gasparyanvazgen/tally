# Development Guide

## Project requirements

The project is a Next.js application with the following package versions currently declared in `package.json`:

```text
Next.js       14.2.35
React         18.3.1
TypeScript    ^5.5.4
Tailwind CSS  ^3.4.10
Supabase JS   ^2.112.4
@supabase/ssr ^0.12.5
```

## Install

```bash
npm install
```

## Environment

Create:

```text
.env.local
```

with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

The project already ignores `*.local` and `.env.local`.

## Development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Validation

Run:

```bash
npm run lint
npm run build
```

Production-style local start:

```bash
npm run start
```

The current `package.json` defines exactly these scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint ."
}
```

## Database setup

The initial schema is:

```text
supabase/migrations/20260826000000_initial_schema.sql
```

Apply it with:

```bash
supabase db push
```

or execute it in the Supabase SQL Editor.

The repository also contains:

```text
supabase/config.toml
```

for Supabase CLI configuration.

## Adding a page

Create a `page.tsx` inside the appropriate route directory.

Example:

```text
app/app/reports/page.tsx
```

becomes:

```text
/app/reports
```

Because it is under `/app`, it is inside the authenticated application layout.

## Adding a reusable component

Shared UI components currently live in:

```text
app/components/
```

The main UI primitives are exported from:

```text
app/components/ui.tsx
```

Examples:

```tsx
<Button>Save</Button>
```

```tsx
<Button variant="secondary">Cancel</Button>
```

```tsx
<Badge tone="stamp">Paid</Badge>
```

```tsx
<Card className="p-6">
  Content
</Card>
```

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Add client"
>
  ...
</Modal>
```

```tsx
<Field label="Client name">
  <input className={inputClass} />
</Field>
```

## Using authentication

Client components can use:

```tsx
"use client";

import { useAuth } from "../context/AuthContext";

export default function Example() {
  const { profile, email, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div>
      <h1>{profile.businessName}</h1>
      <p>{email}</p>
    </div>
  );
}
```

## Using application data

```tsx
"use client";

import { useData } from "../context/DataContext";

export default function Example() {
  const { clients, projects } = useData();

  return (
    <p>
      {clients.length} clients and {projects.length} projects
    </p>
  );
}
```

## Creating a client

`DataContext` exposes:

```ts
addClient(client)
```

Example:

```ts
await addClient({
  name: "Acme Studio",
  contactEmail: "billing@example.com",
  defaultRate: 150,
  currency: "USD",
});
```

The context writes the row to Supabase.

## Creating a project

```ts
await addProject({
  clientId,
  name: "Website Redesign",
  status: "active",
  rateOverride: null,
});
```

The database checks that the client belongs to the same user.

## Current time-entry API

The current context provides:

```ts
addTimeEntry(...)
updateTimeEntry(...)
deleteTimeEntry(...)
```

Example:

```ts
addTimeEntry({
  projectId,
  date: "2026-08-27",
  minutes: 90,
  note: "Homepage implementation",
});
```

These operations currently modify the local `DataContext` state and therefore `localStorage`, not Supabase.

## Timer

Start:

```ts
startTimer(projectId);
```

Stop:

```ts
stopTimer("Client call");
```

Discard:

```ts
discardTimer();
```

Stopping converts elapsed time into a time entry with at least one minute.

## Current invoice API

The frontend exposes:

```ts
generateInvoice(clientId, start, end)
```

Example:

```ts
const invoice = generateInvoice(
  clientId,
  "2026-08-01",
  "2026-08-31"
);
```

It currently creates the invoice in the browser state.

Invoice status is changed with:

```ts
markInvoiceStatus(invoiceId, "paid");
```

## Important: do not duplicate backend invoice logic

The frontend currently contains invoice calculations, but the database also contains:

```sql
public.generate_invoice(...)
```

When completing the backend migration, do not create a second independent invoice implementation. Replace the local implementation with the database RPC so PostgreSQL owns:

- invoice numbering
- selection of unbilled entries
- row locking
- line-item creation
- billed state
- total calculation

## Utilities

`app/utils/format.ts` provides:

```ts
formatMoney(1500, "USD")
// "$1,500.00"

minutesToHM(90)
// "1h 30m"

minutesToHours(90)
// 1.5

formatDate("2026-08-27")
// "Aug 27, 2026"

initials("Ada Lovelace")
// "AL"

isWithinRange("2026-08-27", "2026-08-01", "2026-08-31")
// true
```

## Seed data

`app/utils/seed.ts` contains example generators for clients, projects, time entries, and invoices.

The current `DataContext` does **not** automatically use these seed functions because their fixed IDs were created for the earlier mock-data architecture and would not correspond to real per-user Supabase clients/projects.

## Database changes

For a persistent schema change:

1. Create or update a Supabase migration.
2. Add constraints and foreign keys.
3. Enable RLS for new exposed tables.
4. Add policies for authenticated ownership.
5. Add indexes for common queries.
6. Update application types.
7. Update the data layer.
8. Test allowed and forbidden access.

Do not rely on client-side checks for authorization.

## Git workflow

Keep commits focused on one logical change.

Examples:

```text
feat: add client archive action
fix: prevent deleting billed time
refactor: extract invoice calculation
docs: update database documentation
style: improve invoice layout
```

Before committing:

```bash
npm run lint
npm run build
git status
git diff
```

Verify that:

- `.env.local` is not staged.
- No secrets are included.
- The diff contains only the intended change.
- Database migrations are included when schema changes are made.
- Documentation matches the implementation.

## Recommended implementation order

The largest remaining architectural change is:

```text
1. Persist time entries in Supabase
        ↓
2. Load time entries per authenticated user
        ↓
3. Persist timer state if cross-device timers are required
        ↓
4. Persist invoices in Supabase
        ↓
5. Replace local generateInvoice() with generate_invoice() RPC
        ↓
6. Read invoice line items from Supabase
        ↓
7. Persist invoice status
        ↓
8. Remove obsolete localStorage invoice/time state
```

After that, the application can be treated as a genuinely persistent multi-user backend rather than a hybrid frontend/backend implementation.
