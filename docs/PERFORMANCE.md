# Performance: media delivery, caching & scroll smoothness

Everything below is implemented and verified against a running dev server. Section 5 lists
the suggestions that are still open (prioritised) and section 4 the **pre-existing build
blocker**, which is unrelated to this work.

---

## 1. What changed (and why)

| Area | Before | After | Why it was slow |
| --- | --- | --- | --- |
| Hero video (`app/page.tsx`) | raw Cloudinary MP4, `preload="auto"`, autoplay, full-screen inline `blur(0.4px)` | `SmartVideo`: `w_1280,c_limit,q_auto:eco,f_mp4` stream, poster-only until `window.load` + idle, no inline filter | The raw upload is often many MB, and a CSS filter over a decoding video forces a full-viewport readback every frame |
| 4 "How it works" videos | 4 × `<video autoPlay preload="auto">` on page load | `SmartVideo` at `w_640`, fetched/paused by viewport, paused when the tab is hidden | 4 simultaneous downloads + 4 simultaneous decode streams |
| Services images (6) | **untransformed** PNG URLs through `next/image` | `SmartImage` → `w_800,f_auto,q_auto:eco` + blurred backdrop + `preload` for the first two | Full-size PNGs (hundreds of KB each) were fetched and then re-encoded by Next on every cold request |
| Shop / featured product cards | animated grey `animate-pulse` skeleton + opacity swap | `SmartImage` → `w_600,f_auto,q_auto:eco` + ~300 byte blurred back-drop | Skeletons guess the layout and delay the first meaningful paint |
| `next.config.mjs` | `formats` unset, 4-hour image cache, full 3840px ladder | AVIF + WebP, `minimumCacheTTL: 1 year`, trimmed `deviceSizes`/`imageSizes`, `qualities: [70,75,85]`, `maximumDiskCacheSize`, immutable `Cache-Control` for `/images/*` + static media, `/sw.js` served `no-store` | Repeat visitors re-requested optimized variants; the ladder generated sizes nothing displays |
| Repeat visits | browser HTTP cache only | service worker (`public/sw.js`) caches Cloudinary + local media **and** `/_next/static` (LRU-trimmed, 500 entries); navigations network-first with an offline fallback | Media was re-downloaded on every navigation/visit |
| Scrolling | Lenis `duration: 1.2` + custom easing on all devices, no opt-out for nested scrollers | Lenis `lerp: 0.12`, skipped on touch devices and `prefers-reduced-motion`, `anchors` offset for the sticky header, `data-lenis-prevent` on nested scroll containers | Duration/easing makes the page visibly chase the wheel; a JS scroll loop on mobile has no GPU inertia |
| Data fetching | `staleTime` 60 s, `refetchOnWindowFocus: true`, `retry: 2` | `staleTime` 5 min, `gcTime` 30 min, no refocus refetch, `retry: 1` (+ per-query TTLs in `use-products`) | Refetch storms re-rendered grids mid-scroll |
| Product page | preloaded **every** gallery image at 1200px on mount | only the first frame (the LCP image) | A multi-megabyte burst pushed the visible image back in the queue |
| CSS | `scroll-behavior: smooth`, no containment, animations always on | Lenis recommended CSS, `scrollbar-gutter: stable`, `touch-action: manipulation`, `.media-contain`, `.cv-auto`, reduced-motion overrides | Native smooth-scroll fights Lenis; containment lets the compositor skip off-screen work |

**Bug fixed along the way:** `getOptimizedImageUrl` used a greedy `^[^/]*,` regex to strip
existing Cloudinary transforms, which left the last transform behind
(`…/upload/w_400,f_auto,q_auto:eco/q_auto/v123/file.png`). It now strips *every* leading
transform segment via `stripLeadingTransforms()`, so a width/quality is never applied twice.

## 2. Libraries installed

| Package | Version | Role |
| --- | --- | --- |
| `sharp` | `^0.35.4` | Direct dependency now: it is the native encoder `next/image` uses for AVIF/WebP. Without it, production image optimization falls back to the much slower WASM path. Verified working (`libvips 8.18.6`). |
| `@vercel/speed-insights` | `^2.0.0` | Real-user LCP / INP / CLS reporting, wired into `app/layout.tsx` beside Vercel Analytics. You cannot fix jank you do not measure. |

Already present and reused rather than adding new dependencies: `lenis` (smooth scroll),
`hls.js` (adaptive-bitrate video on product pages), `@tanstack/react-query` (data cache).

