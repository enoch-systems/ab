-- Allow customers to log activities for their own actions (shipment created, customer registered)
drop policy if exists activities_customer_insert on public.activities;
create policy activities_customer_insert on public.activities
  for insert with check (customer_id = auth.uid() or public.is_admin());
