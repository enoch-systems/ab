create or replace function public.protect_notification_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and (
    new.customer_id <> old.customer_id or new.type <> old.type or
    new.title <> old.title or new.message <> old.message or
    new.shipment_id IS DISTINCT FROM old.shipment_id or
    new.tracking_number IS DISTINCT FROM old.tracking_number
  ) then
    raise exception 'Notification content is immutable';
  end if;
  return new;
end $$;
drop trigger if exists protect_notification_fields on public.notifications;
create trigger protect_notification_fields
  before update on public.notifications
  for each row execute function public.protect_notification_fields();
