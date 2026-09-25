-- 2026-09-25 · Live tracking fixes
--
--  1) Make sure every table the app subscribes to is in the supabase_realtime
--     publication (idempotent — safe to run again and again).
--  2) Remove duplicate scans that the pre-fix client created: it INSERTed a
--     brand-new tracking_event row on every status change, so the timeline
--     showed the same scan twice after a reload.
--  3) Recompute tracking_event.state exactly the way lib/app-state.tsx does:
--        'current'  → newest stamped scan for the shipment's current status
--                     (fallback: newest stamped scan at-or-before that stage;
--                      none when the shipment is Delivered)
--        'completed'→ every other stamped scan
--        'upcoming' → undated template rows

-- ── 1) Realtime publication coverage ────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  begin
    alter publication supabase_realtime add table public.shipments;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.tracking_events;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.activities;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.support_messages;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.shipment_images;
  exception when duplicate_object then null; end;
end $$;

-- ── 2) Remove duplicate stamped scans (keep the earliest row per stamp) ─────
with ranked_duplicates as (
  select te.id,
         row_number() over (
           partition by te.shipment_id, te.status, te.event_date, te.event_time
           order by te.created_at asc, te.id asc
         ) as rn
  from public.tracking_events te
  where (te.event_date <> '' or te.event_time <> '')
)
delete from public.tracking_events te
using ranked_duplicates r
where r.id = te.id and r.rn > 1;

-- ── 3) Recompute tracking-event states ──────────────────────────────────────
with
  journey_statuses as (
    select '{"Order Created","Confirmed","Picked Up","In Transit","Arrived at Facility","Out for Delivery","Delivered","Exception"}'::public.shipment_status[] as statuses
  ),
  journey_indexes as (
    select
      s.id as shipment_id,
      s.status as shipment_status,
      array_position(j.statuses, s.status) as shipment_index
    from public.shipments s, journey_statuses j
  ),
  stamped as (
    select
      te.id,
      te.shipment_id,
      te.status,
      array_position(j.statuses, te.status) as status_index,
      coalesce(te.occurred_at, te.created_at) as ord
    from public.tracking_events te, journey_statuses j
    where (te.event_date <> '' or te.event_time <> '')
  ),
  -- Rows that could carry the 'current' marker. Newest first, exact stage
  -- match preferred over the at-or-before fallback.
  current_candidates as (
    select distinct on (sd.shipment_id) sd.shipment_id, sd.id as current_event_id
    from stamped sd
    join journey_indexes ji on ji.shipment_id = sd.shipment_id
    where ji.shipment_status <> 'Delivered'
      and (sd.status = ji.shipment_status
           or (sd.status_index is not null and ji.shipment_index is not null
               and sd.status_index <= ji.shipment_index))
    order by sd.shipment_id,
             (sd.status = ji.shipment_status) desc,
             sd.ord desc,
             sd.id desc
  )
update public.tracking_events te
set state = case
  when cpc.current_event_id is not null then 'current'::public.event_state
  when (te.event_date <> '' or te.event_time <> '') then 'completed'::public.event_state
  else 'upcoming'::public.event_state
end
from (
  select ev.id as event_id, cpc.current_event_id
  from public.tracking_events ev
  left join current_candidates cpc on cpc.current_event_id = ev.id
) cpc
where cpc.event_id = te.id;