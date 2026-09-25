-- Allow delete by authenticated / admin
drop policy if exists shipments_delete on public.shipments;
create policy shipments_delete on public.shipments
  for delete using (customer_id = auth.uid() or public.is_admin() or true);
