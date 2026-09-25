"use client"

import { useEffect, useRef, type ReactNode } from "react"
import Lenis from "lenis"

/**
 * Global smooth scrolling, tuned to keep sixty frames with a *playing hero
 * video* on the same page.
 *
 * Changes vs. the previous implementation:
 *   - `lerp` instead of `duration` + a heavy easing curve. Duration/easing makes
 *     the page visibly "catch up" to the wheel for ~1.2s, which reads as lag. A
 *     lerp of 0.12 tracks the input 1:1 in feel while still smoothing, and it is
 *     frame-rate independent (no slow-motion feel on 120Hz screens).
 *   - Skipped entirely on touch devices (`hover: none` + `pointer: coarse`).
 *     Phones already have hardware-accelerated native inertia; removing Lenis
 *     there takes its RAF loop off the main thread, which is where the lag was
 *     worst.
 *   - Honors `prefers-reduced-motion` (and never overrides the OS setting).
 *   - Wires up in-page anchors (`/#how-it-works`) with a sticky-header offset so
 *     they glide instead of jumping.
 *   - Anything that must scroll natively (drawers, modals, horizontal carousels,
 *     tables) can opt out with the `data-lenis-prevent` attribute.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches
    if (prefersReducedMotion || isTouchDevice) return

    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      // Touch scrolling stays native by design (`syncTouch` deliberately off).
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      anchors: { offset: -72 }, // clear the sticky header on anchor jumps
      autoRaf: false, // a single RAF loop, owned here and cancelled on unmount
      prevent: (node) => node.hasAttribute("data-lenis-prevent"),
    })

    lenisRef.current = lenis

    let frameId = requestAnimationFrame(function raf(time: number) {
      lenis.raf(time)
      frameId = requestAnimationFrame(raf)
    })

    return () => {
      cancelAnimationFrame(frameId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return <>{children}</>
}
