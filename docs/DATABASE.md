# Database

Tally's PostgreSQL schema is defined in:

```text
supabase/migrations/20260826000000_initial_schema.sql
```

The repository also contains:

```text
tally_database_erd.md
```

which provides a Mermaid ER diagram.

## Entity relationship

```text
auth.users
    │
    └── profiles

clients
    ├── projects
    │      └── time_entries
    └── invoices
           └── invoice_line_items

invoice_counters
```

## Tables

### `profiles`

One row per authenticated user.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | Primary key; references `auth.users` |
| `business_name` | text | Required; default `Your Business` |
| `owner_name` | text | Required |
| `email` | text | Required |
| `address` | text | Required; default empty |
| `created_at` | timestamptz | Default `now()` |
| `updated_at` | timestamptz | Default `now()` |

### `clients`

Stores users' clients.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `name` | text | Must not be blank |
| `contact_email` | text | Default empty |
| `default_rate` | numeric(12,2) | Must be >= 0 |
| `currency` | text | USD, EUR, or GBP |
| `archived` | boolean | Default false |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

`(id, user_id)` is unique to support ownership-aware foreign keys.

### `projects`

Stores projects belonging to clients.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `client_id` | uuid | Client |
| `name` | text | Must not be blank |
| `status` | text | `active` or `completed` |
| `rate_override` | numeric(12,2) | Nullable; must be >= 0 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

The foreign key:

```text
(projects.client_id, projects.user_id)
    →
(clients.id, clients.user_id)
```

keeps the project and client in the same account.

### `time_entries`

Stores billable work.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `project_id` | uuid | Project |
| `date` | date | Work date |
| `minutes` | integer | Must be > 0 |
| `note` | text | Default empty |
| `billed` | boolean | Default false |
| `invoice_id` | uuid | Nullable until billed |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Constraint:

```text
billed = true  → invoice_id is not null
billed = false → invoice_id is null
```

The project relationship also uses `(project_id, user_id)`.

### `invoices`

Stores invoice headers.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `number` | text | Unique per user |
| `client_id` | uuid | Client |
| `issue_date` | date | Default current date |
| `range_start` | date | Required |
| `range_end` | date | Required |
| `currency` | text | USD, EUR, or GBP |
| `status` | text | `unpaid` or `paid` |
| `total` | numeric(12,2) | Must be >= 0 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Constraint:

```text
range_start <= range_end
```

Invoice numbers are unique per user:

```text
unique(user_id, number)
```

### `invoice_line_items`

Stores invoice snapshots.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `invoice_id` | uuid | Invoice |
| `time_entry_id` | uuid | Unique time entry |
| `date` | date | Snapshot |
| `project_name` | text | Snapshot |
| `hours` | numeric(10,2) | > 0 |
| `rate` | numeric(12,2) | >= 0 |
| `subtotal` | numeric(12,2) | >= 0 |
| `created_at` | timestamptz | |

`time_entry_id` is unique, preventing the same time entry from appearing in multiple invoice line items.

### `invoice_counters`

Stores one invoice sequence per user.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | Primary key; references `auth.users` |
| `last_number` | integer | Default 1000; must be >= 1000 |

The invoice function produces numbers such as:

```text
TAL-1001
TAL-1002
```

## RLS

RLS is enabled on all seven application tables:

```text
profiles
clients
projects
time_entries
invoices
invoice_line_items
invoice_counters
```

### Profiles, clients, projects

These tables use an ownership policy equivalent to:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

for authenticated users.

### Time entries

Time entries have separate policies:

- select own rows
- insert own unbilled rows
- update own unbilled rows
- delete own unbilled rows

This intentionally prevents normal client requests from directly creating or modifying billed records.

### Invoices

The migration grants authenticated users read access to their own invoices through RLS.

There is no general client-side insert/update/delete policy for invoices in the migration.

### Invoice line items

Users can read line items when the parent invoice belongs to their authenticated user.

### Invoice counters

RLS is enabled, but the migration does not define normal client-facing policies for the counter table. The invoice function handles sequence allocation.

## Triggers

### `set_updated_at`

Updates `updated_at` on:

```text
profiles
clients
projects
invoices
time_entries
```

### `create_profile_for_new_user`

Triggered after a new `auth.users` row is inserted.

It creates the corresponding profile and copies:

```text
raw_user_meta_data.business_name
```

into `profiles.business_name`.

### `protect_billed_time_entries`

Runs before update/delete on `time_entries`.

Normal operations cannot modify or delete billed entries.

The invoice-generation transaction can perform its controlled billing update through the transaction-local flag.

## Indexes

The migration creates indexes for:

```text
clients(user_id)

projects(user_id, client_id)

time_entries(user_id, date desc)

time_entries(project_id, date desc)

time_entries(user_id, date)
  where not billed

invoices(user_id, issue_date desc)

invoice_line_items(invoice_id)
```

These correspond to the application's common ownership, date, project, unbilled-time, and invoice lookups.

## `generate_invoice()`

The database function is:

```sql
public.generate_invoice(
  p_client_id uuid,
  p_range_start date,
  p_range_end date,
  p_issue_date date default current_date
)
returns public.invoices
```

It is:

```text
language plpgsql
security definer
```

and has:

```text
public execution revoked
authenticated execution granted
```

### Function flow

```text
auth.uid()
   ↓
validate date range
   ↓
load client owned by user
   ↓
allocate invoice number
   ↓
insert invoice
   ↓
set transaction-local invoice-generation flag
   ↓
select matching unbilled time entries FOR UPDATE
   ↓
create invoice line-item snapshots
   ↓
mark entries billed
   ↓
calculate total
   ↓
reject empty invoice
   ↓
update invoice total
   ↓
return invoice
```

### Effective rate

For each time entry:

```text
project.rate_override
        ↓ if null
client.default_rate
```

### Concurrency

The function locks the selected time entries with:

```sql
FOR UPDATE
```

and performs invoice creation, line-item creation, billing, and total calculation in one database transaction.

This is the backend design intended to prevent the same unbilled work from being billed twice by concurrent invoice-generation calls.

## Frontend vs database

The database is prepared for persistent time/invoice data, but the current `DataContext` does not use it for those operations.

Current frontend:

```text
clients       → Supabase
projects      → Supabase

timeEntries   → localStorage
activeTimer   → localStorage
invoices      → localStorage
invoiceSeq    → localStorage
```

Target:

```text
timeEntries
invoices
invoice_line_items
invoice_counters
        ↓
Supabase/PostgreSQL
```

The migration to the target design is the major remaining backend task.
