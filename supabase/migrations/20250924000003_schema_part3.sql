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
