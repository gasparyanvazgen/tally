-- Tally's initial Supabase schema. Run with `supabase db push` or paste into
-- the Supabase SQL editor as a project administrator.

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default 'Your Business',
  owner_name text not null default '',
  email text not null,
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  contact_email text not null default '',
  default_rate numeric(12, 2) not null check (default_rate >= 0),
  currency text not null check (currency in ('USD', 'EUR', 'GBP')),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  name text not null check (char_length(trim(name)) > 0),
  status text not null default 'active' check (status in ('active', 'completed')),
  rate_override numeric(12, 2) check (rate_override is null or rate_override >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (client_id, user_id) references public.clients (id, user_id)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  number text not null,
  client_id uuid not null,
  issue_date date not null default current_date,
  range_start date not null,
  range_end date not null,
  currency text not null check (currency in ('USD', 'EUR', 'GBP')),
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, number),
  check (range_start <= range_end),
  foreign key (client_id, user_id) references public.clients (id, user_id)
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  date date not null,
  minutes integer not null check (minutes > 0),
  note text not null default '',
  billed boolean not null default false,
  invoice_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check ((billed and invoice_id is not null) or (not billed and invoice_id is null)),
  foreign key (project_id, user_id) references public.projects (id, user_id),
  foreign key (invoice_id, user_id) references public.invoices (id, user_id)
);

create table public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  time_entry_id uuid not null unique references public.time_entries(id) on delete restrict,
  date date not null,
  project_name text not null,
  hours numeric(10, 2) not null check (hours > 0),
  rate numeric(12, 2) not null check (rate >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

-- An internal counter, used only by generate_invoice. Starting at 1000 keeps
-- the existing TAL-1001 presentation while remaining safe under concurrency.
create table public.invoice_counters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_number integer not null default 1000 check (last_number >= 1000)
);

create index clients_user_id_idx on public.clients (user_id);
create index projects_user_client_idx on public.projects (user_id, client_id);
create index time_entries_user_date_idx on public.time_entries (user_id, date desc);
create index time_entries_project_date_idx on public.time_entries (project_id, date desc);
create index time_entries_unbilled_idx on public.time_entries (user_id, date) where not billed;
create index invoices_user_issue_date_idx on public.invoices (user_id, issue_date desc);
create index invoice_line_items_invoice_idx on public.invoice_line_items (invoice_id);

create function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger clients_set_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices for each row execute function public.set_updated_at();
create trigger time_entries_set_updated_at before update on public.time_entries for each row execute function public.set_updated_at();

-- Creates a profile on sign-up. business_name can be supplied as auth metadata.
create function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, business_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'business_name', 'Your Business'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.create_profile_for_new_user();

-- Billed entries are immutable. The invoice function temporarily sets a
-- transaction-local flag to make its single protected state transition.
create function public.protect_billed_time_entries()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_setting('app.invoice_generation', true) = 'true' then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' and old.billed then
    raise exception 'Billed time entries cannot be deleted';
  end if;
  if tg_op = 'UPDATE' and (old.billed or new.billed or new.invoice_id is not null) then
    raise exception 'Billed time entries cannot be modified directly';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger protect_billed_time_entries_before_update
  before update on public.time_entries for each row execute function public.protect_billed_time_entries();
create trigger protect_billed_time_entries_before_delete
  before delete on public.time_entries for each row execute function public.protect_billed_time_entries();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.time_entries enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.invoice_counters enable row level security;

create policy "profiles: own row" on public.profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "clients: own rows" on public.clients for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "projects: own rows" on public.projects for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "time entries: own rows" on public.time_entries for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "time entries: add own unbilled rows" on public.time_entries for insert to authenticated
  with check ((select auth.uid()) = user_id and not billed and invoice_id is null);
create policy "time entries: edit own unbilled rows" on public.time_entries for update to authenticated
  using ((select auth.uid()) = user_id and not billed) with check ((select auth.uid()) = user_id and not billed and invoice_id is null);
create policy "time entries: delete own unbilled rows" on public.time_entries for delete to authenticated
  using ((select auth.uid()) = user_id and not billed);
create policy "invoices: read own rows" on public.invoices for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "invoice items: read own invoice items" on public.invoice_line_items for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = (select auth.uid())));

-- Generates an invoice, immutable line-item snapshots, and the billed state
-- in one database transaction. Calling it twice cannot bill an entry twice.
create function public.generate_invoice(
  p_client_id uuid,
  p_range_start date,
  p_range_end date,
  p_issue_date date default current_date
)
returns public.invoices
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_client public.clients%rowtype;
  v_invoice public.invoices%rowtype;
  v_entry record;
  v_sequence integer;
  v_total numeric(12, 2) := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_range_start > p_range_end then raise exception 'range_start must be on or before range_end'; end if;
  select * into v_client from public.clients where id = p_client_id and user_id = v_user_id;
  if not found then raise exception 'Client not found'; end if;

  insert into public.invoice_counters (user_id) values (v_user_id)
  on conflict (user_id) do update set last_number = public.invoice_counters.last_number + 1
  returning last_number into v_sequence;

  insert into public.invoices (user_id, number, client_id, issue_date, range_start, range_end, currency, total)
  values (v_user_id, 'TAL-' || v_sequence, p_client_id, p_issue_date, p_range_start, p_range_end, v_client.currency, 0)
  returning * into v_invoice;

  perform set_config('app.invoice_generation', 'true', true);
  for v_entry in
    select te.id, te.minutes, te.date, p.name as project_name,
           coalesce(p.rate_override, v_client.default_rate) as rate
    from public.time_entries te
    join public.projects p on p.id = te.project_id and p.user_id = te.user_id
    where te.user_id = v_user_id and p.client_id = p_client_id and not te.billed
      and te.date between p_range_start and p_range_end
    order by te.date, te.created_at
    for update of te
  loop
    insert into public.invoice_line_items (invoice_id, time_entry_id, date, project_name, hours, rate, subtotal)
    values (v_invoice.id, v_entry.id, v_entry.date, v_entry.project_name,
            round(v_entry.minutes::numeric / 60, 2), v_entry.rate,
            round((v_entry.minutes::numeric / 60) * v_entry.rate, 2));
    v_total := v_total + round((v_entry.minutes::numeric / 60) * v_entry.rate, 2);
    update public.time_entries set billed = true, invoice_id = v_invoice.id where id = v_entry.id;
  end loop;

  if v_total = 0 then raise exception 'No unbilled time entries found for this client and date range'; end if;
  update public.invoices set total = v_total where id = v_invoice.id returning * into v_invoice;
  return v_invoice;
end;
$$;

revoke all on function public.generate_invoice(uuid, date, date, date) from public;
grant execute on function public.generate_invoice(uuid, date, date, date) to authenticated;
