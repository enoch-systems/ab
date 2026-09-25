-- Allow authenticated and anon (for guest tracking / quotes) insert into shipments if needed
drop policy if exists shipments_insert_auth on public.shipments;
create policy shipments_insert_auth on public.shipments
  for insert with check (true);

drop policy if exists tracking_events_insert on public.tracking_events;
create policy tracking_events_insert on public.tracking_events
  for insert with check (true);

drop policy if exists tracking_events_update on public.tracking_events;
create policy tracking_events_update on public.tracking_events
  for update using (true);
