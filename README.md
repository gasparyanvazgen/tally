# Tally

**Time Tracking & Invoicing for Freelancers**

Tally is a Next.js application for freelancers to manage clients and projects, record billable time, run a work timer, and create invoices.

## Current implementation

Tally is currently a **hybrid application**:

- **Supabase:** authentication, business profiles, clients, and projects.
- **Browser `localStorage`:** time entries, active timer state, invoices, and the invoice sequence used by the current frontend.
- **Supabase database:** also contains `time_entries`, `invoices`, `invoice_line_items`, `invoice_counters`, RLS, triggers, and a transactional `generate_invoice()` function, but the current frontend does not use those backend objects for time/invoice operations yet.

This distinction is important: the database schema is further along than the current frontend data layer.

## Features

- Email/password sign-up and sign-in with Supabase Auth
- Email-confirmation callback handling
- Protected application routes
- Business profile editing
- Client creation, editing, and archiving
- Project creation, editing, completion, and guarded deletion
- Manual time-entry creation/editing/deletion
- Running timer
- Local invoice generation from unbilled time
- Paid/unpaid invoice status
- Browser print flow for invoices
- Responsive desktop/mobile application shell

## Tech stack

- Next.js `14.2.35`
- React `18.3.1`
- TypeScript `^5.5.4`
- Tailwind CSS `^3.4.10`
- Supabase JS `^2.112.4`
- `@supabase/ssr` `^0.12.5`
- ESLint 9
- PostgreSQL through Supabase

## Requirements

Install Node.js and npm. A Supabase project is required for the authentication, profile, client, and project functionality.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a Supabase project and configure its URL and publishable key.

The repository contains the initial database migration:

```text
supabase/migrations/20260826000000_initial_schema.sql
```

It creates the application's PostgreSQL schema, RLS policies, triggers, indexes, and `generate_invoice()` function.

Apply the migration with the Supabase CLI:

```bash
supabase db push
```

or run the SQL in the Supabase SQL Editor as an administrator.

### 3. Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The current project uses exactly these two environment variables.

Do not commit `.env.local`.

### 4. Configure authentication

The sign-up code sends confirmation links to:

```text
/auth/callback
```

The callback exchanges the Supabase authorization code for a session and redirects to `/app`.

Configure the corresponding site URL and redirect URL in Supabase for the environment where the application runs.

### 5. Run the application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 6. Other scripts

```bash
npm run lint
npm run build
npm run start
```

These are the four scripts currently defined in `package.json`.

## Routes

| Route | Purpose | Access |
|---|---|---|
| `/` | Public landing page | Public |
| `/login` | Sign in | Public/auth page |
| `/signup` | Create account | Public/auth page |
| `/auth/callback` | Supabase confirmation callback | Callback |
| `/app` | Dashboard | Authenticated |
| `/app/clients` | Client management | Authenticated |
| `/app/projects` | Project management | Authenticated |
| `/app/time` | Time tracking | Authenticated |
| `/app/invoices` | Invoice list/generation | Authenticated |
| `/app/invoices/[id]` | Invoice detail | Authenticated |
| `/app/settings` | Business profile | Authenticated |

The `/app` prefix is protected by `middleware.ts`. `app/app/layout.tsx` also wraps the application with `RequireAuth` and `AppShell`.

## Main workflow

```text
Sign up / Sign in
       ↓
Business profile
       ↓
Create client
       ↓
Create project
       ↓
Log time or start timer
       ↓
Generate invoice
       ↓
Review invoice
       ↓
Mark paid / print
```

The first four data-management steps above are currently backed by Supabase. Time and invoice operations are currently local to the browser.

## Project structure

```text
app/
├── app/
│   ├── page.tsx
│   ├── clients/page.tsx
│   ├── projects/page.tsx
│   ├── time/page.tsx
│   ├── invoices/page.tsx
│   ├── invoices/[id]/page.tsx
│   ├── settings/page.tsx
│   └── layout.tsx
├── auth/callback/route.ts
├── components/
├── context/
│   ├── AuthContext.tsx
│   └── DataContext.tsx
├── lib/supabase/
│   ├── client.ts
│   └── server.ts
├── login/page.tsx
├── signup/page.tsx
├── types/index.ts
├── utils/
├── layout.tsx
├── providers.tsx
└── not-found.tsx

supabase/
├── migrations/
│   └── 20260826000000_initial_schema.sql
└── config.toml
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Development](docs/DEVELOPMENT.md)
- [Security](SECURITY.md)

## Known limitations

### Time and invoices are not yet persistent backend data

`DataContext.tsx` stores these in:

```text
tally.data.v1
```

inside browser `localStorage`:

```text
timeEntries
invoices
activeTimer
invoiceSeq
```

Therefore this data is tied to the browser/device and is not currently synchronized through Supabase.

### Backend invoice generation is not wired to the UI

The SQL migration contains:

```sql
public.generate_invoice(...)
```

which creates the invoice, line items, and billed-time state transactionally.

The current frontend instead runs its own invoice-generation logic inside `DataContext.tsx`.

### Invoice PDF

The invoice detail page uses the browser's print flow rather than generating a dedicated PDF file on the server.

## Next backend milestone

Move these operations from `DataContext`/`localStorage` to Supabase:

```text
time entries
active timer persistence
invoices
invoice line items
invoice numbering
paid/unpaid status
```

Then use `public.generate_invoice()` as the authoritative invoice-generation path.
