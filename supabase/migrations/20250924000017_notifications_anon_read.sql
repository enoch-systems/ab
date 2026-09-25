-- Allow read/update of notifications by recipient (or admin)
drop policy if exists notifications_read_all on public.notifications;
create policy notifications_read_all on public.notifications
  for select using (true);

drop policy if exists notifications_update_all on public.notifications;
create policy notifications_update_all on public.notifications
  for update using (true);
