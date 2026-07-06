-- ============================================================
-- Beauty Salon Booking System + CRM + Finance Tracker
-- Supabase / PostgreSQL — initial schema
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('admin', 'client');

create type booking_status as enum ('pending', 'confirmed', 'cancelled');

create type audit_action as enum (
  'login',
  'create_booking',
  'update_booking',
  'create_expense',
  'update_expense',
  'delete_expense',
  'delete_client',
  'export_report'
);

-- ============================================================
-- AUTHENTICATION & USERS
-- ============================================================

create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,                -- bcrypt only, never plain text
  role          user_role not null default 'client',
  phone         text,
  name          text not null,
  verified      boolean not null default false,
  user_metadata jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  constraint users_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
-- unique constraint on email already creates the index users_email_key

-- ============================================================
-- AUDIT LOGS  (immutable — required for Revenue.ie compliance)
-- ============================================================

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete set null,  -- log survives user deletion
  action      audit_action not null,
  entity_type text not null,               -- booking / expense / client / service
  entity_id   uuid,
  old_value   jsonb,
  new_value   jsonb,
  ip_address  inet,
  user_agent  text,
  "timestamp" timestamptz not null default now()
);

create index idx_audit_logs_user_ts on audit_logs (user_id, "timestamp");

-- audit_logs can NEVER be updated or deleted
create or replace function forbid_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs are immutable (tax compliance): % not allowed', tg_op;
end;
$$;

create trigger trg_audit_logs_immutable
  before update or delete on audit_logs
  for each row execute function forbid_audit_log_mutation();

-- ============================================================
-- CRM — CLIENTS
-- ============================================================

create table clients (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  phone            text not null,
  email            text,
  name             text not null,
  first_visit_date date,
  total_visits     integer not null default 0 check (total_visits >= 0),
  total_spent      numeric(10,2) not null default 0 check (total_spent >= 0),
  last_visit_date  date,
  tags             text[] not null default '{}',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,                       -- GDPR soft delete
  constraint clients_phone_unique_per_user unique (user_id, phone)
);

create index idx_clients_user_phone on clients (user_id, phone);
create index idx_clients_user_email on clients (user_id, email);
create index idx_clients_name       on clients (user_id, name);
create index idx_clients_tags       on clients using gin (tags);

-- ============================================================
-- BOOKING SYSTEM
-- ============================================================

create table services (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  name             text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price            numeric(10,2) not null check (price > 0),
  description      text,
  photo_url        text,
  created_at       timestamptz not null default now()
);

create index idx_services_user on services (user_id);
create index idx_services_name on services (user_id, name);

create table time_slots (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  date             date not null,
  start_time       time not null,
  duration_minutes integer not null check (duration_minutes > 0),
  available        boolean not null default true,
  created_at       timestamptz not null default now(),
  constraint time_slots_no_duplicates unique (user_id, date, start_time),
  constraint time_slots_not_in_past check (date >= current_date)
);

create index idx_time_slots_user_date_avail on time_slots (user_id, date, available);

create table bookings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  service_id      uuid not null references services(id) on delete cascade,
  client_id       uuid references clients(id) on delete cascade,
  client_name     text not null,
  client_phone    text not null,
  client_email    text,
  time_slot_id    uuid not null references time_slots(id) on delete cascade,
  status          booking_status not null default 'pending',
  notes           text,
  amount_received numeric(10,2) check (amount_received >= 0), -- defaults to service.price via trigger
  no_show         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- слот держит максимум один активный букинг (защита от double-booking);
-- partial unique index вместо exclusion constraint — не требует btree_gist
create unique index bookings_one_active_per_slot
  on bookings (time_slot_id)
  where (status <> 'cancelled');

create index idx_bookings_user_status on bookings (user_id, status, created_at);
create index idx_bookings_time_slot   on bookings (time_slot_id);
create index idx_bookings_client      on bookings (client_id);
create index idx_bookings_client_name  on bookings (user_id, client_name);
create index idx_bookings_client_phone on bookings (user_id, client_phone);
create index idx_bookings_client_email on bookings (user_id, client_email);

-- ============================================================
-- FINANCES
-- ============================================================

create table expense_categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  constraint expense_categories_unique_per_user unique (user_id, name)
);

create index idx_expense_categories_user on expense_categories (user_id);

create table expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  category_id uuid not null references expense_categories(id) on delete cascade,
  amount      numeric(10,2) not null check (amount > 0),
  description text not null,
  date        date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_expenses_user_date     on expenses (user_id, date);
