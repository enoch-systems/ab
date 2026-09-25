/**
 * Cloudinary upload utilities
 */

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv"]

export function isVideoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  // Cloudinary video URLs contain /video/ in the path
  if (lower.includes("/video/upload/")) return true
  // Check if it's a video file extension (could be just a filename)
  if (VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true
  // Also check if extension is in the URL
  return VIDEO_EXTENSIONS.some((ext) => lower.includes(ext))
}

/**
 * Given a Cloudinary video URL, returns a static poster frame URL.
 *
 * IMPORTANT: Cloudinary generates video poster frames using the
 * /video/upload/ endpoint with image-format transforms — NOT by
 * changing to /image/upload/. Using /image/upload/ results in a
 * 404 because Cloudinary treats it as a separate image asset.
 *
 * The correct approach keeps /video/upload/ but adds:
 *   - so_1.0  → capture frame at 1 second (first meaningful frame)
 *   - w_XXX   → desired width
 *   - f_jpg   → force JPEG output for reliable browser display
 *
 * This function:
 *   1. Strips ALL existing transform segments from the URL (comma-
 *      separated entries before the public ID / version number)
 *   2. Applies only frame-capture transforms: so_1.0,w_XXX,f_jpg
 *   3. Keeps /video/upload/ (NOT /image/upload/)
 */
export function getVideoPosterUrl(videoUrl: string, width: number = 600): string {
  const lower = videoUrl.toLowerCase()
  const marker = "/video/upload/"
  const idx = lower.indexOf(marker)
  if (idx === -1) return videoUrl

  // Everything before /video/upload/
  const base = videoUrl.slice(0, idx)

  // Everything after /video/upload/ — may contain stale transforms
  const afterUpload = videoUrl.slice(idx + marker.length)

  // Strip ALL transform segments (contain commas) AND empty segments
  // (from double slashes like //v1234567). Public ID starts at first
  // non-empty, non-comma segment (usually v1234567 or folder name).
  const segments = afterUpload.split('/')
  let publicIdStart = 0
  for (let i = 0; i < segments.length; i++) {
    if (segments[i] !== '' && !segments[i].includes(',')) {
      publicIdStart = i
      break
    }
  }

  const cleanPath = segments.slice(publicIdStart).join('/')

  // Build poster URL: keep /video/upload/, add so_1.0 + width + f_jpg
  // f_jpg is used instead of f_auto because f_auto on video endpoints
  // may return WebP which some <video>/browser contexts don't handle.
  return `${base}/video/upload/so_1.0,w_${width},f_jpg/${cleanPath}`
}

/**
 * Applies bandwidth-saving transformations to a video URL.
 * - w_720: limit to 720p width
 * - q_40: aggressive quality compression
 * - sp_le: low-efficiency streaming profile (smaller files)
 * - f_auto: automatic format selection
 */
export function getOptimizedVideoUrl(videoUrl: string, width: number = 720, quality: number = 40): string {
  // If no URL or already has our transforms, return as-is to avoid double-transformation
  if (!videoUrl) return videoUrl
  
  // If URL doesn't contain /upload/, it's not a Cloudinary URL
  // Return it as-is (it might be a relative path or incomplete URL)
  const uploadMarker = "/upload/"
  const markerIndex = videoUrl.indexOf(uploadMarker)
  if (markerIndex === -1) return videoUrl
  
  const insertAt = markerIndex + uploadMarker.length
  const afterUpload = videoUrl.slice(insertAt)
  
  // Check if transforms already exist between /upload/ and the next segment
  // Transforms are comma-separated and end at the first slash
  const transformMatch = afterUpload.match(/^([^/]+)/)
  const existingTransforms = transformMatch && transformMatch[1].includes(',')
  
  const transforms = [`w_${width}`, `q_${quality}`, "sp_le", "f_auto"]
  
  if (existingTransforms) {
    // Replace existing transforms with ours
    const transformStr = transforms.join(",")
    const existingEnd = transformMatch[1].length
    const remaining = afterUpload.slice(existingEnd)
    // Ensure we don't create double slashes
    const cleanRemaining = remaining.startsWith('/') ? remaining : '/' + remaining
    return videoUrl.slice(0, insertAt) + transformStr + cleanRemaining
  }
  
  // Insert fresh transforms - ensure no double slashes
  const transformStr = transforms.join(",")
  const remaining = afterUpload
  const cleanRemaining = remaining.startsWith('/') ? remaining.slice(1) : remaining
  return videoUrl.slice(0, insertAt) + transformStr + "/" + cleanRemaining
}

