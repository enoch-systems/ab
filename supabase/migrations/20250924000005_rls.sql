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
