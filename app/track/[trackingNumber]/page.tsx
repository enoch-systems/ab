"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAppState } from "@/lib/app-state";
import {
  StatusBadge,
  formatDate,
  formatDateTime,
} from "@/components/shared/status-badge";
import { RouteStatusChip, ShipmentRouteRail } from "@/components/shared/shipment-route-rail";
import { TrackingTimeline } from "@/components/shared/tracking-timeline";
import { useLiveNow } from "@/hooks/use-live-now";
import { useLiveTracking } from "@/hooks/use-live-tracking";
import { describeEta, describeLastUpdate, routeProgress, scanStats } from "@/lib/shipment-progress";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  MapPin,
  Package,
  PackageSearch,
  Share2,
  Wifi,
} from "lucide-react";
import type { Shipment, ShipmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const HEADLINES: Record<ShipmentStatus, { title: string; sub: string }> = {
  "Order Created": { title: "Order received", sub: "We're preparing your shipment." },
  Confirmed: { title: "Confirmed", sub: "Ready for pickup. Courier scheduled." },
  "Picked Up": { title: "Picked up", sub: "Your parcel is with our courier." },
  "In Transit": { title: "On its way", sub: "Moving through our network." },
  "Arrived at Facility": { title: "At facility", sub: "Sorted and queued for dispatch." },
  "Out for Delivery": { title: "Out for delivery", sub: "Arriving today. Keep your phone close." },
  Delivered: { title: "Delivered", sub: "Signed and delivered. Thank you." },
  Exception: { title: "Needs attention", sub: "There's a delay. Contact support." },
};

function cityOf(v: string) {
  return (v || "").split(",")[0].trim() || "—";
}

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const raw = decodeURIComponent(String(params.trackingNumber || ""));
  const trackingNumber = raw.trim().toUpperCase();
  const { shipments, findShipmentByTracking } = useAppState();
  const localShipment = useMemo(() => findShipmentByTracking(trackingNumber), [findShipmentByTracking, shipments, trackingNumber]);
  const [publicShipment, setPublicShipment] = useState<Shipment | null>(null);
  const [lookupLoading, setLookupLoading] = useState(true);
  const shipment = localShipment ?? publicShipment;

  /**
   * One loader, used for the first paint and for every subsequent realtime
   * refresh. The public page is served by the service-role-backed /api/track
   * route, which is what lets an anonymous visitor see a shipment at all.
   */
  const loadPublic = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/track/${encodeURIComponent(trackingNumber)}`, {
        signal,
        cache: "no-store",
      });
      if (!response.ok || signal?.aborted) return;
      const payload = (await response.json()) as { shipment?: Shipment };
      if (signal?.aborted) return;
      setPublicShipment(payload.shipment ?? null);
    } catch {
      /* aborted or transient network error — the next refresh retries */
    }
  }, [trackingNumber]);

  useEffect(() => {
    if (localShipment) {
      setPublicShipment(null);
      setLookupLoading(false);
      return;
    }
    const controller = new AbortController();
    setLookupLoading(true);
    void loadPublic(controller.signal).finally(() => {
      if (!controller.signal.aborted) setLookupLoading(false);
    });
    return () => controller.abort();
  }, [loadPublic, localShipment]);

  /**
   * Instant updates for everyone, on any device.
   *
   * A database trigger broadcasts a content-free `shipment_changed` signal on
   * `shipment:<tracking number>` whenever the shipment, one of its scans or one
   * of its images changes — from the admin console, from an API route, or from a
   * manual edit in the Supabase dashboard. This page listens and re-reads
   * /api/track, so a status change lands here in well under a second instead of
   * waiting for a poll. See supabase/migrations/20250926000026_realtime_broadcast.sql.
   *
   * `useLiveTracking` also runs a slow backstop poll and refreshes on tab focus,
   * so the page can never sit stale even if the socket or the trigger is
   * unavailable.
   */
  const { status: liveStatus, lastEventAt } = useLiveTracking({
    trackingNumber,
    onInvalidate: () => void loadPublic(),
  });

  /** Flash the "updated just now" pulse right after a live push lands. */
  const [justUpdated, setJustUpdated] = useState(false);
  useEffect(() => {
    if (lastEventAt === null) return;
    setJustUpdated(true);
    const id = window.setTimeout(() => setJustUpdated(false), 4000);
    return () => window.clearTimeout(id);
  }, [lastEventAt]);
  const headline = useMemo(
    () => (shipment ? HEADLINES[shipment.status] : null),
    [shipment]
  );
  /** Ticking clock so the surface reads like the operations console: "updated 5 min ago". */
  const now = useLiveNow(30_000);
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showProductImage, setShowProductImage] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [lookup, setLookup] = useState("");

  const visibleEvents = useMemo(() => {
    if (!shipment) return [];
    if (showAll) return shipment.trackingEvents;
    // Old later-stage scans are kept as plain history (state 'completed',
    // chronological) by lib/app-state — they must stay visible. Only undated
    // *future plans* are collapsed: keep the next upcoming step, except a plan
    // whose stage already happened (a stamped row exists, e.g. an undated
    // "Delivered" preview after a backward correction to In Transit) — that
    // plan is outdated and must not render ahead of the latest update.
    const events = shipment.trackingEvents;
    const stampedStages = new Set(
      events.filter((e) => e.state !== "upcoming").map((e) => e.status)
    );
    const fresh = events.filter(
      (e) => e.state !== "upcoming" || !stampedStages.has(e.status)
    );
    const firstUpcoming = fresh.findIndex((e) => e.state === "upcoming");
    return fresh.filter((e, i) => e.state !== "upcoming" || i === firstUpcoming);
  }, [shipment, showAll]);
  const hiddenCount = (shipment?.trackingEvents.length ?? 0) - visibleEvents.length;

  if (!shipment && lookupLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Looking up shipment…
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-dvh flex flex-col bg-background text-foreground">
        <Header variant="default" />
        <main className="flex-1 px-4 pt-10 pb-16">
          <div className="mx-auto w-full max-w-md text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <PackageSearch className="h-6 w-6" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">No results</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">We couldn&apos;t find that shipment</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">{trackingNumber || "(empty)"}</span>{" "}
              doesn&apos;t match our records. Check the number and try again.
            </p>
            <form
              className="mt-6 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = lookup.trim().toUpperCase();
                if (v) router.push(`/track/${v}`);
              }}
            >
              <input
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                placeholder="Enter tracking number"
                autoComplete="off"
                autoCapitalize="characters"
                className="h-12 min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 text-[16px] outline-none placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
              />
              <button type="submit" className="h-12 shrink-0 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground active:scale-[0.98]">
                Track
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Tracking numbers are provided by ArcBest when a shipment is created.
            </p>
            <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const origin = cityOf(shipment.origin);
  const dest = cityOf(shipment.destination);
  const currentCity = cityOf(shipment.currentLocation);
  const isDelivered = shipment.status === "Delivered";
  const isException = shipment.status === "Exception";

  /* Every figure below comes from lib/shipment-progress — the same module the
     operations console renders — so a customer reads exactly what the operator
     set: same route percentage, same scan counter, same ETA wording. */
  const progress = routeProgress(shipment);
  const { completed: completedScans, total: scanCount } = scanStats(shipment.trackingEvents);
  const scanProgress = Math.min(100, Math.round((completedScans / Math.max(scanCount - 1, 1)) * 100));
  const lastUpdateLabel = describeLastUpdate(shipment.lastUpdated, now) ?? formatDateTime(shipment.lastUpdated);
  const etaLabel = describeEta(shipment.estimatedDelivery, shipment.status, now);
  const etaOverdue = Boolean(etaLabel?.includes("overdue"));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shipment.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* noop */ }
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: "Shipment tracking", text: shipment.trackingNumber, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* dismissed */ }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <Header variant="default" />
      <div className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-2.5">
          <button onClick={() => router.back()} aria-label="Go back" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card active:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[13px] font-semibold tracking-wide">{shipment.trackingNumber}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {origin} → {dest} · <span className="font-mono font-semibold text-foreground">{progress}%</span> complete
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection state, so "nothing changed" is visibly different from
                "the live connection dropped". Pulses briefly on each push. */}
            <span
              title={
                liveStatus === "live"
                  ? "Live — updates the moment this shipment changes"
                  : liveStatus === "polling"
                    ? "Reconnecting — checking for updates periodically"
                    : liveStatus === "offline"
                      ? "Offline — retrying automatically"
                      : "Connecting…"
              }
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-semibold",
                liveStatus === "live"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  : liveStatus === "polling"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                    : "border-border bg-muted/40 text-muted-foreground"
              )}
            >
              <span className="relative flex h-1.5 w-1.5">
                {liveStatus === "live" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                )}
                <span
                  className={cn(
                    "relative inline-flex h-1.5 w-1.5 rounded-full",
                    liveStatus === "live" ? "bg-emerald-500" : liveStatus === "polling" ? "bg-amber-500" : "bg-muted-foreground/50"
                  )}
                />
              </span>
              <Wifi className="h-3 w-3" />
              <span className="hidden sm:inline">
                {justUpdated ? "Updated now" : liveStatus === "live" ? "Live" : liveStatus === "polling" ? "Reconnecting" : "Offline"}
              </span>
            </span>
            <button onClick={copy} aria-label="Copy" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card active:bg-muted">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
            <button onClick={share} aria-label="Share" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card active:bg-muted">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <main className="flex-1 px-4 pb-28 pt-4 sm:pb-16 sm:pt-8">
        <div className="mx-auto w-full max-w-2xl space-y-3">
          <section className="overflow-hidden rounded-3xl border border-border/70 bg-card">
            <div className={cn("h-1 w-full", isDelivered && "bg-emerald-500", isException && "bg-rose-500", !isDelivered && !isException && "bg-gradient-to-r from-primary via-sky-500 to-accent")} />
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={shipment.status} />
                <RouteStatusChip status={shipment.status} />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  <CalendarClock className="h-3 w-3" /> ETA {formatDate(shipment.estimatedDelivery)}
                </span>
                {etaLabel && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold",
                      etaOverdue
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {etaLabel}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-tight sm:text-4xl">{headline?.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{headline?.sub}</p>
              {/* The same origin → rail → destination the operations console shows,
                  with the identical completion percentage and leg caption. */}
              <ShipmentRouteRail shipment={shipment} className="mt-6" />

              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {isDelivered ? `Delivered in ${dest}` : `Now in ${currentCity}`} · Updated {lastUpdateLabel}
                </span>
              </p>
            </div>
          </section>
          {shipment.images && shipment.images.length > 0 && (
            <section className="overflow-hidden rounded-3xl border border-border/70 bg-card p-5">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold tracking-tight">Product image</h2>
                  <p className="text-[11px] text-muted-foreground">Uploaded with this shipment</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductImage((v) => !v)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-[11px] font-semibold text-foreground transition hover:bg-muted"
                >
                  {showProductImage ? "Hide image" : "Show image"}
                </button>
              </div>

              {showProductImage && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {shipment.images.map((image) => (
                    <a
                      key={image.id}
                      href={image.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group overflow-hidden rounded-2xl border border-border bg-background"
                    >
                      <img
                        src={image.publicUrl}
                        alt={image.altText || "Shipment product image"}
                        className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="rounded-3xl border border-border/70 bg-card p-5">
            <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-tight">Tracking timeline</h2>
                <p className="text-[11px] text-muted-foreground">
                  {completedScans} of {scanCount} tracking scans recorded
                </p>
              </div>
              <RouteStatusChip status={shipment.status} />
            </div>
            <div className="mb-1 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-[width] duration-700 ease-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <span className="shrink-0 font-mono text-[11px] font-semibold text-muted-foreground">
                {completedScans}/{scanCount}
              </span>
            </div>
            <TrackingTimeline events={visibleEvents} animate />
            {hiddenCount > 0 && (
              <button onClick={() => setShowAll((v) => !v)} className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border bg-muted/40 py-2.5 text-[13px] font-semibold active:bg-muted">
                {showAll ? "Show less" : `Show full journey (${hiddenCount} more)`}
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAll && "rotate-180")} />
              </button>
            )}
          </section>
          <section className="overflow-hidden rounded-3xl border border-border/70 bg-card">
            <button onClick={() => setDetailsOpen((v) => !v)} aria-expanded={detailsOpen} className="flex w-full items-center justify-between p-5 text-left active:bg-muted/40">
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="h-4 w-4" />
                </span>
                <span className="text-[15px] font-semibold">Shipment details</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", detailsOpen && "rotate-180")} />
            </button>
            {detailsOpen && (
              <dl className="grid grid-cols-2 gap-px border-t border-border/60 bg-border/40">
                {[
                  { label: "Service", value: shipment.shippingMethod },
                  { label: "Weight", value: `${shipment.weight} kg` },
                  { label: "Packages", value: `${shipment.packageCount} × ${shipment.packageType}` },
                  { label: "Dimensions", value: shipment.dimensions },
                  { label: "Expected", value: formatDate(shipment.estimatedDelivery) },
                  { label: "Last updated", value: lastUpdateLabel },
                ].map((r) => (
                  <div key={r.label} className="bg-card p-4">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{r.label}</dt>
                    <dd className="mt-1 truncate text-sm font-semibold">{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
          <section className="rounded-3xl border border-border/70 bg-card p-5">
            <h2 className="text-[15px] font-semibold">Need help with this delivery?</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Delays, address changes, or proof of delivery — we&apos;ve got you.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/contact" className="flex h-11 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98]">Contact support</Link>
              <Link href="/faq" className="flex h-11 items-center justify-center rounded-2xl border border-border text-sm font-semibold active:bg-muted">Delivery FAQs</Link>
            </div>
          </section>
          <section className="hidden rounded-3xl border border-border/70 bg-card p-5 sm:block">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = lookup.trim().toUpperCase();
                if (v) router.push(`/track/${v}`);
              }}
            >
              <input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="Track another number…" autoComplete="off" autoCapitalize="characters" className="h-11 min-w-0 flex-1 rounded-2xl border border-border bg-background px-4 text-[15px] outline-none placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/15" />
              <button type="submit" className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-foreground px-5 text-sm font-semibold text-background active:scale-[0.98]">
                Track <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </section>
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 pt-2.5 backdrop-blur-md sm:hidden" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}>
        <form
          className="mx-auto flex max-w-2xl gap-2 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            const v = lookup.trim().toUpperCase();
            if (v) router.push(`/track/${v}`);
          }}
        >
          <input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="Track another number…" autoComplete="off" autoCapitalize="characters" aria-label="Track another number" className="h-12 min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 text-[16px] outline-none placeholder:text-muted-foreground/70 focus:border-primary/60" />
          <button type="submit" aria-label="Track shipment" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground active:scale-95">
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
      <div className="hidden sm:block">
        <Footer />
      </div>
    </div>
  );
}