/**
 * Get Cloudinary cloud name from environment or URL
 */
function getCloudinaryCloudName(): string | null {
  // Try environment variable first
  const envCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (envCloudName) return envCloudName
  
  // Common fallback - check if there's a default cloud name pattern
  // This helps during development when env vars might not be set
  return null
}

/**
 * Construct a full Cloudinary URL from a public ID or filename
 * Handles cases where only the filename/public ID is stored
 */
export function getFullCloudinaryVideoUrl(publicId: string): string {
  const cloudName = getCloudinaryCloudName()
  
  // If it's already a full URL, return as-is
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId
  }
  
  // If no cloud name configured, return as-is (will likely fail but at least we tried)
  if (!cloudName) {
    console.warn('Cloudinary cloud name not configured. Video URL:', publicId)
    return publicId
  }
  
  // Construct full Cloudinary URL
  // Remove any leading slashes or folder prefixes that might be in the public ID
  const cleanPublicId = publicId.replace(/^\/+/, '')
  
  return `https://res.cloudinary.com/${cloudName}/video/upload/${cleanPublicId}`
}

/**
 * Detect the user's connection quality for adaptive video delivery.
 * Returns a rating based on the Network Information API.
 *
 * - 'slow': 2G or slow 3G — use lowest quality, or skip video
 * - 'medium': 3G or 4G with moderate speed
 * - 'fast': 4G / WiFi — use highest quality
 * - 'unknown': API not available — assume medium
 */
export function getConnectionQuality(): 'slow' | 'medium' | 'fast' | 'unknown' {
  if (typeof navigator === 'undefined' || !(navigator as any).connection) {
    return 'unknown'
  }

  const conn = (navigator as any).connection

  // Use effectiveType if available (Chrome, Edge, Samsung Internet)
  if (conn.effectiveType) {
    switch (conn.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'slow'
      case '3g':
        return 'medium'
      case '4g':
        return 'fast'
    }
  }

  // Fallback: use downlink speed in Mbps
  if (conn.downlink !== undefined) {
    if (conn.downlink < 0.5) return 'slow'      // < 500 Kbps
    if (conn.downlink < 2) return 'medium'        // 500 Kbps - 2 Mbps
    return 'fast'                                  // > 2 Mbps
  }

  return 'unknown'
}

/**
 * Check if the user has requested reduced data usage.
 * Respects the Save-Data header (Chrome, Android browsers).
 */
export function isDataSaverMode(): boolean {
  if (typeof navigator === 'undefined' || !(navigator as any).connection) {
    return false
  }
  return (navigator as any).connection.saveData === true
}

/**
 * Get a Cloudinary video URL optimized for HLS adaptive streaming.
 *
 * Uses the `sp_hls` (streaming profile HLS) transformation to generate
 * a master .m3u8 playlist with multiple quality levels (360p, 480p, 720p).
 * hls.js on the client will automatically select the best quality based
 * on real-time bandwidth.
 *
 * @param videoUrl    The base Cloudinary video URL
 * @param maxWidth    Maximum video width (default: 720). Lower = less data.
 * @returns          HLS streaming URL (.m3u8)
 */