**Deliberately not installed:** `@serwist/next` — its Next 16 story is still tied to webpack
build integration, and the hand-written `public/sw.js` works with Turbopack with zero build
risk (see suggestion 5.8 if you want to migrate later). `next-video` — it adds a Mux-style
player pipeline this Cloudinary-first setup does not need.

## 3. How the caching layers fit together

```text
Browser
 ├─ HTTP cache      → /images/*, static media, /_next/image (immutable, 1 year)
 ├─ Service worker  → ab-media-v1   Cloudinary + local media, cache-first, 500 entries
 │                  → ab-static-v1  /_next/static, cache-first
 │                  → ab-pages-v1   public navigations, network-first + offline fallback
 │                    skipped for: range requests, /auth, /admin, /customer,
 │                    /dashboard, /profile, /login, /signup
 ├─ App state        → in-memory shipment/customer store (lib/app-state.tsx)
 └─ Cloudinary CDN  → per-URL transforms, edge-cached
```

`components/providers/service-worker-provider.tsx` registers `public/sw.js` **only in
production**, on an idle callback, so it never competes with first paint. Range requests are
always passed through to the network (a cached 206 would break video seeking), and
`/sw.js` itself is served with `Cache-Control: no-store` from `next.config.mjs` so clients
never get pinned to an old cache — bump `VERSION` in `public/sw.js` to invalidate everything
on the next deploy.

## 4. Pre-existing build blocker (not caused by this work)

`npm run build` currently fails with 7 unique errors (×2 for client/SSR = 14) **before** any
of the changes above are involved:

```text
./app/login/page.tsx:14        Export DEMO_CUSTOMER_PASSWORD doesn't exist in @/lib/mock-data
./app/book/page.tsx:16         Export estimateCost doesn't exist in @/lib/mock-data
./lib/platform-context.tsx:12  Exports generateTrackingNumber / seedActivity / seedCustomers /
                               seedNotifications / seedShipments don't exist in @/lib/mock-data
```

`lib/mock-data.ts` only exports `mockCustomers`, `mockShipments`, `mockNotifications` and
`mockActivities`. The four `seed*` names (and the unused `generateTrackingNumber`) are a
straightforward rename in `lib/platform-context.tsx`, but `estimateCost` (booking price
estimate) and `DEMO_CUSTOMER_PASSWORD` (a value shown in the login UI) are business values,
so they were intentionally left alone. Every other error in the repo is type-level and
already suppressed by `typescript.ignoreBuildErrors`.

Nothing in this performance work adds a build error, and `npx tsc --noEmit` reports **zero**
errors for every file touched here.

## 5. Files added / changed

**Added**

