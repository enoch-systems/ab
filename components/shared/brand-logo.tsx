export const BRAND_LOGO_URL = "https://res.cloudinary.com/qz5m8bhg/image/upload/v1789515575/logoo_uycwcr.png"

/**
 * Display variant of the logo: ~40px is the largest size it renders at, so
 * w_128 covers 2x+ retina, f_auto serves WebP/AVIF where supported and q_auto
 * keeps it at a few KB. Squared logo, so width and height are equal.
 */
const LOGO_DISPLAY_URL = BRAND_LOGO_URL.replace("/upload/", "/upload/w_128,f_auto,q_auto/")
export const LOGO_SIZE = 128

export function BrandLogo({ className = "", alt = "ArcBest" }: { className?: string; alt?: string }) {
  return (
    <img
      src={LOGO_DISPLAY_URL}
      alt={alt}
      width={LOGO_SIZE}
      height={LOGO_SIZE}
      className={className}
      loading="eager"
      fetchPriority="high"
      decoding="async"
      draggable={false}
    />
  )
}
