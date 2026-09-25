-- Shipment creation and lifecycle writes are admin-only. Customers can read
-- their own shipment history, but cannot create, edit, or delete shipments.
drop policy if exists shipments_owner_rw on public.shipments;
create policy shipments_customer_read on public.shipments
  for select using (customer_id = auth.uid() or public.is_admin());
create policy shipments_admin_write on public.shipments
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists tracking_events_owner_rw on public.tracking_events;
create policy tracking_events_customer_read on public.tracking_events
  for select using (
    public.is_admin() or exists (
      select 1 from public.shipments s
      where s.id = tracking_events.shipment_id and s.customer_id = auth.uid()
    )
  );
create policy tracking_events_admin_write on public.tracking_events
  for all using (public.is_admin()) with check (public.is_admin());

-- Notifications are customer-readable; only admins create them. A customer
-- may update only the read flag.
drop policy if exists notifications_owner_rw on public.notifications;
create policy notifications_customer_read on public.notifications
  for select using (customer_id = auth.uid() or public.is_admin());
create policy notifications_admin_write on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());
create policy notifications_customer_mark_read on public.notifications
  for update using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

create or replace function public.protect_profile_security_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.id and not public.is_admin()
    and (new.id <> old.id or new.email <> old.email or new.role <> old.role or new.account_status <> old.account_status) then
    raise exception 'Profile security fields can only be changed by an administrator';
  end if;
  return new;
end $$;
drop trigger if exists protect_profile_security_fields on public.profiles;
create trigger protect_profile_security_fields
  before update on public.profiles
  for each row execute function public.protect_profile_security_fields();

create or replace function public.protect_support_message_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and (
    new.customer_id <> old.customer_id or new.sender_id <> old.sender_id or
    new.sender_role <> old.sender_role or new.subject <> old.subject or
    new.body <> old.body or new.shipment_id IS DISTINCT FROM old.shipment_id
  ) then
    raise exception 'Support message content is immutable';
  end if;
  return new;
end $$;
drop trigger if exists protect_support_message_fields on public.support_messages;
create trigger protect_support_message_fields
  before update on public.support_messages
  for each row execute function public.protect_support_message_fields();
