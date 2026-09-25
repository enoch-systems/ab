"use client"

import { useEffect } from "react"

/**
 * Registers the media/offline service worker at `/sw.js`.
 *
 * Registration is deferred to an idle callback so it never competes with the
 * first paint or the LCP image, and it is skipped in development so hot reload
 * is never served from a stale cache.
 */
export function ServiceWorkerProvider() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* Best-effort: the site works exactly the same without it. */
      })
    }

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
    }

    if (typeof idleWindow.requestIdleCallback === "function") {
      idleWindow.requestIdleCallback(register, { timeout: 4000 })
      return
    }

    const timer = setTimeout(register, 2000)
    return () => clearTimeout(timer)
  }, [])

  return null
}