# Architecture

## Overview

Tally is a Next.js application using React for the UI and Supabase/PostgreSQL for authentication and persistent application data.

```text
User
 ↓
Next.js / React
 ↓
Supabase
 ↓
PostgreSQL
 ↓
RLS + constraints + transactions
```

## Responsibilities

### React / Browser
UI, forms, interaction, local UI state, and loading/error states. The browser is not the security boundary.

### Next.js
Routing, server/client boundaries, authentication integration, and server-side application logic where appropriate.

### Supabase / PostgreSQL
Authentication, database access, RLS, persistent business data, constraints, indexes, functions, and transactions.

## Data Ownership

User-owned records must be associated with the authenticated user and protected by RLS. The database must enforce ownership.

## Production Direction

Persistent business data should use Supabase rather than browser-only `localStorage`. The migration work includes time entries, timer state where appropriate, invoices, and invoice numbering.

## Invoice Flow

```text
Invoice UI
 ↓
Supabase RPC
 ↓
generate_invoice()
 ↓
PostgreSQL transaction
 ├── invoice
 ├── invoice_line_items
 └── billed time entries
```

## Code Organization

Reusable UI components belong in [app/components/](../app/components/). Data-access logic should be separated from presentation logic as the application grows, for example:

```text
lib/
├── clients/
├── projects/
├── time-entries/
└── invoices/
```

See [DATABASE](DATABASE.md) and [DEVELOPMENT](DEVELOPMENT.md).
