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
