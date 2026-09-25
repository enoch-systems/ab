-- ============================================================================
-- ABOMA / ArcBest — status updates: persist + realtime + track page
-- Safe to paste into: Supabase Dashboard → SQL Editor → Run (it is idempotent)
--
-- What this does:
--   1) Adds every table the app subscribes to onto the supabase_realtime
--      publication (so the /track page and customer dashboards update live).
--   2) Deletes duplicate scans the old client created (it inserted a fresh
--      tracking_event row on every status change → double entries after reload).
--   3) Recomputes tracking_event.state exactly the way lib/app-state.tsx does:
--        'current'   → newest stamped scan for the shipment's current status
--                      (fallback: newest stamped scan at-or-before that stage;
--                      none when the shipment is Delivered)
--        'completed' → every other stamped scan
--        'upcoming'  → undated template rows
--   4) Runs verification queries at the end.
-- ============================================================================

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

-- ── 4) Verification queries ─────────────────────────────────────────────────

-- 4a · Every table the app needs is on the realtime publication (expect 6 rows)
select p.schemaname || '.' || p.tablename as published_table
from pg_publication_tables p
where p.pubname = 'supabase_realtime'
order by 1;

-- 4b · Duplicate scans should now be gone (expect 0 rows)
select te.shipment_id, te.status, te.event_date, te.event_time, count(*) as copies
from public.tracking_events te
where (te.event_date <> '' or te.event_time <> '')
group by 1, 2, 3, 4
having count(*) > 1;

-- 4c · At most one 'current' row per shipment (expect 0 rows)
select te.shipment_id, count(*) filter (where te.state = 'current') as current_rows
from public.tracking_events te
group by te.shipment_id
having count(*) filter (where te.state = 'current') > 1;

-- 4d · Peek at what customers see (sanity check the states)
select s.tracking_number, s.status as shipment_status,
       te.status as event_status, te.state, te.event_date, te.event_time
from public.shipments s
join public.tracking_events te on te.shipment_id = s.id
order by s.created_at desc, te.created_at asc
limit 20;