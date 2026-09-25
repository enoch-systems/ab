import * as React from 'react'

/**
 * Ticking epoch-millisecond clock for "live" surfaces (relative timestamps,
 * countdowns, freshness badges).
 *
 * Returns `null` until the component has mounted, so the server render and the
 * first client render produce identical markup and only the follow-up render
 * swaps in real times. Callers must therefore render a deterministic fallback
 * (e.g. an absolute timestamp) while `now` is `null`.
 */
export function useLiveNow(intervalMs = 30_000): number | null {
  const [now, setNow] = React.useState<number | null>(null)

  React.useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
