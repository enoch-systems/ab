import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { shipmentToModel } from '@/lib/supabase/mappers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trackingNumber: string }> },
) {
  const { trackingNumber } = await params;
  const normalized = decodeURIComponent(trackingNumber).trim().toUpperCase();
  if (!normalized || normalized.length > 40 || !/^[A-Z0-9-]+$/.test(normalized)) {
    return NextResponse.json({ error: 'Invalid tracking number.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Tracking is not configured.' }, { status: 503 });

  const { data, error } = await supabase
    .from('shipments')
    .select('*, tracking_events(*), shipment_images(*)')
    .eq('tracking_number', normalized)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 });

  const model = shipmentToModel(data, data.tracking_events ?? [], data.shipment_images ?? []);
  const publicShipment = {
    ...model,
    customerId: '',
    instructions: undefined,
    cost: 0,
    sender: { name: '', phone: '', email: '', address: '', city: model.origin.split(',')[0]?.trim() || '', state: '', country: '' },
    recipient: { name: '', phone: '', email: '', address: '', city: model.destination.split(',')[0]?.trim() || '', state: '', country: '' },
  };
  return NextResponse.json({ shipment: publicShipment }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
