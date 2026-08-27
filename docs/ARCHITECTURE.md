# Architecture

## Overview

Tally is a Next.js App Router application with two React Context providers and a Supabase backend.

The current architecture is hybrid:

```text
                         Browser
                            │
                     Next.js App Router
                            │
             ┌──────────────┴──────────────┐
             │                             │
        AuthContext                   DataContext
             │                             │
             ▼                    ┌────────┴────────┐
        Supabase Auth             │                 │
                                  ▼                 ▼
                              Supabase         localStorage
                              clients/         time/invoices
                              projects
```

The database also contains the backend schema for time entries and invoices, but those tables are not currently used by the frontend `DataContext` for normal CRUD/invoice generation.

## Routing

The application uses Next.js App Router.

Examples:

```text
app/app/clients/page.tsx
→ /app/clients

app/app/invoices/[id]/page.tsx
→ /app/invoices/:id
```

`app/app/layout.tsx` wraps the authenticated application.

## Root providers

`app/providers.tsx` establishes:

```tsx
<AuthProvider>
  <DataProvider>
    {children}
  </DataProvider>
</AuthProvider>
```

`DataProvider` is nested inside `AuthProvider` because it reads the current authenticated `userId`.

## Authentication architecture

### Browser client

`app/lib/supabase/client.ts` uses:

```ts
createBrowserClient(...)
```

with the public Supabase URL and publishable key.

It is used by the client-side contexts.

### Server client

`app/lib/supabase/server.ts` uses:

```ts
createServerClient(...)
```

and Next.js cookies.

It is used by server-side authentication code, including the auth callback.

### AuthContext

`app/context/AuthContext.tsx` owns:

- current user
- authentication state
- loading state
- email
- business profile
- email-confirmation state
- sign-in
- sign-up
- sign-out
- profile updates

The profile is read from `public.profiles`.

The profile row is created by the database trigger after `auth.users` insertion; the client does not insert the profile during sign-up.

## Sign-up flow

```text
/signup
   ↓
AuthContext.signUp()
   ↓
supabase.auth.signUp()
   ↓
auth.users
   ↓
on_auth_user_created trigger
   ↓
profiles
```

The business name is passed as user metadata:

```text
business_name
```

The trigger copies it into the profile.

When email confirmation is required:

```text
confirmation email
       ↓
/auth/callback?code=...
       ↓
exchangeCodeForSession()
       ↓
/app
```

## Login flow

```text
/login
   ↓
signInWithPassword()
   ↓
Supabase session
   ↓
middleware / AuthContext
   ↓
/app
```

## Route protection

There are two layers.

### Middleware

`middleware.ts`:

- refreshes the Supabase session cookies
- validates the user with `getUser()`
- protects `/app*`
- redirects authenticated users away from `/login` and `/signup`

### RequireAuth

`app/components/RequireAuth.tsx` waits for the client session check and redirects to `/login` if the user is not authenticated.

The middleware is the request-level guard; `RequireAuth` prevents private UI from rendering while the client session is unresolved.

## AppShell

`app/components/AppShell.tsx` provides the authenticated application shell:

- desktop sidebar
- mobile bottom navigation
- header
- running timer display
- logout controls
- main scrollable content area

The navigation is based on the application's `NAV` configuration.

## DataContext

`app/context/DataContext.tsx` is the central application data layer.

### Supabase-backed

```text
clients
projects
```

It loads both tables for the current `userId` and performs their create/update/delete operations through the Supabase browser client.

### localStorage-backed

```text
timeEntries
invoices
activeTimer
invoiceSeq
```

They are stored together under:

```text
tally.data.v1
```

The provider loads this state from `localStorage` and persists changes with an effect.

## Client/project data flow

```text
Clients page
   ↓
useData()
   ↓
addClient / updateClient / archiveClient
   ↓
Supabase
   ↓
public.clients
```

```text
Projects page
   ↓
useData()
   ↓
addProject / updateProject / deleteProject
   ↓
Supabase
   ↓
public.projects
```

## Time data flow

Current implementation:

```text
Time page
   ↓
useData()
   ↓
addTimeEntry / updateTimeEntry / deleteTimeEntry
   ↓
React state
   ↓
localStorage
```

The timer stores a `projectId` and `startedAt` timestamp.

Stopping the timer converts elapsed milliseconds into minutes, with a minimum of one minute, and creates a normal time entry.

## Invoice data flow

Current implementation:

```text
Invoices page
   ↓
generateInvoice()
   ↓
local time entries
   ↓
local invoice line items
   ↓
local invoice
   ↓
localStorage
```

The frontend:

- selects unbilled entries
- filters them by client/project and date range
- resolves the project rate override or client default rate
- converts minutes to decimal hours
- calculates line subtotals
- calculates the invoice total
- marks selected entries as billed
- increments the local invoice sequence

## Database invoice architecture

The SQL migration separately defines:

```text
generate_invoice()
```

This function is designed to perform the invoice operation transactionally in PostgreSQL.

It is currently **not called by `DataContext.generateInvoice()`**.

## Rate resolution

The frontend uses:

```text
project.rateOverride
        ↓ if null
client.defaultRate
```

The database invoice function uses the same effective-rate rule.

## Shared components

`app/components/ui.tsx` provides:

```text
Button
Badge
Card
Modal
Field
inputClass
EmptyState
CloseIcon
```

`TimeEntryModal.tsx` provides the time-entry form.

`EarningsMeter.tsx` is a landing-page visual demonstration rather than the application's persistent timer.

## Utility layer

`app/utils/format.ts` contains pure helpers for:

- money formatting
- minute/hour conversion
- date formatting
- today's ISO date
- initials
- date-range checks
- week/month boundaries
- demo IDs

`app/utils/seed.ts` contains demo seed generators, but `DataContext` currently does not auto-seed them because their old fixed client/project IDs would not match per-user Supabase records.

## Target architecture

The intended completed architecture is:

```text
Next.js
   │
   ├── AuthContext
   │
   └── Data/query layer
            │
            ▼
         Supabase
            │
            ├── profiles
            ├── clients
            ├── projects
            ├── time_entries
            ├── invoices
            ├── invoice_line_items
            └── invoice_counters
```

The main architectural migration is to remove `localStorage` as the source of truth for time and invoice data.
