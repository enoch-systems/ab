-- 2026-09-25: admin-created shipments, shipment images, and support inbox.
-- Customers can view their own shipments/messages; admins can manage all.

alter type public.notification_type add value if not exists 'account_welcome';

do $$ begin
  create type public.message_sender_role as enum ('admin', 'customer', 'system');
exception when duplicate_object then null; end $$;

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_role public.message_sender_role not null,
  subject text not null default '',
  body text not null,
  shipment_id uuid references public.shipments(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists support_messages_customer_idx
  on public.support_messages (customer_id, created_at desc);
create index if not exists support_messages_unread_idx
  on public.support_messages (customer_id, read_at, created_at desc);

create table if not exists public.shipment_images (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  alt_text text not null default 'Shipment product image',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists shipment_images_shipment_idx
  on public.shipment_images (shipment_id, sort_order, created_at);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shipment-images', 'shipment-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.support_messages enable row level security;
alter table public.shipment_images enable row level security;

drop policy if exists support_messages_owner_admin on public.support_messages;
create policy support_messages_owner_admin on public.support_messages
  for select using (customer_id = auth.uid() or public.is_admin());
drop policy if exists support_messages_admin_insert on public.support_messages;
create policy support_messages_admin_insert on public.support_messages
  for insert with check (public.is_admin());
drop policy if exists support_messages_customer_insert on public.support_messages;
create policy support_messages_customer_insert on public.support_messages
  for insert with check (
    customer_id = auth.uid()
    and sender_id = auth.uid()
    and sender_role = 'customer'
  );
drop policy if exists support_messages_owner_admin_update on public.support_messages;
create policy support_messages_owner_admin_update on public.support_messages
  for update using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists shipment_images_owner_admin on public.shipment_images;
create policy shipment_images_owner_admin on public.shipment_images
  for select using (
    public.is_admin() or exists (
      select 1 from public.shipments s
      where s.id = shipment_images.shipment_id and s.customer_id = auth.uid()
    )
  );
drop policy if exists shipment_images_admin_write on public.shipment_images;
create policy shipment_images_admin_write on public.shipment_images
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists shipment_images_storage_read on storage.objects;
create policy shipment_images_storage_read on storage.objects
  for select using (bucket_id = 'shipment-images');
drop policy if exists shipment_images_storage_insert on storage.objects;
create policy shipment_images_storage_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'shipment-images' and public.is_admin());
drop policy if exists shipment_images_storage_update on storage.objects;
create policy shipment_images_storage_update on storage.objects
  for update to authenticated
  using (bucket_id = 'shipment-images' and public.is_admin())
  with check (bucket_id = 'shipment-images' and public.is_admin());
drop policy if exists shipment_images_storage_delete on storage.objects;
create policy shipment_images_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'shipment-images' and public.is_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, email, phone, address, country, state, city)
  values (
    new.id,
    case
      when (new.raw_user_meta_data->>'role') in ('admin', 'customer')
      then (new.raw_user_meta_data->>'role')::user_role
      else 'customer'::user_role
    end,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    coalesce(new.raw_user_meta_data->>'address',''),
    coalesce(new.raw_user_meta_data->>'country',''),
    coalesce(new.raw_user_meta_data->>'state',''),
    coalesce(new.raw_user_meta_data->>'city','')
  )
  on conflict (id) do nothing;

  insert into public.notifications (customer_id, type, title, message)
  values (
    new.id,
    'account_welcome',
    'Welcome to ArcBest',
    'Your account is ready. Our support team is here to help with your shipments.'
  );

  insert into public.support_messages (customer_id, sender_role, subject, body)
  values (
    new.id,
    'system',
    'Welcome to ArcBest',
    'Your account has been created successfully. You can now receive shipment updates and contact support here.'
  );
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
