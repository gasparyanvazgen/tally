# Security Policy

## Scope

Tally handles authenticated user accounts, business profile information, client information, project information, time records, and invoices.

## Secrets and environment variables

The application reads:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

from `.env.local`.

`.env.local` is ignored by the repository's `.gitignore`.

Do not commit:

- `.env.local`
- database passwords
- access tokens
- private API keys
- Supabase service-role keys

The publishable Supabase key is intended for client-side use. It does **not** replace authorization; database access is controlled by Supabase Auth and PostgreSQL RLS.

A service-role key must never be placed in client-side code.

## Authentication

Authentication is implemented with Supabase Auth.

The client calls:

```text
signUp()
signInWithPassword()
signOut()
```

`AuthContext` listens for authentication state changes.

The server-side middleware calls:

```ts
supabase.auth.getUser()
```

to validate the authenticated user for route protection.

Email confirmation is handled through:

```text
/auth/callback
```

where the authorization code is exchanged for a session.

## Route protection

`middleware.ts` protects paths beginning with:

```text
/app
```

An unauthenticated request is redirected to:

```text
/login
```

Authenticated users requesting:

```text
/login
/signup
```

are redirected to:

```text
/app
```

`RequireAuth` provides an additional client-side guard while the initial browser session is loading.

## Row Level Security

The migration enables RLS on:

```text
profiles
clients
projects
time_entries
invoices
invoice_line_items
invoice_counters
```

The primary ownership rule is:

```sql
(select auth.uid()) = user_id
```

For `clients` and `projects`, the policies allow authenticated users to operate on their own rows.

For `time_entries`, the policies intentionally distinguish between unbilled and billed records.

## Cross-user ownership

Projects use a composite foreign key:

```text
(client_id, user_id)
    → clients(id, user_id)
```

This prevents a project belonging to one user from being linked to a client belonging to another user.

The same ownership pattern is used for other related records where appropriate.

## Billed time protection

The database defines:

```text
protect_billed_time_entries
```

and triggers it before updates and deletes.

Normal database operations cannot modify or delete billed time entries.

The invoice-generation function uses a transaction-local setting:

```text
app.invoice_generation = true
```

for its controlled transition.

## Invoice generation security

`generate_invoice()` is a `security definer` PostgreSQL function.

It:

1. Requires an authenticated user.
2. Verifies that the requested client belongs to that user.
3. Allocates the user's invoice sequence.
4. Creates the invoice.
5. Locks eligible time entries.
6. Creates immutable invoice line-item snapshots.
7. Marks those entries billed.
8. Calculates and stores the invoice total.
9. Returns the created invoice.

The function is not executable by `public`; execution is granted to `authenticated`.

## Current security limitation

The backend contains security controls for the eventual persistent time/invoice workflow, but the current frontend still stores time entries and invoices in `localStorage`.

That means the current local data layer is **not a server-enforced multi-device accounting system**.

Before calling Tally production-ready for real financial records, move those operations to Supabase and use the database transaction for invoice generation.

## Production checklist

- [ ] Keep all secrets out of Git.
- [ ] Never expose a Supabase service-role key to the browser.
- [ ] Verify RLS on every application table.
- [ ] Test cross-user reads/writes.
- [ ] Move frontend time entries to Supabase.
- [ ] Move frontend invoices to Supabase.
- [ ] Use the database `generate_invoice()` function.
- [ ] Test concurrent invoice generation.
- [ ] Verify Supabase Auth redirect configuration.
- [ ] Add production monitoring and appropriate abuse/rate controls.
