-- Allow guest / quick bookings where customer_id is assigned later or shipment is created by staff
alter table public.shipments alter column customer_id drop not null;
