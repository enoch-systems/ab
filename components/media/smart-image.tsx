"use client"

import Image, { type ImageProps } from "next/image"
import { useCallback, useState } from "react"
import {
  getBlurImageUrl,
  getOptimizedImageUrl,
  type CloudinaryQuality,
} from "@/lib/cloudinary/image-utils"
import { cn } from "@/lib/utils"

/**
 * `next/image` wrapper that removes the two biggest sources of "slow images":
 *
 * 1. **Bytes** — every Cloudinary URL gets `w_<width>,f_auto,q_auto:eco` applied
 *    *before* the request leaves the browser, so the CDN returns an AVIF/WebP at
 *    the exact display size instead of a multi-MB original that Next then has to
 *    re-encode.
 * 2. **Emptiness** — a ~300 byte blurred Cloudinary thumbnail paints instantly
 *    behind the image, so grids never flash grey skeletons and nothing shifts
 *    while the real image decodes (this replaces the `animate-pulse` skeleton
 *    pattern used across the shop).
 *
 * `aboveTheFold` maps to Next 16's `preload` prop — the replacement for the now
 * deprecated `priority` prop — so the LCP image is fetched at high priority.
 */
export type SmartImageProps = Omit<
  ImageProps,
  "src" | "alt" | "preload" | "priority" | "placeholder" | "blurDataURL" | "loading"
> & {
  src: string
  alt: string
  /** Above-the-fold / LCP image: preloaded and fetched eagerly. */
  aboveTheFold?: boolean
  /** Cloudinary-side width cap applied before next/image resizes. */
  cloudinaryWidth?: number
  /** Cloudinary quality mode. Defaults to `auto:eco`. */
  cloudinaryQuality?: CloudinaryQuality
  /** Set to `false` for tiny icons where the extra layer is not worth it. */
  blurLayer?: boolean
  /** Extra classes for the blurred back-drop layer. */
  blurClassName?: string
}

export function SmartImage({
  src,
  alt,
  aboveTheFold = false,
  cloudinaryWidth,
  cloudinaryQuality = "auto:eco",
  blurLayer = true,
  blurClassName,
  className,
  sizes,
  onLoad,
  onError,
  ...rest
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const optimizedSrc = getOptimizedImageUrl(src, cloudinaryWidth, {
    quality: cloudinaryQuality,
  })
  // Static placeholders are already a few hundred bytes — no extra layer needed.
  const blurSrc = blurLayer && src.includes("res.cloudinary.com") ? getBlurImageUrl(src) : undefined

  const handleLoad = useCallback<NonNullable<ImageProps["onLoad"]>>(
    (event) => {
      setLoaded(true)
      onLoad?.(event)
    },
    [onLoad],
  )

  const handleError = useCallback<NonNullable<ImageProps["onError"]>>(
    (event) => {
      setFailed(true)
      onError?.(event)
    },
    [onError],
  )

  return (
    <>
      {blurSrc && (
        /*
         * Plain <img> on purpose: it must not wait for React hydration or for
         * next/image's own state machine, and it must never block the real
         * request (`fetchPriority="low"`).
         */
        <img
          src={blurSrc}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="low"
          className={cn(
            "pointer-events-none absolute inset-0 h-full w-full scale-110 select-none object-cover",
            "transition-opacity duration-500 ease-out",
            loaded || failed ? "opacity-0" : "opacity-100",
            blurClassName,
          )}
        />
      )}
      <Image
        {...rest}
        src={optimizedSrc}
        alt={alt}
        sizes={sizes}
        className={className}
        loading={aboveTheFold ? "eager" : "lazy"}
        fetchPriority={aboveTheFold ? "high" : "auto"}
        preload={aboveTheFold || undefined}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  )
}