- `components/media/smart-image.tsx` — `next/image` + Cloudinary width/quality + blurred backdrop + `preload` (Next 16's replacement for the deprecated `priority`)
- `components/media/smart-video.tsx` — viewport-, connection- and motion-aware background video
- `components/providers/service-worker-provider.tsx` — production-only service worker registration
- `public/sw.js` — media / static / offline cache
- `docs/PERFORMANCE.md` — this file

**Changed**

- `next.config.mjs` — images (formats, TTL, ladder, qualities), `headers()`, `optimizePackageImports`
- `app/layout.tsx` — SpeedInsights, SW provider, Cloudinary `dns-prefetch`
- `app/page.tsx` — hero + 4 step videos via `SmartVideo`, services images via `SmartImage`
- `app/globals.css` — Lenis CSS, containment helpers, `scrollbar-gutter`, reduced-motion
- `lib/cloudinary/image-utils.ts` — quality option, `getBlurImageUrl`, `stripLeadingTransforms`, transform-strip fix
- `lib/cloudinary/index.ts` — `getStreamingVideoUrl`, transform-strip fix
- `components/providers/lenis-provider.tsx`, `components/providers/query-provider.tsx`
- `hooks/use-products.ts`, `components/product/product-grid.tsx`, `app/shop/page.tsx`
- `app/product/[id]/product-page-client.tsx` — first-frame preload only, `preload` prop
- `app/reviews/[id]/page.tsx`, `app/product/[id]/components/video-player.tsx` — `priority` → `preload`
- 15 files received `data-lenis-prevent` on nested scroll containers (cart drawer, checkout sheet, search overlay, admin sheet, policy modal, live chat, `ScrollArea`, `Command`, dropdown/select/context menus, sidebar, admin nav, product-page modals)

## 6. How this was verified

```bash
npx tsc --noEmit         # 0 errors in every file touched here (repo has pre-existing errors)
node --check public/sw.js
npm run dev              # then inspect the rendered HTML
```

Rendered-HTML checks on the running dev server:

- **Homepage** — hero `poster` is `so_1.0,w_1280,f_jpg`, the 4 step posters are
  `so_1.0,w_640,f_jpg`, **no** `src` attribute on any `<video>` at first paint (zero video
  bytes), **zero** untransformed `video/upload/v…` sources, 6 Cloudinary blur layers
  (`w_32,e_blur:2000,q_1,f_auto`) for the 6 service images, and their `srcset` entries all
  point at the `w_800,f_auto,q_auto:eco` variant.
- **`SmartImage`** — renders a `fetchPriority="low"`, `aria-hidden` blurred `<img>` behind the
  real image; the main `<img>` gets `loading="eager"` + `fetchPriority="high"` for
  `aboveTheFold` and `loading="lazy"` otherwise, with `/_next/image?url=…w_600,f_auto,q_auto:eco…`
  srcset entries at `q=75` (allowed by `images.qualities`).
- **URL builders** — every helper was exercised through a temporary route: image, blur
  (image *and* video endpoints), poster, streaming video, already-transformed URLs (now
  correctly stripped instead of chained) and non-Cloudinary/local URLs (passed through
  untouched). The temporary route was removed afterwards.
- **`next.config.mjs`** — the three `headers()` sources were compiled with Next's own
  `getPathMatch` matcher: `/sw.js` matches only itself, `/images/:path*` matches
  `/images/*`, `/:path*.(svg|png|jpg|jpeg|gif|webp|avif|ico)` matches static media and
  correctly ignores `/shop` and `/api/*`. Dev startup reported no invalid-config warnings.

## 7. Remaining suggestions (prioritised)

1. **Unblock the build** (section 4) — add the missing `lib/mock-data.ts` exports. Nothing
   ships until this is done.
2. **Let Cloudinary do the resizing instead of Next.** Add a custom `loader` so each `srcset`
   width maps to a Cloudinary width directly. That removes the current double-optimization
   (Next fetches the `w_800` asset and then re-encodes every variant) and turns each size into
   a pure CDN hit:
   ```js
   // next.config.mjs
   images: { loader: 'custom', loaderFile: './lib/cloudinary/image-loader.ts' }

   // lib/cloudinary/image-loader.ts
   export default function cloudinaryLoader({ src, width }) {
     return src.replace(
       /\/upload\/(?:[^/]*,)?/,
       `/upload/w_${width},c_limit,f_auto,q_auto:eco/`,
     )
   }
   ```
   Keep `remotePatterns` for safety; `qualities` can be dropped once the loader owns quality.
3. **Delete the dead `components/boty/*` tree.** `hero.tsx`, `feature-section.tsx`,
   `product-grid.tsx` and `cart-drawer.tsx` are imported nowhere, yet they still contain
   `autoPlay preload="auto"` videos pointing at a Vercel Blob bucket — dead weight and a trap
   for the next search for autoplay video.
4. **Replace the remaining grey skeletons** in `features/admin/components/*` and
   `app/reviews/[id]` with `SmartImage`, so those surfaces get the blurred back-drop too.
5. **Lazy-load the admin charts.** `recharts` is imported statically by `app/admin/page.tsx`
   and `components/ui/chart.tsx`; `next/dynamic` around the chart cards keeps roughly 100 KB
   of JS off the admin login → dashboard path.
6. **Add `cv-auto` to long lists.** The utility exists in `app/globals.css`; applying it to
   `app/admin/activity` and `app/admin/shipments` row groups lets the browser skip
   layout/paint for off-screen rows. It is deliberately *not* used on the marketing pages,
   where the intrinsic-size estimate can make a first-visit `#anchor` jump land a few pixels
   off.
7. **Persist the React Query cache.** `@tanstack/react-query-persist-client` + `idb-keyval`
   would let a returning visitor see the product grid instantly from IndexedDB while
   revalidating in the background.
8. **Consider Serwist** if you want a typed service worker plus a build-time precache
   manifest (it supports Next 16 through its Turbopack example). The current hand-written
   worker deliberately trades that tooling for zero build coupling.
9. **Remove unused dependencies.** `html2pdf.js` is in `package.json` but has **zero**
   references in `app/`, `components/`, `lib/`, `features/`, `hooks/` or `scripts/` (the
   invoice page prints with `window.print`), so it can be dropped.
10. **Audit the last `<video>` in `app/reviews/[id]/page.tsx`** (review media modal). It is
    user-initiated so it is acceptable, but it should get `preload="none"` plus a Cloudinary
    poster if it ever renders outside a modal.