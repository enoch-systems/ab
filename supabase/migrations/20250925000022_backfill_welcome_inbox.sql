-- Backfill the welcome inbox for customers who registered before this migration.
insert into public.notifications (customer_id, type, title, message)
select p.id, 'account_welcome', 'Welcome to ArcBest',
  'Your account is ready. Our support team is here to help with your shipments.'
from public.profiles p
where p.role = 'customer'
  and not exists (
    select 1 from public.notifications n
    where n.customer_id = p.id and n.type = 'account_welcome'
  );

insert into public.support_messages (customer_id, sender_role, subject, body)
select p.id, 'system', 'Welcome to ArcBest',
  'Your account has been created successfully. You can now receive shipment updates and contact support here.'
from public.profiles p
where p.role = 'customer'
  and not exists (
    select 1 from public.support_messages m
    where m.customer_id = p.id and m.subject = 'Welcome to ArcBest'
  );

alter publication supabase_realtime add table public.support_messages;
alter publication supabase_realtime add table public.shipment_images;