export function getHlsVideoUrl(videoUrl: string, maxWidth: number = 720): string {
  if (!videoUrl) return videoUrl

  try {
    let url = videoUrl

    // If it's just a filename or public ID, construct full Cloudinary URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const fullUrl = getFullCloudinaryVideoUrl(url)
      if (fullUrl !== url) {
        url = fullUrl
      }
    }

    // Only transform Cloudinary URLs
    if (!url.includes('/upload/')) return url

    const uploadMarker = '/upload/'
    const markerIndex = url.indexOf(uploadMarker)
    if (markerIndex === -1) return url

    const insertAt = markerIndex + uploadMarker.length
    const afterUpload = url.slice(insertAt)

    // Strip ANY existing transform segment (contains a comma) before the public ID
    const segments = afterUpload.split('/')
    let publicIdStart = 0
    if (segments[0] && segments[0].includes(',')) {
      publicIdStart = segments[0].length + 1
    }

    const baseUrl = url.slice(0, insertAt)
    const cleanPath = afterUpload.slice(publicIdStart)

    // Use HLS streaming profile for adaptive bitrate:
    //   sp_hls  → HLS streaming profile (generates .m3u8 with multiple qualities)
    //   w_720   → max width cap
    //   q_auto  → auto quality
    //   f_auto  → auto format
    const transforms = [`w_${maxWidth}`, "q_auto", "sp_hls", "f_auto"]
    const transformStr = transforms.join(",")

    return baseUrl + transformStr + "/" + cleanPath
  } catch (error) {
    console.error('Failed to generate HLS URL:', error)
    return videoUrl
  }
}

/**
 * Get a safe video URL that won't break if transformations fail.
 * Returns the original URL if optimization fails.
 *
 * For HLS delivery, use getHlsVideoUrl() instead.
 * This function returns a fallback MP4 URL.
 */
export function getSafeVideoUrl(videoUrl: string): string {
  try {
    let url = videoUrl
    
    // If it's just a filename or public ID, construct full Cloudinary URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const fullUrl = getFullCloudinaryVideoUrl(url)
      if (fullUrl !== url) {
        url = fullUrl
      }
    }
    
    // If it's a Cloudinary URL, optimize it and force MP4 format
    if (url.includes('/upload/')) {
      const uploadMarker = '/upload/'
      const markerIndex = url.indexOf(uploadMarker)
      if (markerIndex !== -1) {
        const insertAt = markerIndex + uploadMarker.length
        const afterUpload = url.slice(insertAt)
        
        // Strip ANY existing transform segment (contains a comma) before the public ID
        const segments = afterUpload.split('/')
        let publicIdStart = 0
        if (segments[0] && segments[0].includes(',')) {
          publicIdStart = segments[0].length + 1
        }
        
        const baseUrl = url.slice(0, insertAt)
        const cleanPath = afterUpload.slice(publicIdStart)
        
        // Apply clean transforms: w_720 (reasonable width), q_auto (auto quality), f_mp4 (force MP4)
        const transforms = ["w_720", "q_auto", "f_mp4"]
        const transformStr = transforms.join(",")
        
        url = baseUrl + transformStr + "/" + cleanPath
      }
      
      return url
    }
    
    return url
  } catch (error) {
    console.error('Failed to optimize video URL:', error)
    return videoUrl
  }
}

/*
 * NOTE: the `uploadToCloudinary()`, `uploadVideoViaServer()` and
 * `uploadViaServer()` helpers lived here and posted to the `/api/upload/video`
 * route. That route and its only consumers (the admin product media editor)
 * were removed with the storefront, so all three are gone. There are no upload
 * paths left in this app — media is delivered from Cloudinary, not created here.
 */

/**
 * Insert Cloudinary transformation parameters into a URL.
 * Supports f_auto, q_auto, width, and any other valid Cloudinary transforms.
 * 
 * @param url - The base Cloudinary URL (from upload)
 * @param transforms - One or more transformation strings, e.g. "w_800", "f_auto,q_auto"
 * @returns The URL with transformations inserted after /upload/
 */
export function transformImageUrl(url: string, ...transforms: string[]): string {
  const uploadMarker = '/upload/'
  const markerIndex = url.indexOf(uploadMarker)
  if (markerIndex === -1) return url

  const transformStr = transforms.join(',')
  const insertAt = markerIndex + uploadMarker.length
  return `${url.slice(0, insertAt)}${transformStr}/${url.slice(insertAt)}`
}

