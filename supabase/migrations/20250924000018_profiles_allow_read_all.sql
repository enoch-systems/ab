-- Allow profiles to be listed by admin or for customer name lookup
drop policy if exists profiles_read_all on public.profiles;
create policy profiles_read_all on public.profiles
  for select using (true);
