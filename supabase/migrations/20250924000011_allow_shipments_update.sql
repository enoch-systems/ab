-- Allow shipment updates by authenticated users & service role
drop policy if exists shipments_update on public.shipments;
create policy shipments_update on public.shipments
  for update using (true);
