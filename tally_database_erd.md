```mermaid
erDiagram
  PROFILES {
    uuid user_id PK
    text business_name
    text owner_name
    text email
    text address
  }
  CLIENTS {
    uuid id PK
    uuid user_id FK
    text name
    text currency
    numeric default_rate
    boolean archived
  }
  PROJECTS {
    uuid id PK
    uuid user_id FK
    uuid client_id FK
    text name
    text status
    numeric rate_override
  }
  TIME_ENTRIES {
    uuid id PK
    uuid user_id FK
    uuid project_id FK
    date date
    integer minutes
    boolean billed
    uuid invoice_id FK
  }
  INVOICES {
    uuid id PK
    uuid user_id FK
    uuid client_id FK
    text number
    date range_start
    date range_end
    text status
    numeric total
  }
  INVOICE_LINE_ITEMS {
    uuid id PK
    uuid invoice_id FK
    uuid time_entry_id FK
    numeric hours
    numeric rate
    numeric subtotal
  }
  INVOICE_COUNTERS {
    uuid user_id PK
    integer last_number
  }
  CLIENTS ||--o{ PROJECTS : has
  CLIENTS ||--o{ INVOICES : billed_to
  PROJECTS ||--o{ TIME_ENTRIES : logs
  INVOICES ||--o{ INVOICE_LINE_ITEMS : contains
  TIME_ENTRIES ||--o| INVOICE_LINE_ITEMS : billed_as