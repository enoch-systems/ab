'use client'

import * as React from 'react'
import { getSupabaseBrowser } from '@/lib/supabase/client'

export type LiveStatus = 'connecting' | 'live' | 'polling' | 'offline'

interface Options {
  /** Identifies the shipment being watched; the topic is derived from it. */
  trackingNumber: string | null | undefined
  /** Called when the server says this shipment changed. Re-fetch here. */
  onInvalidate: () => void
  /**
   * Safety net for when the socket is unavailable or the trigger has not been
   * installed yet. Deliberately long: the broadcast is the fast path, this
   * only guarantees eventual consistency.
   */
  pollMs?: number
}

const REFRESH_DEBOUNCE_MS = 150

/**
 * Keeps a tracking surface in sync with the database in (near) real time, on
 * any device, whether the viewer is signed in or anonymous.
 *
 * How it works
 *   The database broadcasts a content-free `shipment_changed` signal on
 *   `shipment:<TRACKING_NUMBER>` (see migration 20250926000026). This hook
 *   listens on exactly that topic and calls `onInvalidate` — nothing more.
 *   The caller then re-reads through whichever route it already trusts
 *   (`/api/track` for anonymous visitors, the RLS-scoped snapshot for signed-in
 *   ones). Because no row data travels over the socket, a spoofed message can
 *   at worst cause one extra request; it can never inject a fake status.
 *
 *   `realtime.send` is a plain public channel rather than a private one on
 *   purpose: private channels would require RLS on `realtime.messages` and
 *   would exclude the anonymous public tracking page.
 *
 * Robustness
 *   • Debounced, so a status change that touches several rows (shipment +
 *     several tracking_events) collapses into a single re-fetch.
 *   • A slow `pollMs` poll always runs as a backstop, and an immediate one on
 *     tab focus / window online, so a dropped socket can never leave the page
 *     stale for more than one poll interval.
 *   • Supabase Realtime reconnects on its own; on every resubscribe we re-fetch
 *     so anything missed while offline is picked up.
 */
export function useLiveTracking({ trackingNumber, onInvalidate, pollMs = 30_000 }: Options) {
  const [status, setStatus] = React.useState<LiveStatus>('connecting')
  const [lastEventAt, setLastEventAt] = React.useState<number | null>(null)

  // Keep the latest callback without re-subscribing on every render.
  const invalidateRef = React.useRef(onInvalidate)
  React.useEffect(() => {
    invalidateRef.current = onInvalidate
  }, [onInvalidate])

  const tracking = trackingNumber?.trim().toUpperCase() ?? ''

  React.useEffect(() => {
    if (!tracking) {
      setStatus('connecting')
      return
    }

    const client = getSupabaseBrowser()
    if (!client) {
      // No Supabase env — the caller falls back to its own loading behaviour.
      setStatus('offline')
      return
    }

    let cancelled = false
    let timer: number | null = null

    const invalidate = () => {
      if (cancelled) return
      if (timer !== null) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = null
        invalidateRef.current()
        setLastEventAt(Date.now())
      }, REFRESH_DEBOUNCE_MS)
    }

    const channel = client
      .channel(`shipment:${tracking}`)
      .on('broadcast', { event: 'shipment_changed' }, invalidate)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments', filter: `tracking_number=eq.${tracking}` },
        invalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tracking_events' },
        invalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipment_images' },
        invalidate
      )
      .subscribe((state) => {
        if (cancelled) return
        if (state === 'SUBSCRIBED') {
          setStatus('live')
          // Catch up on anything that changed while we were disconnected.
          invalidate()
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
          setStatus('polling')
        }
      })

    // Backstop poll + immediate catch-up on returning to the tab or regaining
    // network, which is when a stale page is most visible to the user.
    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') invalidate()
    }, pollMs)
    const onWake = () => {
      if (document.visibilityState === 'visible') invalidate()
    }
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('online', onWake)
    window.addEventListener('focus', onWake)

    return () => {
      cancelled = true
      if (timer !== null) window.clearTimeout(timer)
      window.clearInterval(pollId)
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('online', onWake)
      window.removeEventListener('focus', onWake)
      void client.removeChannel(channel)
    }
  }, [tracking, pollMs])

  return { status, lastEventAt }
}
