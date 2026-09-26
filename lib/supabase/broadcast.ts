'use client'

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Client-side half of the instant-tracking contract.
 *
 * The database trigger in supabase/migrations/20250926000026_realtime_broadcast.sql
 * is the primary path: it fires for *every* writer, including manual edits in
 * the Supabase dashboard table editor, which no client code can observe.
 *
 * This helper is the belt-and-braces path. When this app itself performs a
 * write it announces the change immediately, so a public /track page updates in
 * well under a second even if the trigger has not been applied to the project
 * yet. Both paths are safe to run together: the receiving page debounces and
 * re-reads, so a duplicate signal costs one extra request and nothing else.
 *
 * Like the trigger, the payload carries only the tracking number and which table
 * changed — never row data. Anonymous listeners on this topic therefore learn
 * nothing they could not already read from the public URL.
 */

const CHANNEL_PREFIX = 'shipment:'
const EVENT = 'shipment_changed'

// Channels must be subscribed before they can send, and subscribing per write
// would be wasteful, so keep one live channel per tracking number.
const channels = new Map<string, ReturnType<SupabaseClient['channel']>>();

/** Announce that `trackingNumber` changed. No-op when Supabase is not configured. */
export async function broadcastShipmentChange(
  client: SupabaseClient | null,
  trackingNumber: string,
  source: string
): Promise<void> {
  if (!client) return;
  const key = (trackingNumber || '').trim().toUpperCase();
  if (!key) return;

  let channel = channels.get(key);
  if (!channel) {
    channel = client.channel(CHANNEL_PREFIX + key);
    channels.set(key, channel);
    channel.subscribe();
  }

  try {
    await channel.send({
      type: 'broadcast',
      event: EVENT,
      payload: { tracking_number: key, source, op: 'update' },
    });
  } catch {
    // Realtime is an optimisation, never a requirement: the tracking page
    // still refreshes on its backstop poll if this cannot be delivered.
  }
}

/** Drop cached channels (used on sign-out so a new session starts clean). */
export function resetShipmentBroadcastChannels(client: SupabaseClient | null): void {
  if (!client) return;
  for (const channel of channels.values()) {
    void client.removeChannel(channel);
  }
  channels.clear();
}
