/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the bundler workspace to this project. Without this, Turbopack walks up
  // to a stray package-lock.json in the parent directory and warns about it.
  turbopack: {
    root: import.meta.dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Smaller network payloads + no free server fingerprint in the HTML.
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    // AVIF first (typically 30-50% smaller than WebP) with WebP fallback for
    // browsers that don't decode AVIF yet. Each format is cached separately.
    formats: ['image/avif', 'image/webp'],
    // Every media URL comes from Cloudinary and is content-addressed/immutable,
    // so generated variants can be cached for a year instead of Next 16's
    // 4 hour default. This is what makes repeat visits near-instant.
    minimumCacheTTL: 60 * 60 * 24 * 365,
    // Only allow the quality levels the app actually requests, so arbitrary
    // `?q=` values can't be used to fill/poison the optimizer cache.
    qualities: [70, 75, 85],
    // Trimmed device ladder — the stock Next ladder generates variants up to
    // 3840px that no card/detail layout ever displays, wasting bytes and
    // optimizer work on every request.
    deviceSizes: [360, 420, 640, 750, 828, 1080, 1200, 1440, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 150, 200, 256, 384, 600],
    // Bound the optimizer disk cache on self-hosted deployments.
    maximumDiskCacheSize: 1024 * 1024 * 1024, // 1 GiB
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // Increase body size limit for video uploads to the API route
  experimental: {
    serverActions: {
      bodySizeLimit: "120mb",
    },
    // lucide-react / date-fns / recharts are optimized by default in Next 16.
    // These extra barrels are the other heavy named-export packages we import,
    // which keeps per-route JS as small as possible.
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      'embla-carousel-react',
      'country-state-city',
    ],
  },
  async headers() {
    return [
      {
        // The service worker must never be cached by the browser, otherwise
        // clients stay pinned to an old offline/media cache forever.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // /public media never changes under the same filename, so browsers and
        // CDNs can keep it for a year without revalidating.
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*.(svg|png|jpg|jpeg|gif|webp|avif|ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig