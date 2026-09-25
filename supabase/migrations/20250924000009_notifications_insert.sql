-- Allow customers to insert notifications for themselves (e.g. order created confirmation)
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert with check (customer_id = auth.uid() or public.is_admin());
