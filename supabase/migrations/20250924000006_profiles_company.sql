-- Add company column if missing and add public read policy for tracking
alter table public.profiles add column if not exists company text;

-- Allow public / anon to read minimal shipment data for /track/[trackingNumber]
drop policy if exists shipments_public_track on public.shipments;
create policy shipments_public_track on public.shipments
  for select using (true);

-- Allow public / anon to read tracking_events for the timeline
drop policy if exists tracking_events_public_track on public.tracking_events;
create policy tracking_events_public_track on public.tracking_events
  for select using (true);
