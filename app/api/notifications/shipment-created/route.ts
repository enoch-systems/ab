import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

type RequestBody = {
  to?: string;
  customerName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shipmentId?: string;
};

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: 'Email service is not configured.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });

  const body = (await request.json()) as RequestBody;
  const to = body.to?.trim().toLowerCase();
  const trackingNumber = body.trackingNumber?.trim().toUpperCase();
  const trackingUrl = body.trackingUrl?.trim();
  if (!to || !trackingNumber || !trackingUrl) {
    return NextResponse.json({ error: 'Missing email shipment details.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'ArcBest <onboarding@resend.dev>';
  if (!apiKey) {
    return NextResponse.json({ skipped: true, reason: 'Resend is not configured.' });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Your ArcBest shipment ${trackingNumber} is ready`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f1b2d"><h1>Shipment created</h1><p>Hi ${escapeHtml(body.customerName || 'there')},</p><p>Your shipment <strong>${escapeHtml(trackingNumber)}</strong> has been created and is ready to track.</p><p><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#0b5fff;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Track shipment</a></p><p style="color:#5a6982;font-size:13px">You can also find this shipment and contact support from your ArcBest account.</p></div>`,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: await response.text() }, { status: response.status });
  }
  return NextResponse.json(await response.json());
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character);
}