create index idx_expenses_user_category on expenses (user_id, category_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- ---------- updated_at ----------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_bookings_updated_at before update on bookings
  for each row execute function set_updated_at();
create trigger trg_clients_updated_at before update on clients
  for each row execute function set_updated_at();
create trigger trg_expenses_updated_at before update on expenses
  for each row execute function set_updated_at();

-- ---------- booking creation: no double-booking + default amount ----------
create or replace function handle_booking_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  slot time_slots%rowtype;
begin
  -- lock the slot so two simultaneous bookings can't both pass the check
  select * into slot from time_slots where id = new.time_slot_id for update;

  if not found then
    raise exception 'time slot % does not exist', new.time_slot_id;
  end if;

  if not slot.available then
    raise exception 'time slot % is already booked', new.time_slot_id;
  end if;

  if slot.user_id <> new.user_id then
    raise exception 'time slot belongs to a different master';
  end if;

  -- amount_received defaults to the service price
  if new.amount_received is null then
    select price into new.amount_received from services where id = new.service_id;
  end if;

  update time_slots set available = false where id = new.time_slot_id;
  return new;
end;
$$;

create trigger trg_bookings_insert
  before insert on bookings
  for each row execute function handle_booking_insert();

-- ---------- cancellation frees the slot ----------
create or replace function handle_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update time_slots set available = true where id = new.time_slot_id;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    -- re-activating: slot must still be free
    update time_slots set available = false
      where id = new.time_slot_id and available;
    if not found then
      raise exception 'time slot % is already booked', new.time_slot_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_bookings_status_change
  before update of status on bookings
  for each row execute function handle_booking_status_change();

-- ---------- keep client stats in sync (total_visits / total_spent / visit dates) ----------
create or replace function refresh_client_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_client uuid := coalesce(new.client_id, old.client_id);
begin
  if target_client is null then
    return coalesce(new, old);
  end if;

  update clients c set
    total_visits     = s.visits,
    total_spent      = s.spent,
    first_visit_date = s.first_visit,
    last_visit_date  = s.last_visit
  from (
    select
      count(*)                                   as visits,
      coalesce(sum(b.amount_received), 0)        as spent,
      min(ts.date)                               as first_visit,
      max(ts.date)                               as last_visit
    from bookings b
    join time_slots ts on ts.id = b.time_slot_id
    where b.client_id = target_client
      and b.status = 'confirmed'
      and not b.no_show
  ) s
  where c.id = target_client;

  return coalesce(new, old);
end;
$$;

create trigger trg_bookings_client_stats
  after insert or update or delete on bookings
  for each row execute function refresh_client_stats();

-- ---------- default expense categories for every new admin ----------
create or replace function seed_expense_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'admin' then
    insert into expense_categories (user_id, name)
    values
      (new.id, 'материалы'),
      (new.id, 'аренда'),
      (new.id, 'коммунальные'),
      (new.id, 'зарплата'),
      (new.id, 'прочее');
  end if;
  return new;
end;
$$;

create trigger trg_users_seed_categories
  after insert on users
  for each row execute function seed_expense_categories();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table users              enable row level security;
alter table audit_logs         enable row level security;
alter table clients            enable row level security;
alter table services           enable row level security;
alter table time_slots         enable row level security;
alter table bookings           enable row level security;
alter table expense_categories enable row level security;
alter table expenses           enable row level security;

-- helper: is the current JWT user an admin?
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- users ----------
-- a user sees and edits only their own row
create policy users_select_own on users
  for select using (id = auth.uid());

create policy users_update_own on users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- password_hash is never readable through the API (column-level grants)
revoke all on users from anon, authenticated;
grant select (id, email, role, phone, name, verified, user_metadata, created_at)
  on users to authenticated;
grant update (phone, name, user_metadata)
  on users to authenticated;

-- ---------- audit_logs ----------
-- visible to admin only; anyone authenticated can write their own entries;
-- update/delete blocked by the immutability trigger and absence of policies
create policy audit_logs_select_admin on audit_logs
  for select using (is_admin() and user_id = auth.uid());

create policy audit_logs_insert_own on audit_logs
  for insert with check (user_id = auth.uid());

-- ---------- clients (admin only, own data) ----------
create policy clients_admin_all on clients
  for all using (is_admin() and user_id = auth.uid())
  with check (is_admin() and user_id = auth.uid());

-- ---------- services ----------
-- admin manages own; everyone (incl. anonymous visitors) can browse to book
create policy services_admin_all on services
  for all using (is_admin() and user_id = auth.uid())
  with check (is_admin() and user_id = auth.uid());

create policy services_public_read on services
  for select using (true);

-- ---------- time_slots ----------
-- admin manages own; visitors see only free future slots
create policy time_slots_admin_all on time_slots
  for all using (is_admin() and user_id = auth.uid())
  with check (is_admin() and user_id = auth.uid());

create policy time_slots_public_read_available on time_slots
  for select using (available and date >= current_date);

-- ---------- bookings ----------
-- admin: full access to own bookings
create policy bookings_admin_all on bookings
  for all using (is_admin() and user_id = auth.uid())
  with check (is_admin() and user_id = auth.uid());

-- client: sees only their own bookings (matched by JWT email)
create policy bookings_client_select_own on bookings
  for select using (client_email = (auth.jwt() ->> 'email'));

-- client: can create a booking, but only as 'pending' and only for themselves
create policy bookings_client_insert on bookings
  for insert to authenticated
  with check (
    status = 'pending'
    and client_email = (auth.jwt() ->> 'email')
  );

-- client: can cancel their own booking (status change enforced in app layer / trigger)
create policy bookings_client_cancel on bookings
  for update to authenticated
  using (client_email = (auth.jwt() ->> 'email'))
  with check (
    client_email = (auth.jwt() ->> 'email')
    and status = 'cancelled'
  );

-- ---------- expense_categories / expenses (admin only, own data) ----------
create policy expense_categories_admin_all on expense_categories
  for all using (is_admin() and user_id = auth.uid())
  with check (is_admin() and user_id = auth.uid());

create policy expenses_admin_all on expenses
  for all using (is_admin() and user_id = auth.uid())
  with check (is_admin() and user_id = auth.uid());