export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary configuration')
  }

  // Extract public ID from URL
  // URL format: https://res.cloudinary.com/{cloud}/image/upload/[transformations/]v{version}/{folder}/{filename}
  const publicId = extractPublicIdFromUrl(imageUrl)

  if (!publicId) {
    throw new Error('Invalid Cloudinary URL')
  }

  // Note: In production, you should use a backend API route for deletion
  // to avoid exposing your API secret. This is a simplified version.
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_id: publicId,
        api_key: apiKey,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to delete image')
  }
}

export function extractPublicIdFromUrl(url: string): string {
  const urlParts = url.split('/')
  const uploadIndex = urlParts.indexOf('upload')

  if (uploadIndex === -1) {
    return ''
  }

  // Everything after 'upload/' may include a transformation segment
  // (e.g. f_auto,q_auto) before the version/folder/filename. Transformation
  // segments always contain a comma, so skip that segment if present — the
  // public ID starts at the version segment (v1234567) or the folder path
  // if there's no version.
  let rest = urlParts.slice(uploadIndex + 1)
  if (rest[0] && rest[0].includes(',')) {
    rest = rest.slice(1)
  }

  return rest.join('/').split('.')[0]
}

export interface StreamingVideoOptions {
  /**
   * Seconds to keep from the start of the clip. Looping card backgrounds only
   * need a short taste — trimming the delivery (not the stored asset) slashes
   * the payload so playback feels instant.
   */
  duration?: number
  /** Delivery format. `webm` (VP9/Opus) is usually ~30% smaller than MP4. */
  format?: 'mp4' | 'webm'
}

/**
 * Build a progressive delivery URL for a Cloudinary video that is as small
 * as Cloudinary can make it without visible artefacts.
 *
 * Transforms applied:
 *   - w_<width>, c_limit → never upscale, never exceed the layout width
 *   - q_auto:eco         → perceptual quality target; typically 50-70% smaller
 *                          than a fixed quality value (e.g. q_80)
 *   - f_mp4 / f_webm     → explicit format so no on-the-fly negotiation stalls
 *                          first paint (WebM/VP9 usually ~30% smaller)
 *   - ac_none            → strip the (muted, inaudible) audio track entirely
 *   - du_<seconds>       → keep only the first N seconds for looping cards
 *
 * Uploads are often multi-MB phone/chat exports; streaming them through this
 * URL instead of the raw upload is the single biggest bandwidth win for
 * background/looping video. Non-Cloudinary URLs are returned unchanged.
 */
export function getStreamingVideoUrl(videoUrl: string, width: number = 1280, options: StreamingVideoOptions = {}): string {
  if (!videoUrl) return videoUrl

  // Not a Cloudinary URL (relative path, blob:, another CDN) — leave untouched.
  const marker = '/upload/'
  const markerIndex = videoUrl.indexOf(marker)
  if (markerIndex === -1) return videoUrl

  const insertAt = markerIndex + marker.length
  const afterUpload = videoUrl.slice(insertAt)

  // Drop every pre-existing transform segment (they always contain a comma) so
  // our own width/quality is applied exactly once.
  const segments = afterUpload.split('/')
  let publicIdStart = 0
  while (publicIdStart < segments.length && segments[publicIdStart].includes(',')) {
    publicIdStart++
  }
  const cleanPath = segments.slice(publicIdStart).join('/')

  // Strip the (muted, inaudible) audio track and trim to just the looping
  // taste we need. `du_` only rewrites the derived file — the stored upload
  // is untouched. `ac_none` before the format flag keeps the encode audio-less.
  const { duration = 0, format = 'mp4' } = options
  const trims = [
    'ac_none',
    ...(Number.isFinite(duration) && duration > 0 ? [`du_${duration}`] : []),
  ]
  const delivery = `w_${width},c_limit,q_auto:eco,${trims.join(',')},f_${format}`
  return `${videoUrl.slice(0, insertAt)}${delivery}/${cleanPath}`
}
