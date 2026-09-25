"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { getStreamingVideoUrl, getVideoPosterUrl } from "@/lib/cloudinary"

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string }
}

/**
 * IntersectionObserver `rootMargin` only accepts px or % lengths — passing
 * `vh`/`vw` (e.g. `"100vh"`) throws `SyntaxError: rootMargin must be specified
 * as an absolute length or a percentage`. Accept plain numbers too (`600` →
 * `"600px"`); anything unparseable returns null so the caller falls back.
 */
function sanitizeRootMargin(value?: string): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (trimmed === "") return null
  if (/^-?\d+(\.\d+)?(px|%)$/.test(trimmed)) return trimmed
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`
  if (process.env.NODE_ENV !== "production") console.warn(`[SmartVideo] ignoring invalid viewportMargin: ${JSON.stringify(value)} (use px or %)`)
  return null
}

/**
 * Viewport-aware, connection-aware background video.
 *
 * The previous pattern (`<video autoPlay muted loop preload="auto">`) made the
 * browser download *every* video on a page immediately, decode them all at once
 * and keep decoding them off-screen — the main cause of laggy scrolling and
 * burned mobile data on the marketing pages.
 *
 * This component instead:
 *   - requests a `w_<width>,c_limit,q_auto:eco,f_mp4` Cloudinary URL (usually
 *     60-90% smaller than the raw upload),
 *   - shows a Cloudinary poster frame with **zero** video bytes until the
 *     element is near the viewport (`preload="none"`, no `src` attribute),
 *   - pauses playback the moment the element leaves the viewport or the tab is
 *     hidden, so decoding never steals frames from scrolling,
 *   - skips video entirely for `prefers-reduced-motion: reduce`, `Save-Data` and
 *     2G connections (the poster still renders),
 *   - optionally waits for `window.load` + an idle callback (`deferUntilIdle`)
 *     so a hero clip never competes with the LCP image for bandwidth.
 */
export interface SmartVideoProps {
  src: string
  /** Explicit poster frame. Defaults to a Cloudinary frame grabbed at 1s. */
  poster?: string
  /** Classes for the `<video>` element (e.g. `h-full w-full object-cover`). */
  className?: string
  style?: CSSProperties
  /** Width cap for the delivered file. Default 1280. */
  width?: number
  /** Width requested for the poster frame. Default 960. */
  posterWidth?: number
  loop?: boolean
  muted?: boolean
  /** Called when the clip ends (used to rotate hero clips). */
  onEnded?: () => void
  /** Start loading immediately instead of waiting for the viewport. */
  eager?: boolean
  /**
   * Hold the download until the page has loaded and the main thread is idle.
   * Recommended for hero video so it never competes with the LCP image.
   */
  deferUntilIdle?: boolean
  /**
   * Fetch the file right after page load + idle (low priority), so playback
   * starts instantly when scrolled into view. Playback itself still waits for
   * the viewport. Ideal for small below-the-fold loops like the How-it-works
   * cards. Respects reduced-motion / Save-Data via the same `allowed` gate.
   */
  prefetchOnIdle?: boolean
  /** IntersectionObserver root margin. Default "200px" ("0px" when `eager`). */
  viewportMargin?: string
  ariaHidden?: boolean
  /**
   * Seconds to keep from the start of the clip. Looping card backgrounds only
   * need a short taste — trimming the delivery (not the stored asset) slashes
   * the payload so playback feels instant. Default 6 for the How-it-works
   * cards; pass `0` to keep the full clip.
   */
  loopDuration?: number
}

export function SmartVideo({
  src,
  poster,
  className = "",
  style,
  width = 1280,
  posterWidth = 960,
  loop = true,
  muted = true,
  onEnded,
  eager = false,
  deferUntilIdle = false,
  prefetchOnIdle = false,
  viewportMargin,
  loopDuration = 0,
  ariaHidden = true,
}: SmartVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [allowed, setAllowed] = useState(false)
  const [visible, setVisible] = useState(false)
  const [idleReady, setIdleReady] = useState(false)
  // `prefetchOnIdle` loads the file early at low priority; track when it has
  // enough data that pressing play renders frames instead of a spinner.
  const [prefetched, setPrefetched] = useState(false)

  // WebM (VP9) first for Chrome/Firefox/Edge (~30% smaller), MP4 fallback for
  // Safari. `du_6` trims to a 6s looping taste; `ac_none` drops the muted audio
  // track. The stored uploads are untouched — these rewrite only the delivery.
  const webmSrc = getStreamingVideoUrl(src, width, { duration: loopDuration || undefined, format: 'webm' })
  const mp4Src = getStreamingVideoUrl(src, width, { duration: loopDuration || undefined, format: 'mp4' })
  const posterUrl = poster || getVideoPosterUrl(src, posterWidth)

  // Respect the user's motion and data preferences before spending a byte.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const connection = (navigator as NavigatorWithConnection).connection
    const onMeteredConnection =
      connection?.saveData === true ||
      connection?.effectiveType === "2g" ||
      connection?.effectiveType === "slow-2g"

    setAllowed(!reduceMotion && !onMeteredConnection)
  }, [])

  // Never fight the LCP: wait for window load, then for an idle frame.
  useEffect(() => {
    if (!deferUntilIdle) {
      setIdleReady(true)
      return
    }

    let cancelled = false
    const start = () => {
      if (cancelled) return
      const idleWindow = window as IdleWindow
      if (typeof idleWindow.requestIdleCallback === "function") {
        idleWindow.requestIdleCallback(() => {
          if (!cancelled) setIdleReady(true)
        }, { timeout: 2000 })
      } else {
        setTimeout(() => {
          if (!cancelled) setIdleReady(true)
        }, 0)
      }
    }

    if (document.readyState === "complete") {
      start()
      return () => {
        cancelled = true
      }
    }

    window.addEventListener("load", start, { once: true })
    return () => {
      cancelled = true
      window.removeEventListener("load", start)
    }
  }, [deferUntilIdle])

  // Only load/play while the element is on (or close to) screen.
  useEffect(() => {
    if (!allowed) return
    const element = videoRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      // `eager` clips (hero) start as soon as they intersect; everything else
      // gets a head start so the first frame is ready before it is seen.
      // How-it-works cards use a generous margin deliberately — they are the
      // "instant playback" surface, so observation starts ~1 viewport early.
      // NOTE: rootMargin only accepts px or % — never vh/vw.
      { rootMargin: sanitizeRootMargin(viewportMargin) ?? (eager ? "0px" : "600px"), threshold: 0.01 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [allowed, eager, viewportMargin])

  const shouldLoad = allowed && visible && idleReady

  // `prefetchOnIdle` splits "fetch" from "play": as soon as the page is idle
  // the file downloads at low priority (muted, playing inline in a paused
  // state still fetches the stream), so entering the viewport flips to frames
  // instantly instead of waiting on a cold HTTP request.
  useEffect(() => {
    const element = videoRef.current
    if (!element) return
    if (!(prefetchOnIdle && allowed && idleReady && !visible)) return
    element.preload = "auto"
    void element.load()
  }, [prefetchOnIdle, allowed, idleReady, visible])

  // Drive playback from visibility instead of `autoPlay` so off-screen video
  // stops decoding entirely (battery + main-thread relief while scrolling).
  useEffect(() => {
    const element = videoRef.current
    if (!element) return

    if (shouldLoad) {
      const playPromise = element.play()
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          /* Autoplay blocked or a src change interrupted it — poster stays. */
        })
      }
    } else {
      element.pause()
    }
  }, [shouldLoad, webmSrc, mp4Src])

  useEffect(() => {
    const onVisibilityChange = () => {
      const element = videoRef.current
      if (!element) return
      if (document.hidden) {
        element.pause()
      } else if (shouldLoad) {
        element.play().catch(() => {})
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [shouldLoad])

  // If the file fails (transform rejected, network error) keep the poster.
  const handleError = useCallback(() => setAllowed(false), [])

  // If the file charges ahead of decoding capacity, note that enough data is
  // buffered to play instantly when the card enters the viewport.
  const handleProgress = useCallback(() => {
    const element = videoRef.current
    if (element && element.readyState >= 3) setPrefetched(true)
  }, [])

  return (
    <video
      ref={videoRef}
      // No `src` attribute — the `<source>` children carry the delivery URLs.
      // With `preload="none"` the browser downloads nothing until the
      // `prefetchOnIdle` effect calls `.load()` (low priority, after page
      // idle) or playback starts near the viewport. Bytes fetched early are
      // kept, so the same URL never downloads twice. WebM first (~30%
      // smaller via VP9), MP4 fallback for Safari.
      poster={posterUrl}
      className={className}
      style={style}
      muted={muted}
      loop={loop}
      playsInline
      disablePictureInPicture
      preload={shouldLoad ? "metadata" : prefetchOnIdle && idleReady ? "auto" : "none"}
      aria-hidden={ariaHidden}
      tabIndex={-1}
      data-smart-video=""
      data-prefetched={prefetched || undefined}
      onEnded={onEnded}
      onError={handleError}
      onCanPlayThrough={() => setPrefetched(true)}
      onProgress={handleProgress}
    >
      <source src={webmSrc} type="video/webm" />
      <source src={mp4Src} type="video/mp4" />
    </video>
  )
}
