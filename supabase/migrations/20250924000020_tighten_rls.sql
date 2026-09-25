-- Part 20: tighten RLS.
--
-- The bring-up migrations (00006, 00010-00012, 00015-00018) opened several
-- tables with `using (true)` so the client could read them before auth was
-- wired. That lets *anyone* with the anon key read every customer's email,
-- phone and address, and rewrite any shipment. This migration replaces those
-- with ownership-scoped policies.
--
-- Public tracking by tracking number is served by the /api/track route using
-- the service role, so the anon role never needs direct table access.

-- ── Drop the wide-open / superseded policies ────────────────────────────────
drop policy if exists shipments_public_track on public.shipments;
drop policy if exists shipments_anon_read on public.shipments;
drop policy if exists shipments_insert_auth on public.shipments;
drop policy if exists shipments_update on public.shipments;
drop policy if exists shipments_delete on public.shipments;
drop policy if exists shipments_rw on public.shipments;

drop policy if exists tracking_events_public_track on public.tracking_events;
drop policy if exists tracking_events_anon_read on public.tracking_events;
drop policy if exists tracking_events_insert on public.tracking_events;
drop policy if exists tracking_events_update on public.tracking_events;
drop policy if exists tracking_events_rw on public.tracking_events;

drop policy if exists notifications_rw on public.notifications;
drop policy if exists notifications_insert on public.notifications;
drop policy if exists notifications_anon_read on public.notifications;

drop policy if exists activities_admin_all on public.activities;
drop policy if exists activities_customer_read on public.activities;
drop policy if exists activities_customer_insert on public.activities;
drop policy if exists activities_read_all on public.activities;

drop policy if exists profiles_owner_rw on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_admin_public_read on public.profiles;
drop policy if exists profiles_read_all on public.profiles;

-- ── Recreate, scoped to owner + admin ──────────────────────────────────────
create policy shipments_owner_rw on public.shipments
  for all using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

create policy tracking_events_owner_rw on public.tracking_events
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

create policy notifications_owner_rw on public.notifications
  for all using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

create policy activities_admin_all on public.activities
  for all using (public.is_admin()) with check (public.is_admin());
create policy activities_customer_read on public.activities
  for select using (customer_id = auth.uid());
create policy activities_customer_insert on public.activities
  for insert with check (customer_id = auth.uid());

create policy profiles_owner_rw on public.profiles
  for all using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ── Admin sign-in resolves username -> email server-side ───────────────────
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_key
  on public.profiles (lower(username))
  where username is not null;