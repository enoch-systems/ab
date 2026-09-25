import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@/components/ui/sonner'
import { ServiceWorkerProvider } from '@/components/providers/service-worker-provider'
import { LenisProvider } from '@/components/providers/lenis-provider'
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/components/providers/theme-provider'
import { AppStateProvider } from '@/lib/app-state'
import { BRAND_LOGO_URL } from '@/components/shared/brand-logo'
import './globals.css'

export const metadata: Metadata = {
  title: 'ArcBest — Logistics & Shipment Tracking',
  description: 'Professional logistics platform for domestic and international shipping. Track shipments in real-time, create new deliveries, and manage your entire logistics operation.',
  generator: 'v0.app',
  keywords: ['logistics', 'shipping', 'delivery', 'cargo', 'courier', 'freight', 'tracking', 'shipment', 'supply chain', 'US logistics'],
  icons: {
    icon: BRAND_LOGO_URL,
    apple: BRAND_LOGO_URL,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F8FB' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1120' },
  ],
  width: 'device-width',
  initialScale: 1,
  /* maximumScale: 1 stops iOS Safari auto-zooming when an input is focused
     (an "app-like" feel). iOS ignores this for pinch-zoom (accessibility is
     preserved); the <16px font-size fallback in globals.css covers the rest. */
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Warm the Cloudinary edge connection before the first image is
            requested — saves a DNS + TLS round-trip on the LCP image. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preload" as="image" href="https://res.cloudinary.com/qz5m8bhg/image/upload/w_128,f_auto,q_auto/v1789515575/logoo_uycwcr.png" fetchPriority="high" />
        {/* Paint the How-it-works poster frames during browser idle — first-byte
            cost is a few KB each, and the full looping clips reuse this same
            warm connection when `SmartVideo` fetches them after page load. */}
        <link rel="preload" as="image" href="https://res.cloudinary.com/qz5m8bhg/video/upload/so_1.0,w_480,f_jpg/v1789590320/a_3_zfkgen.jpg" fetchPriority="low" />
        <link rel="preload" as="image" href="https://res.cloudinary.com/qz5m8bhg/video/upload/so_1.0,w_480,f_jpg/v1789590321/a_2_tvy7qo.jpg" fetchPriority="low" />
        {/* Applies the persisted theme before first paint, so dark-mode users
            never get a flash of the light theme.

            Inline scripts are the one thing that cannot be deferred to an
            effect: by the time any `useEffect` runs, the browser has already
            painted the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      {/* Horizontal panning is clipped on `html`/`body` in globals.css, so no
          per-element overflow guard is needed here (and `overflow-x-hidden`
          would turn `body` into a scrollport, breaking `sticky` children). */}
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AppStateProvider>
            <LenisProvider>
              {children}
            </LenisProvider>
          </AppStateProvider>
          {/* Inside the provider so toasts pick up the active theme. */}
          <Toaster />
        </ThemeProvider>
        <Analytics />
        {/* Real-user Core Web Vitals (LCP / INP / CLS) so regressions are visible
            instead of guessed at. */}
        <SpeedInsights />
        {/* Caches images/video in the browser cache API for repeat visits. */}
        <ServiceWorkerProvider />
      </body>
    </html>
  )
}
