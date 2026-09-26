-- 2026-09-26 · Instant tracking propagation (all writers, all devices)
--
-- Problem this solves
--   Signed-in surfaces (admin console + customer portal) already stream
--   `postgres_changes` and re-pull their snapshot, so they react to a status
--   change on their own. The PUBLIC /track/<id> page cannot: RLS keeps shipment
--   rows private to their owner, so an anonymous visitor has no postgres_changes
--   to listen to and the page had to poll every 5 seconds. That is the "it does
--   not move until I reload" behaviour.
--
-- Fix
--   A database trigger broadcasts a *content-free* signal on a per-shipment
--   topic, `shipment:<TRACKING_NUMBER>`, the instant any row on any of the
--   three tracking tables changes. Because it lives in the database it fires
--   for EVERY writer — the admin console, this app's API routes, and manual
--   edits made straight in the Supabase dashboard table editor or SQL editor.
--   Nothing has to remember to notify.
--
-- Security
--   The payload carries ONLY the tracking number plus which table changed. No
--   sender/recipient, address, cost or instruction ever reaches the wire, so an
--   anonymous socket on this topic learns nothing beyond what the public URL
--   already exposes. Clients treat the message purely as "re-fetch" and go back
--   to the service-role-backed /api/track route for the real (sanitised) data,
--   which means a spoofed broadcast can at worst cause one extra request.
--   The topic is public on purpose (`private => false`): a private topic would
--   require RLS on realtime.messages and would lock anonymous visitors out,
--   which is the exact audience this page serves.

-- ── 1) Signal function ──────────────────────────────────────────────────────
create or replace function public.broadcast_shipment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shipment_id uuid;
  v_tracking    text;
begin
  -- Resolve the owning shipment. NEW is unassigned on DELETE, so branch on
  -- tg_op rather than coalescing NEW/OLD fields.
  if tg_table_name = 'shipments' then
    if tg_op = 'DELETE' then
      v_shipment_id := old.id;
    else
      v_shipment_id := new.id;
    end if;
  elsif tg_op = 'DELETE' then
    v_shipment_id := old.shipment_id;
  else
    v_shipment_id := new.shipment_id;
  end if;

  select s.tracking_number into v_tracking
  from public.shipments s
  where s.id = v_shipment_id;

  -- A shipment row deleted outright has no tracking number left to broadcast;
  -- clients fall back to their safety poll and render "not found".
  if v_tracking is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  perform realtime.send(
    jsonb_build_object(
      'tracking_number', v_tracking,
      'source',         tg_table_name,
      'op',             lower(tg_op)
    ),
    'shipment_changed',
    'shipment:' || v_tracking,
    false
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- ── 2) Triggers ─────────────────────────────────────────────────────────────
-- AFTER, so the broadcast only fires once the write has actually succeeded.
-- shipment_images is included so a freshly uploaded product image appears on
-- the tracking page immediately, not on the next poll.
drop trigger if exists broadcast_shipment_change_row on public.shipments;
create trigger broadcast_shipment_change_row
  after insert or update or delete on public.shipments
  for each row execute function public.broadcast_shipment_change();

drop trigger if exists broadcast_tracking_event_change on public.tracking_events;
create trigger broadcast_tracking_event_change
  after insert or update or delete on public.tracking_events
  for each row execute function public.broadcast_shipment_change();

drop trigger if exists broadcast_shipment_image_change on public.shipment_images;
create trigger broadcast_shipment_image_change
  after insert or update or delete on public.shipment_images
  for each row execute function public.broadcast_shipment_change();

-- ── 3) Verification ─────────────────────────────────────────────────────────
-- 3a · Expect 3 rows.
select tgname, tgrelid::regclass as table_name
from pg_trigger
where tgname like 'broadcast_%'
order by 1;

-- 3b · Run this, then update any shipment from the dashboard: an anon socket
--      on topic `shipment:<TRACKING_NUMBER>` receives `shipment_changed`.
