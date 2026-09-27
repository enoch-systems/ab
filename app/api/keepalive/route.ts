import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Keep-alive heartbeat — stops the free-tier Supabase project from pausing
 * after 7 days without database activity.
 *
 * Read-only: one aggregate count is all that is needed to register as
 * database activity. Nothing about any shipment is read or returned.
 * Guarded by CRON_SECRET — Vercel Cron sends it automatically, and the
 * external scheduler sends the same value as an Authorization header.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Keep-alive is not configured.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });

  const { count, error } = await supabase.from('shipments').select('id', { count: 'exact', head: true });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json(
    {
      ok: true,
      at: new Date().toISOString(),
      source: request.headers.get('x-vercel-cron-schedule') ? 'vercel-cron' : 'external',
      shipments: count ?? 0,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
