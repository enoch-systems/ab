-- Allow authenticated users to insert their own profile row if the trigger didn't fire
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid() or public.is_admin());

-- Allow public read of admin profile name/email for display if needed
drop policy if exists profiles_admin_public_read on public.profiles;
create policy profiles_admin_public_read on public.profiles
  for select using (role = 'admin' or id = auth.uid() or public.is_admin());
