# ArcBest — Logistics & Shipment Tracking

A logistics and shipment-tracking platform. Customers follow shipments in real time; operators create shipments, manage customers, update tracking events, and support customers from an admin console.

Built with **Next.js 16** (App Router + Turbopack), **React 19**, **TypeScript**,
**Tailwind CSS v4** and **Cloudinary**.

---

## Table of contents

- [Overview](#overview)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Routes](#routes)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Data layer](#data-layer)
- [Tech stack](#tech-stack)
- [Scripts](#scripts)
- [Conventions](#conventions)

---

## Overview

### Public site

- Marketing homepage with hero video, service highlights and live-chat widget
- Contact and FAQ pages
- Public tracking lookup by tracking number, with a full scan-event timeline
- WhatsApp enquiry shortcut (hidden on admin routes)

### Customer portal — `/customer`

- Email/password sign-in and sign-up (multi-step, with address + policy capture)
- Dashboard summarising active shipments
- Shipment list, shipment detail with tracking timeline, and product/packing images
- Support inbox for ArcBest messages and customer replies
- Profile management and a notifications inbox

### Admin console — `/admin`

- Operations dashboard with KPIs and recent activity
- Shipment management (list + detail) and a tracking board
- Admin shipment creation with registered-customer lookup and 1–3 image uploads
- Customer support inbox and reply composer
- Customer management (list + detail)
- Analytics dashboard (Recharts) and an activity log
- Settings, including theme control

---

## Getting started

Requires **Node.js 20+** and **pnpm**.

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# ...then fill in your Cloudinary values

# Start the dev server
pnpm dev
```

The app runs at <http://localhost:3000>.

> No database or auth provider is required to run the project — see
> [Data layer](#data-layer).

---

## Environment variables

| Variable | Purpose | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name used to build every image/video URL | Yes |
| `CLOUDINARY_API_KEY` | Server-only Cloudinary key | No |
| `CLOUDINARY_API_SECRET` | Server-only Cloudinary secret | No |

`.env.local` is git-ignored. Only variables prefixed `NEXT_PUBLIC_` are exposed to
the browser.

---

## Routes

Public:

| Route | Description |
| --- | --- |
| `/` | Homepage |
| `/contact` | Contact page |
| `/faq` | FAQ page |
| `/track` | Tracking-number lookup form |
| `/track/[trackingNumber]` | Live tracking result with event timeline |

Customer portal:

| Route | Description |
| --- | --- |
| `/customer/login` | Customer sign-in |
| `/customer/signup` | Customer registration |
| `/customer/forgot-password` | Password recovery request |
| `/customer/dashboard` | Customer overview |
| `/customer/shipments` | Shipment list |
| `/customer/shipments/[id]` | Shipment detail + timeline |
| `/customer/inbox` | Support inbox |
| `/customer/profile` | Profile settings |
| `/customer/notifications` | Notification inbox |

Admin console:

| Route | Description |
| --- | --- |
| `/admin/login` | Admin sign-in |
| `/admin` | Operations dashboard |
| `/admin/shipments` | Order management |
| `/admin/shipments/new` | Admin-created shipment form |
| `/admin/shipments/[id]` | Shipment detail + operations |
| `/admin/inbox` | Customer support inbox |
| `/admin/tracking` | Tracking board |
| `/admin/users` | Customer list |
| `/admin/users/[id]` | Customer detail |
| `/admin/analytics` | Analytics dashboard |
| `/admin/activity` | Activity log |
| `/admin/reviews` | Review queue |
| `/admin/settings` | Settings |

Legacy redirect stubs kept so old links keep working — each one is a three-line
`redirect()` page: `/login`, `/signup`, `/dashboard`, `/profile`, `/book`,
`/operations`.

---

## Project structure

```text
aboma/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout + providers
│   ├── page.tsx                  # Homepage
│   ├── globals.css               # Tailwind v4 theme + utilities
│   ├── error.tsx / global-error.tsx / not-found.tsx
│   ├── admin/                    # Admin console (own layout + guard)
│   ├── customer/                 # Customer portal (own layout + guard)
│   ├── track/                    # Public tracking
│   ├── contact/  faq/            # Static content
│   └── login/ signup/ dashboard/ profile/ book/ operations/   # redirect stubs
│
├── components/
│   ├── layout/                   # Header, footer, WhatsApp button
│   ├── media/                    # smart-image.tsx, smart-video.tsx
│   ├── providers/                # Theme, Lenis, service worker
│   ├── shared/                   # Brand logo, status badge, timeline, admin/*
│   └── ui/                       # shadcn/ui primitives
│
├── hooks/
│   └── use-mobile.ts
│
├── lib/
│   ├── app-state.tsx             # Session + shipment/customer store
│   ├── types.ts                  # Domain types
│   ├── navigation.ts             # Shared nav definitions
│   ├── utils.ts                  # cn() class-merge helper
│   └── cloudinary/               # URL building + transforms
│
├── public/                       # Icons, images, sw.js
├── docs/PERFORMANCE.md           # Caching / bundle notes
├── proxy.ts                      # Next.js middleware
├── next.config.mjs
├── components.json               # shadcn/ui config
└── package.json
```

---


## Architecture

```text
Browser
  │
  ├─ app/layout.tsx ── providers
  │     ├─ ThemeProvider        dark/light
  │     ├─ AppStateProvider     session, shipments, customers, notifications
  │     ├─ LenisProvider        smooth scroll
  │     └─ ServiceWorkerProvider offline/media caching (production only)
  │
  ├─ components/layout/header.tsx ── role-aware nav (default | customer | admin)
  │
  ├─ (public)   /  /track  /contact  /faq
  ├─ (customer) /customer/*   guarded by app/customer/layout.tsx
  └─ (admin)    /admin/*      guarded by app/admin/layout.tsx
```

- **Route guards are client-side.** `app/customer/layout.tsx` and
  `app/admin/layout.tsx` read the session from `AppStateProvider` and redirect to
  the matching login page when the role does not match.
- **`proxy.ts`** stamps request headers (`x-logix-path`, `x-logix-auth`) and
  bounces the retired `/admin/signup` path to `/admin/login`.
- **Each admin page is its own route segment**, so the shell in
  `app/admin/layout.tsx` renders once and only the panel swaps.

---

## Data layer

`lib/app-state.tsx` is the single React context for the session and domain
collections (customers, shipments, notifications, activity, and support messages).
Supabase Auth is wired through the memoized browser client in
`lib/supabase/client.ts`; the provider restores the current session, listens for
auth changes, loads the signed-in user's RLS-protected profile, and derives the
customer/admin role from that profile. Authenticated app data is loaded from
Supabase rather than seed data. Admin shipment creation, status/location updates,
support messages, notifications, shipment images, and tracking events are persisted
through the RLS-protected data layer.

Supabase Auth and RLS are the authentication and authorization boundary, while
the client route guards wait for the restored session before redirecting.

```tsx
const { session, authReady, shipments, currentCustomer, unreadCount, supportMessages } = useAppState()
```

Admin users must sign in with the email address of an Auth user whose
`profiles.role` is `admin`. Customer users must have `profiles.role` set to
`customer`.

---

## Tech stack

### Frontend

- **Next.js 16.3.5** — App Router, Turbopack, proxy middleware
- **React 19.2** — server components where useful, client components for state
- **TypeScript 5** — strict mode, `@/*` path alias to the project root
- **Tailwind CSS v4** — `@tailwindcss/postcss`, theme tokens in `app/globals.css`
- **shadcn/ui** — Radix primitives in `components/ui/`
- **lucide-react** — icons
- **Recharts** — admin analytics
- **sonner** — toast notifications
- **Lenis** — smooth scrolling
- **next-themes** — light/dark theming

### Media

- **Cloudinary** — image and video delivery, with transform helpers in
  `lib/cloudinary/`
- `components/media/smart-image.tsx` and `smart-video.tsx` centralise responsive
  `f_auto` / `q_auto` URL construction and skeleton states

### Offline & performance

- `public/sw.js` — cache-first for `/_next/static` and Cloudinary media,
  network-first for navigations, bypassed for authenticated routes
- **Vercel Analytics** and **Speed Insights**
- See [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) for the caching model

---

## Scripts

```bash
pnpm dev      # development server
pnpm build    # production build
pnpm start    # serve the production build
pnpm lint     # eslint .
```

Package management is **pnpm** (`pnpm-lock.yaml`). `package-lock.json` and
`yarn.lock` are git-ignored on purpose.

---

## Conventions

- **Path alias** — import from `@/` (project root), never deep relative paths
  across feature boundaries.
- **Server vs client** — add `"use client"` only where state, effects or browser
  APIs are needed.
- **Styling** — Tailwind utilities plus the shared `boty-*` helpers in
  `app/globals.css`; `cn()` from `@/lib/utils` for conditional classes.
- **Domain types** live in `lib/types.ts` and are imported with `import type`.
- **Adding a route** — create `app/<segment>/page.tsx`; add a `layout.tsx` if the
  segment needs its own shell or guard.
- **Admin UI** — reuse the primitives in `components/shared/admin/` rather than
  re-styling cards and headers per page.

---

## License

Proprietary — All rights reserved. This project is confidential and intended for
internal use only.

