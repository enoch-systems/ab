/**
 * Video utility functions.
 *
 * NOTE: Video conversion is now handled server-side via the
 * /api/upload/video endpoint, which uploads directly to Cloudinary.
 * Cloudinary automatically converts videos to MP4/H.264 format.
 *
 * This file is kept for client-side helpers only.
 */

/**
 * Check if a file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

/**
 * Get video file extension
 */
export function getVideoExtension(file: File): string {
  const name = file.name.toLowerCase()
  const ext = name.split('.').pop() || ''
  return ext
}
