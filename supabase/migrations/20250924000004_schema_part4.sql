-- Part 4: triggers + helpers (auto-profile on signup, updated_at, is_admin)
create or replace function public.touch_last_updated()
returns trigger language plpgsql as $$
begin
  new.last_updated = now();
  return new;
end $$;
drop trigger if exists shipments_touch on public.shipments;
create trigger shipments_touch before update on public.shipments
  for each row execute function public.touch_last_updated();

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
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- is_admin() bypasses RLS recursion: policies call this, not profiles directly.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
