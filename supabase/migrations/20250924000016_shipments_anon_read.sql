-- Allow tracking scans to be read publicly by tracking number
drop policy if exists shipments_anon_read on public.shipments;
create policy shipments_anon_read on public.shipments
  for select using (true);

drop policy if exists tracking_events_anon_read on public.tracking_events;
create policy tracking_events_anon_read on public.tracking_events
  for select using (true);
