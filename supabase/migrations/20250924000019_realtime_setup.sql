-- Add all key tables to supabase_realtime publication
alter publication supabase_realtime add table public.shipments;
alter publication supabase_realtime add table public.tracking_events;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.activities;
