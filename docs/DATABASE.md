# Database

## Overview

Tally uses Supabase with PostgreSQL for persistent business data, ownership, constraints, RLS, and transactional operations.

## Core Data

The database includes concepts for profiles, clients, projects, time entries, invoices, invoice line items, and invoice counters. Keep this documentation synchronized with Supabase migrations.

## Ownership

User-owned records must be protected by RLS. The core ownership pattern is:

```sql
auth.uid() = user_id
```

Policies should prevent one authenticated user from reading or modifying another user's records.

## Relationships

```text
User
 ├── Profile
 ├── Clients
 │    └── Projects
 │          └── Time Entries
 └── Invoices
      └── Invoice Line Items
```

Foreign keys should enforce valid relationships.

## Invoice Generation

`generate_invoice()` is intended to perform critical invoice operations transactionally: select eligible time entries, create the invoice, create line items, and mark time entries as billed. A failed transaction should not leave partial state.

## Invoice Numbering

Invoice numbering should be database-controlled and must not depend on browser `localStorage`.

## Billed Time Entries

Once time is included in an invoice, historical billed records must be protected from normal modification or deletion.

## RLS Review

When changing a user-owned table, review SELECT, INSERT, UPDATE, and DELETE policies and test both authorized and unauthorized users.

## Migrations

Schema changes should be committed as Supabase migrations. Do not treat a manually modified production database as the schema source.

## Type Safety

Use generated Supabase TypeScript database types where practical so application types stay synchronized with the schema.
