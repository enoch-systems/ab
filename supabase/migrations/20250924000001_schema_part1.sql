-- ABOMA / ArcBest — Supabase schema v1 (part 1: extensions + enums)
-- Run: npx supabase db push  (or paste parts 1-4 into Dashboard → SQL Editor in order)

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

do $$ begin
  create type shipment_status as enum (
    'Order Created','Confirmed','Picked Up','In Transit',
    'Arrived at Facility','Out for Delivery','Delivered','Exception'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type shipping_method as enum ('Standard','Express','Premium','International');
exception when duplicate_object then null; end $$;

do $$ begin
  create type package_type as enum ('Box','Envelope','Pallet','Crate','Tube');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('Active','Suspended','Pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'shipment_created','package_picked_up','shipment_in_transit',
    'shipment_arrived_facility','shipment_out_for_delivery',
    'shipment_delivered','delivery_exception','shipment_confirmed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type activity_type as enum (
    'admin_logged_in','admin_profile_updated','admin_password_changed',
    'customer_registered','shipment_created','shipment_status_changed',
    'tracking_event_added','shipment_delivered','customer_updated'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_state as enum ('completed','current','upcoming');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('customer','admin');
exception when duplicate_object then null; end $$;
