/**
 * Cloudinary image/video optimization utilities.
 *
 * Applies `f_auto,q_auto,w_XXX` transforms to any Cloudinary URL so that
 * images are served in the best format (WebP/AVIF) at the correct resolution.
 * For video URLs, returns the poster frame instead (static image from video).
 * Non-Cloudinary URLs are returned unchanged.
 */

import { isVideoUrl, getVideoPosterUrl } from "./index"

const CLOUDINARY_BASE = "res.cloudinary.com"

/**
 * Returns an optimized Cloudinary URL with format auto-detection, quality
 * auto-detection, and an optional width constraint.
 *
 * @param url   The raw image URL (may already contain Cloudinary transforms)
 * @param width Desired maximum width in pixels (e.g. 400, 800, 1200).
 *              Omit to apply only f_auto + q_auto without resizing.
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  options: OptimizeImageOptions = {},
): string {
  if (!url || url.startsWith("/")) return url // local/placeholder, skip
  if (!url.includes(CLOUDINARY_BASE)) return url

  const uploadMarker = "/upload/"
  const markerIndex = url.indexOf(uploadMarker)
  if (markerIndex === -1) return url

  const insertAt = markerIndex + uploadMarker.length
  const afterUpload = url.slice(insertAt)
  // Drop any existing transform segments so a width/quality is never applied
  // twice (Cloudinary would otherwise chain `q_auto:eco/q_auto` and keep both).
  const cleanPath = stripLeadingTransforms(afterUpload)

  // Build the transform string
  const transforms: string[] = []

  if (width) {
    transforms.push(`w_${width}`)
  }

  // `q_auto:eco` is Cloudinary's perceptual-optimal mode: it targets the same
  // visual result at roughly 50-70% of the bytes of a fixed quality value,
  // which is what keeps grids of product photos from saturating the network.
  transforms.push(...(options.extra ?? []), "f_auto", `q_${options.quality ?? "auto:eco"}`)

  return `${url.slice(0, insertAt)}${transforms.join(",")}/${cleanPath}`
}

/**
 * Convenience presets for common image sizes in the app.
 * 
 * If the URL is a video, returns the poster frame URL instead so it works
 * safely with next/image and any image-only components.
 *
 * The video poster URL from getVideoPosterUrl() already contains:
 *   - so_1.0 (capture frame at 1 second)
 *   - w_600  (thumbnail width)
 *   - f_auto (auto format)
 *   - q_auto (auto quality)
 *
 * For thumbnails, we request a smaller width (w_150) to minimize data.
 */
export function getOptimizedProductImage(
  url: string,
  size: "thumbnail" | "card" | "detail" | "full" = "card"
): string {
  const widthMap: Record<typeof size, number> = {
    thumbnail: 150,
    card: 600,
    detail: 1200,
    full: 2000,
  }
  
  const width = widthMap[size]
  
  // If it's a video URL, return a video poster frame instead of the video itself.
  if (isVideoUrl(url)) {
    return getVideoPosterUrl(url, width)
  }
  
  return getOptimizedImageUrl(url, width, { quality: "auto:eco" })
}

/**
 * Internal helper that applies width/f_auto/q_auto to a URL that's already
 * had its resource type handled (e.g. video poster frame).
 */
function postProcessUrl(url: string, width: number): string {
  if (!url || url.startsWith("/")) return url
  if (!url.includes(CLOUDINARY_BASE)) return url

  const uploadMarker = "/upload/"
  const markerIndex = url.indexOf(uploadMarker)
  if (markerIndex === -1) return url

  const insertAt = markerIndex + uploadMarker.length
  const afterUpload = url.slice(insertAt)
  const existingTransforms = afterUpload.match(/^[^/]*,/)

  const transforms = [`w_${width}`, "f_auto", "q_auto"]
  const transformStr = transforms.join(",") + "/"

  if (existingTransforms) {
    const existingEnd = existingTransforms.index! + existingTransforms[0].length
    return url.slice(0, insertAt) + transformStr + afterUpload.slice(existingEnd)
  }

  return url.slice(0, insertAt) + transformStr + afterUpload
}

/** Cloudinary `quality` modes. `auto:eco` is the best size/quality tradeoff. */
export type CloudinaryQuality = "auto" | "auto:eco" | "auto:good" | "auto:low"

export interface OptimizeImageOptions {
  /** Cloudinary quality mode. Defaults to `auto:eco` (smallest usable file). */
  quality?: CloudinaryQuality
  /** Extra raw Cloudinary transforms appended, e.g. `["c_fill", "g_auto"]`. */
  extra?: string[]
}

/** Width of the tiny blurred back-drop requested while a full image loads. */
const BLUR_WIDTH = 32

/**
 * Removes every leading Cloudinary transform segment from a URL path.
 *
 * Transform segments always contain a comma (e.g. `w_600,f_auto,q_auto`), and
 * Cloudinary allows several chained segments before the version/public ID. A
 * greedy `[^/]*,` regex (the previous implementation) only removed up to the
 * *last* comma, which left `q_auto/` behind and produced URLs like
 * `.../w_400,f_auto,q_auto:eco/q_auto/v123/file.png` — harmless but wasteful,
 * and it hid the fact that a transform could be applied twice.
 */
export function stripLeadingTransforms(pathAfterUpload: string): string {
  const segments = pathAfterUpload.split("/")
  let index = 0
  while (index < segments.length && segments[index].includes(",")) index++
  return segments.slice(index).join("/")
}

/**
 * URL of a roughly 200-500 byte, heavily blurred version of a Cloudinary image.
 *
 * Used as a progressive back-drop instead of an animated skeleton so the layout
 * paints instantly and there is never a flash of empty/grey boxes. Cloudinary
 * generates it on the fly (`w_32,e_blur:2000,q_1`) and serves it from the same
 * CDN as the real image, so it costs less than the CSS it replaces.
 *
 * Returns `undefined` for local (`/public`) images and non-Cloudinary URLs so
 * callers can skip the extra layer entirely.
 */
export function getBlurImageUrl(url: string): string | undefined {
  if (!url || url.startsWith("/")) return undefined
  if (!url.includes(CLOUDINARY_BASE)) return undefined

  const uploadMarker = "/upload/"
  const markerIndex = url.indexOf(uploadMarker)
  if (markerIndex === -1) return undefined

  const insertAt = markerIndex + uploadMarker.length
  const cleanPath = stripLeadingTransforms(url.slice(insertAt))

  // Video endpoints ignore image-only transforms unless an image format is
  // forced, so jpg is requested for poster frames (`/video/upload/...`) and
  // f_auto (avif/webp) everywhere else.
  const format = url.includes("/video/upload/") ? "f_jpg" : "f_auto"

  return `${url.slice(0, insertAt)}w_${BLUR_WIDTH},e_blur:2000,q_1,${format}/${cleanPath}`
}
