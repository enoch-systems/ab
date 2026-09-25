-- ============================================================================
-- ABOMA / ArcBest Logistics — Single-File Complete Schema & RLS Setup
-- Safe to paste into: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- >>> START 20250924000001_schema_part1.sql <<<
-- ABOMA / ArcBest — Supabase schema v1 (part 1: extensions + enums)
-- Run: npx supabase db push  (or paste parts 1-4 into Dashboard → SQL Editor in order)

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

do $$ begin
  create type shipment_status as enum (
    'Order Created','Confirmed','Picked Up','In Transit',
    'Arrived at Facility','Out for Delivery','Delivered','Exception'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type shipping_method as enum ('Standard','Express','Premium','International');
exception when duplicate_object then null; end $$;

do $$ begin
  create type package_type as enum ('Box','Envelope','Pallet','Crate','Tube');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('Active','Suspended','Pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'shipment_created','package_picked_up','shipment_in_transit',
    'shipment_arrived_facility','shipment_out_for_delivery',
    'shipment_delivered','delivery_exception','shipment_confirmed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type activity_type as enum (
    'admin_logged_in','admin_profile_updated','admin_password_changed',
    'customer_registered','shipment_created','shipment_status_changed',
    'tracking_event_added','shipment_delivered','customer_updated'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_state as enum ('completed','current','upcoming');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('customer','admin');
exception when duplicate_object then null; end $$;
-- >>> END 20250924000001_schema_part1.sql <<<

-- >>> START 20250924000002_schema_part2.sql <<<
-- Part 2: profiles + shipments (profiles.id = auth.users.id)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null default '',
  email text not null,
  phone text not null default '',
  address text not null default '',
  country text not null default '',
  state text not null default '',
  city text not null default '',
  company text,
  account_status account_status not null default 'Active',
  default_shipping_method shipping_method,
  default_package_type package_type,
  default_instructions text,
  notify_email boolean not null default true,
  notify_sms boolean not null default false,
  notify_push boolean not null default true,
  two_factor_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  last_active timestamptz not null default now()
);
create unique index if not exists profiles_email_unique on public.profiles (lower(email));

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_number text not null,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  sender jsonb not null default '{}'::jsonb,
  recipient jsonb not null default '{}'::jsonb,
  origin text not null default '',
  destination text not null default '',
  status shipment_status not null default 'Order Created',
  current_location text not null default '',
  package_type package_type not null default 'Box',
  weight numeric(10,2) not null default 0,
  dimensions text not null default '',
  package_count int not null default 1,
  shipping_method shipping_method not null default 'Standard',
  cost numeric(12,2) not null default 0,
  currency text not null default 'USD',
  instructions text,
  estimated_delivery timestamptz,
  created_at timestamptz not null default now(),
  last_updated timestamptz not null default now()
);
create unique index if not exists shipments_tracking_unique on public.shipments (tracking_number);
create index if not exists shipments_customer_idx on public.shipments (customer_id);
create index if not exists shipments_status_idx on public.shipments (status);
create index if not exists shipments_tracking_trgm on public.shipments using gin (tracking_number gin_trgm_ops);
-- >>> END 20250924000002_schema_part2.sql <<<

-- >>> START 20250924000003_schema_part3.sql <<<
-- Part 3: tracking_events + notifications + activities + reviews
-- tracking_events is ONE row per scan — never mass-stamp (timeline fix).
create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status shipment_status not null,
  location text not null default '',
  event_date text not null default '',
  event_time text not null default '',
  occurred_at timestamptz,
  description text not null default '',
  state event_state not null default 'upcoming',
  created_at timestamptz not null default now()
);
create index if not exists tracking_events_shipment_idx
  on public.tracking_events (shipment_id, occurred_at nulls last, created_at);
create index if not exists tracking_events_shipment_state_idx
  on public.tracking_events (shipment_id, state);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  title text not null default '',
  message text not null default '',
  shipment_id uuid references public.shipments(id) on delete set null,
  tracking_number text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_customer_idx
  on public.notifications (customer_id, created_at desc);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  type activity_type not null,
  actor text not null default '',
  action text not null default '',
  reference_id text,
  customer_id uuid references public.profiles(id) on delete set null,
  shipment_id uuid references public.shipments(id) on delete set null,
  details text,
  created_at timestamptz not null default now()
);
create index if not exists activities_created_idx on public.activities (created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  shipment_id uuid references public.shipments(id) on delete set null,
  tracking_number text,
  rating int not null check (rating between 1 and 5),
  title text not null default '',
  message text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists reviews_created_idx on public.reviews (created_at desc);
-- >>> END 20250924000003_schema_part3.sql <<<

-- >>> START 20250924000004_schema_part4.sql <<<
-- Part 4: triggers + helpers (auto-profile on signup, updated_at, is_admin)
create or replace function public.touch_last_updated()
returns trigger language plpgsql as $$
begin
  new.last_updated = now();
  return new;
end $$;
drop trigger if exists shipments_touch on public.shipments;
create trigger shipments_touch before update on public.shipments
  for each row execute function public.touch_last_updated();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, email, phone, address, country, state, city)
  values (
    new.id,
    case
      when (new.raw_user_meta_data->>'role') in ('admin', 'customer')
      then (new.raw_user_meta_data->>'role')::user_role
      else 'customer'::user_role
    end,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    coalesce(new.raw_user_meta_data->>'address',''),
    coalesce(new.raw_user_meta_data->>'country',''),
    coalesce(new.raw_user_meta_data->>'state',''),
    coalesce(new.raw_user_meta_data->>'city','')
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- is_admin() bypasses RLS recursion: policies call this, not profiles directly.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
-- >>> END 20250924000004_schema_part4.sql <<<

-- >>> START 20250924000005_rls.sql <<<
-- Part 5: RLS — customers see only theirs, admins see all.
-- Public tracking (by tracking number) is served via service-role route, not RLS.
alter table public.profiles enable row level security;
alter table public.shipments enable row level security;
alter table public.tracking_events enable row level security;
alter table public.notifications enable row level security;
alter table public.activities enable row level security;
alter table public.reviews enable row level security;

-- profiles: owner RW, admin all
drop policy if exists profiles_owner_rw on public.profiles;
create policy profiles_owner_rw on public.profiles
  for all using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- shipments: owner RW, admin all
drop policy if exists shipments_rw on public.shipments;
create policy shipments_rw on public.shipments
  for all using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

-- tracking_events: via parent shipment ownership
drop policy if exists tracking_events_rw on public.tracking_events;
create policy tracking_events_rw on public.tracking_events
  for all using (
    public.is_admin() or exists (
      select 1 from public.shipments s
      where s.id = tracking_events.shipment_id and s.customer_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.shipments s
      where s.id = tracking_events.shipment_id and s.customer_id = auth.uid()
    )
  );

-- notifications: owner RW, admin all
drop policy if exists notifications_rw on public.notifications;
create policy notifications_rw on public.notifications
  for all using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

-- activities: admin read-all + insert; customers read own rows
drop policy if exists activities_admin_all on public.activities;
create policy activities_admin_all on public.activities
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists activities_customer_read on public.activities;
create policy activities_customer_read on public.activities
  for select using (customer_id = auth.uid());

-- reviews: anyone can read; owner/admin write
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select using (true);
drop policy if exists reviews_write on public.reviews;
create policy reviews_write on public.reviews
  for insert with check (customer_id = auth.uid() or public.is_admin());
drop policy if exists reviews_update on public.reviews;
create policy reviews_update on public.reviews
  for update using (customer_id = auth.uid() or public.is_admin());
-- >>> END 20250924000005_rls.sql <<<
