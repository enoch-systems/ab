-- Allow anon read of activities for demo / dashboard display
drop policy if exists activities_read_all on public.activities;
create policy activities_read_all on public.activities
  for select using (true);
