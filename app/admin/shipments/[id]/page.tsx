"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import type { Customer, Shipment, ShipmentStatus } from "@/lib/types";
import { AdminBreadcrumbs, AdminIdPill } from "@/components/shared/admin/admin-page-header";
import { CopyTrackingId } from "@/components/shared/copy-tracking-id";
import { AdminPanel } from "@/components/shared/admin/admin-panel";
import { ShipmentRouteProgress } from "@/components/shared/admin/shipment-route-progress";
import { TrackingTimeline } from "@/components/shared/tracking-timeline";
import { StatusBadge, formatCurrency, formatDate, formatDateTime } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLiveNow } from "@/hooks/use-live-now";
import {
  ALL_SHIPMENT_STATUSES,
  LAST_JOURNEY_INDEX,
  SHIPMENT_JOURNEY,
  describeEta,
  describeLastUpdate,
  progressForStatus,
  scanStats,
} from "@/lib/shipment-progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Banknote, Building2, Check, CheckCircle2, CircleDot,
  Clock, Copy, Edit3, Hash, History, Loader2, Mail, MapPin, Package, Phone, Scale, Send,
  Truck, User, Users, Ruler,
} from "lucide-react";

/** How long the busy state stays visible so the change is readable on screen. */
const PULSE_MS = 420;
/** How long a freshly recorded scan stays highlighted in the timeline. */
const FLASH_MS = 3000;

export default function AdminShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const { findShipmentById, updateShipmentStatus, updateShipmentLocation, customers } = useAppState();
  const shipment = findShipmentById(id);
  /** Ticking clock for relative timestamps — `null` until mounted (SSR-safe). */
  const now = useLiveNow(15_000);

  const [next, setNext] = useState<ShipmentStatus | "">("");
  const [location, setLocation] = useState("");
  const [applying, setApplying] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [flashIds, setFlashIds] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [drafts, setDrafts] = useState({ destination: "", address: "", currentLocation: "" });

  const applyTimer = useRef<number | null>(null);
  const locationTimer = useRef<number | null>(null);
  const flashTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      [applyTimer, locationTimer, flashTimer].forEach((ref) => {
        if (ref.current) window.clearTimeout(ref.current);
      });
    },
    [],
  );

  /* Keep the edit drafts aligned with the live record: any status update — or a
     change made on another surface — rewrites `lastUpdated`, which re-syncs the
     fields the operator is not currently working in. */
  useEffect(() => {
    if (!shipment) return;
    setDrafts({
      destination: shipment.destination,
      address: shipment.recipient.address,
      currentLocation: shipment.currentLocation,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipment?.id, shipment?.lastUpdated]);

  const customer: Customer | undefined = useMemo(
    () => (shipment ? customers.find((c) => c.id === shipment.customerId) : undefined),
    [shipment, customers],
  );

  const stageIndex = shipment ? SHIPMENT_JOURNEY.indexOf(shipment.status) : -1;
  const isDelivered = shipment?.status === "Delivered";
  const isException = shipment?.status === "Exception";

  /* The counters and the ETA wording come from the shared progress module, so
     this console and the public /track page can never report different figures. */
  const { completed: completedScans, total: scanCount } = useMemo(
    () => scanStats(shipment?.trackingEvents ?? []),
    [shipment],
  );
  const scanProgress = Math.min(100, Math.round((completedScans / Math.max(scanCount - 1, 1)) * 100));

  const lastUpdatedLabel = shipment ? describeLastUpdate(shipment.lastUpdated, now) : null;
  const etaSubLabel = shipment ? describeEta(shipment.estimatedDelivery, shipment.status, now) : null;
  const etaOverdue = Boolean(etaSubLabel?.includes("overdue"));

  const advanceStatus: ShipmentStatus | null =
    shipment && stageIndex >= 0 && stageIndex < LAST_JOURNEY_INDEX ? SHIPMENT_JOURNEY[stageIndex + 1] : null;

  /** What the pending change will do, previewed before it is applied. */
  const pendingPreview = useMemo(() => {
    if (!shipment || !next) return null;
    const resolved =
      location.trim() || (next === "Delivered" ? shipment.destination : shipment.currentLocation);
    return { status: next, location: resolved, progress: progressForStatus(next) };
  }, [shipment, next, location]);

  const quickActions = useMemo(() => {
    if (!shipment) return [] as { status: ShipmentStatus; label: string; tone: string }[];
    const actions: { status: ShipmentStatus; label: string; tone: string }[] = [];
    /* One action per status: "Out for Delivery" would otherwise offer both
       "Advance to Delivered" and "Jump to Delivered". */
    const add = (status: ShipmentStatus, label: string, tone: string) => {
      if (!actions.some((action) => action.status === status)) actions.push({ status, label, tone });
    };
    if (advanceStatus && advanceStatus !== shipment.status) {
      add(advanceStatus, `Advance to ${advanceStatus}`, "border-primary/40 text-primary hover:bg-primary/5");
    }
    if (!isDelivered) {
      add(
        "Delivered",
        "Jump to Delivered",
        "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/5 dark:text-emerald-300",
      );
    }
    if (!isException) {
      add("Exception", "Mark exception", "border-rose-500/40 text-rose-600 hover:bg-rose-500/5 dark:text-rose-300");
    }
    return actions;
  }, [shipment, advanceStatus, isDelivered, isException]);

  const copyTracking = useCallback(async () => {
    if (!shipment) return;
    try {
      await navigator.clipboard.writeText(shipment.trackingNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard access is blocked in this browser.");
    }
  }, [shipment]);

  const saveLocation = () => {
    if (!shipment) return;
    const { destination, address, currentLocation } = drafts;
    if (!destination.trim() || !address.trim() || !currentLocation.trim()) {
      toast.error("Destination, delivery address and current location are all required.");
      return;
    }
    setSavingLocation(true);
    if (locationTimer.current) window.clearTimeout(locationTimer.current);
    locationTimer.current = window.setTimeout(() => {
      const updated = updateShipmentLocation(shipment.id, {
        destination,
        recipientAddress: address,
        currentLocation,
      });
      setSavingLocation(false);
      if (!updated) {
        toast.error("Could not save the address and location.");
        return;
      }
      setDrafts({
        destination: updated.destination,
        address: updated.recipient.address,
        currentLocation: updated.currentLocation,
      });
      toast.success("Address & location saved", {
        description: `Current parcel location is now ${updated.currentLocation}.`,
      });
    }, PULSE_MS);
  };

  const apply = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!shipment) return;
    if (!next) {
      toast.error("Choose the next status before applying.");
      return;
    }
    if (next === shipment.status) {
      toast.error(`"${next}" is already the current status.`);
      return;
    }
    const target = next;
    setApplying(true);
    if (applyTimer.current) window.clearTimeout(applyTimer.current);
    applyTimer.current = window.setTimeout(async () => {
      const resolvedLocation =
        location.trim() || (target === "Delivered" ? shipment.destination : shipment.currentLocation);
      let updated: Shipment | null = null;
      try {
        updated = await updateShipmentStatus(shipment.id, target, resolvedLocation);
      } catch {
        updated = null;
      }
      setApplying(false);
      setNext("");
      setLocation("");
      if (!updated) {
        toast.error("Could not save the status update to the database. Try again.");
        return;
      }
      const landed = updated.trackingEvents.find((e) => e.state === "current");
      if (landed) {
        setFlashIds([landed.id]);
        if (flashTimer.current) window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlashIds([]), FLASH_MS);
      }
      setAnnouncement(
        `Status updated to ${target} at ${resolvedLocation}. Timeline, notifications and analytics are in sync.`,
      );
      setStatusOpen(false);
      toast.success(`Status updated to "${target}"`, {
        description: `${customer?.fullName ?? "The customer"} was notified · timeline and analytics refreshed.`,
        action: { label: "Public view", onClick: () => router.push(`/track/${updated.trackingNumber}`) },
      });
    }, PULSE_MS);
  };

  if (!shipment) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-2xl pb-10 sm:pb-14">
        <AdminBreadcrumbs
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Orders", href: "/admin/shipments" },
            { label: "Not found" },
          ]}
        />
        <AdminPanel headerless contentClassName="px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-2xl">Shipment not found</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            That order does not exist or has been removed. Search the order list to find the right tracking
            number.
          </p>
          <Button asChild variant="outline" className="mt-6 h-11 rounded-xl">
            <Link href="/admin/shipments">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to orders
            </Link>
          </Button>
        </AdminPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] pb-10 sm:pb-14">
      <AdminBreadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Orders", href: "/admin/shipments" },
          { label: shipment.trackingNumber },
        ]}
      />

      {/* Header — identity, live state, and the two things an operator does from here */}
      <div className="mb-5 flex flex-col gap-4 lg:mb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button asChild variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full lg:hidden">
            <Link href="/admin/shipments" aria-label="Back to orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <AdminIdPill value={shipment.trackingNumber} icon={<Hash className="h-3 w-3" />} />
              <CopyTrackingId value={shipment.trackingNumber} className="!h-6 !w-6 !rounded-md" />
              <StatusBadge status={shipment.status} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {lastUpdatedLabel
                  ? `Updated ${lastUpdatedLabel}`
                  : `Updated ${formatDateTime(shipment.lastUpdated)}`}
              </span>
            </div>
            <h1 className="mt-2 font-serif text-2xl leading-tight tracking-tight sm:text-3xl">
              Shipment Operations
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {shipment.shippingMethod} · {shipment.origin} → {shipment.destination} · ETA{" "}
              {formatDate(shipment.estimatedDelivery)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button variant="outline" className="h-10 rounded-xl" onClick={copyTracking}>
            {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied" : "Copy ID"}
          </Button>
          <Button
            asChild
            className="h-10 rounded-xl bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/92"
          >
            <Link href={`/track/${shipment.trackingNumber}`}>
              Public view
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 1 · Where is it right now — live route plus the facts an operator needs */}
      <ShipmentRouteProgress
        shipment={shipment}
        className="animate-rise-in mb-4 sm:mb-5"
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <FactChip icon={<Truck className="h-3.5 w-3.5" />} label="Method" value={shipment.shippingMethod} />
          <FactChip
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Current location"
            value={shipment.currentLocation.split(",")[0]}
          />
          <FactChip icon={<Scale className="h-3.5 w-3.5" />} label="Weight" value={`${shipment.weight} kg`} />
          <FactChip
            icon={<Package className="h-3.5 w-3.5" />}
            label="Packages"
            value={String(shipment.packageCount)}
          />
          <FactChip
            icon={<Clock className="h-3.5 w-3.5" />}
            label="ETA"
            value={formatDate(shipment.estimatedDelivery)}
            sub={etaSubLabel ?? undefined}
            tone={etaOverdue ? "warn" : "default"}
          />
          <FactChip
            icon={<Banknote className="h-3.5 w-3.5" />}
            label="Cost"
            value={formatCurrency(shipment.cost, shipment.currency)}
          />
          <FactChip
            icon={<History className="h-3.5 w-3.5" />}
            label="Last update"
            value={lastUpdatedLabel ?? formatDateTime(shipment.lastUpdated)}
          />
        </div>
      </ShipmentRouteProgress>

      {shipment.images && shipment.images.length > 0 && <AdminPanel title="Product & packing images" subtitle="Uploaded with this shipment" icon={<Package className="h-4 w-4" />} className="mb-4 sm:mb-5"><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{shipment.images.map((image) => <a key={image.id} href={image.publicUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border"><img src={image.publicUrl} alt={image.altText} className="aspect-[4/3] w-full object-cover transition hover:scale-[1.02]" /></a>)}</div></AdminPanel>}

      {/* 2 · Cockpit — the live timeline (click to open the update dialog), then correct + reference */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
        {/* Timeline & status update — the live timeline IS the cockpit. Clicking it (or
            Update status) opens the apply dialog and blurs the rest of the screen. */}
        <div className="order-1 lg:order-1 lg:col-span-12">
          <AdminPanel
            title="Tracking timeline"
            subtitle={`${completedScans} of ${scanCount} tracking scans recorded`}
            icon={<Truck className="h-4 w-4" />}
            className="animate-rise-in"
            contentClassName="p-3 sm:p-5"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            }
          >
            <button
              type="button"
              onClick={() => setStatusOpen(true)}
              aria-label="Open status update"
              className="group w-full text-left"
            >
              <div className="mb-3 flex items-center gap-3 px-1">
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
              <TrackingTimeline events={shipment.trackingEvents} animate flashIds={flashIds} />
            </button>
            <Button
              type="button"
              onClick={() => setStatusOpen(true)}
              className="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-primary to-cyan-500 font-semibold text-white shadow-md shadow-primary/20"
            >
              <Edit3 className="mr-2 h-4 w-4" /> Update status
            </Button>
          </AdminPanel>
        </div>

        {/* Correct: addresses and the parcel's current location */}
        <div className="order-2 lg:order-2 lg:col-span-4">
          <AdminPanel
            title="Address & location"
            subtitle="No lookup required — any clear location works."
            icon={<MapPin className="h-4 w-4" />}
            className="animate-rise-in"
            contentClassName="p-4 sm:p-5"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="order-destination"
                  className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Destination
                </label>
                <Input
                  id="order-destination"
                  value={drafts.destination}
                  onChange={(event) => setDrafts((d) => ({ ...d, destination: event.target.value }))}
                  maxLength={200}
                  className="h-11 rounded-xl"
                  placeholder="City, region or facility"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="order-address"
                  className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Delivery address
                </label>
                <Textarea
                  id="order-address"
                  value={drafts.address}
                  onChange={(event) => setDrafts((d) => ({ ...d, address: event.target.value }))}
                  maxLength={240}
                  rows={3}
                  className="resize-y rounded-xl text-base sm:text-sm"
                  placeholder="Street, suite, city"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="order-current-location"
                  className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Current parcel location
                </label>
                <Input
                  id="order-current-location"
                  value={drafts.currentLocation}
                  onChange={(event) => setDrafts((d) => ({ ...d, currentLocation: event.target.value }))}
                  maxLength={200}
                  className="h-11 rounded-xl"
                  placeholder="Warehouse, hub, driver or city"
                />
              </div>

              <Button
                type="button"
                onClick={saveLocation}
                disabled={savingLocation}
                className="h-11 w-full rounded-xl font-semibold shadow-md shadow-primary/20"
              >
                {savingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" /> Save address & location
                  </>
                )}
              </Button>
            </div>
          </AdminPanel>
        </div>

        {/* Reference: people, package and money */}
        <div className="order-3 space-y-4 sm:space-y-5 lg:order-3 lg:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {customer && (
              <PartyCard
                role="Customer"
                icon={<Users className="h-4 w-4" />}
                name={customer.fullName}
                email={customer.email}
                phone={customer.phone}
                address={[customer.address, customer.city, customer.state, customer.country]
                  .filter(Boolean)
                  .join(", ")}
                href={`/admin/users/${customer.id}`}
                hrefLabel="Open account"
              />
            )}
            <PartyCard
              role="Sender"
              icon={<User className="h-4 w-4" />}
              name={shipment.sender.name}
              email={shipment.sender.email}
              phone={shipment.sender.phone}
              address={[
                shipment.sender.address,
                shipment.sender.city,
                shipment.sender.state,
                shipment.sender.country,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <PartyCard
              role="Recipient"
              icon={<MapPin className="h-4 w-4" />}
              name={shipment.recipient.name}
              email={shipment.recipient.email}
              phone={shipment.recipient.phone}
              address={[
                shipment.recipient.address,
                shipment.recipient.city,
                shipment.recipient.state,
                shipment.recipient.country,
              ]
                .filter(Boolean)
                .join(", ")}
            />
          </div>

          <AdminPanel
            title="Package & cost"
            subtitle={`${shipment.packageCount} × ${shipment.packageType} · ${shipment.shippingMethod}`}
            icon={<Package className="h-4 w-4" />}
            className="animate-rise-in"
            contentClassName="p-4 sm:p-5 space-y-4"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <InfoRow label="Type" value={shipment.packageType} icon={<Package className="h-3.5 w-3.5" />} />
              <InfoRow label="Weight" value={`${shipment.weight} kg`} icon={<Scale className="h-3.5 w-3.5" />} />
              <InfoRow label="Dimensions" value={shipment.dimensions} icon={<Ruler className="h-3.5 w-3.5" />} />
              <InfoRow
                label="Packages"
                value={String(shipment.packageCount)}
                icon={<Package className="h-3.5 w-3.5" />}
              />
              <InfoRow label="Method" value={shipment.shippingMethod} icon={<Truck className="h-3.5 w-3.5" />} />
              <InfoRow
                label="Cost"
                value={formatCurrency(shipment.cost, shipment.currency)}
                icon={<Banknote className="h-3.5 w-3.5" />}
              />
              <InfoRow
                label="Created"
                value={formatDateTime(shipment.createdAt)}
                icon={<Clock className="h-3.5 w-3.5" />}
              />
              <InfoRow
                label="Last updated"
                value={formatDateTime(shipment.lastUpdated)}
                icon={<History className="h-3.5 w-3.5" />}
              />
            </div>

            {shipment.instructions && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                <span className="font-semibold">Handling instructions · </span>
                {shipment.instructions}
              </p>
            )}
          </AdminPanel>
        </div>
      </div>

      {/* Status update dialog — everything behind it stays blurred while it's open */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center sm:justify-start">
              <Edit3 className="h-5 w-5 text-primary" />
              Update status
            </DialogTitle>
            <DialogDescription>Timeline, notifications and analytics update instantly.</DialogDescription>
          </DialogHeader>
          <form onSubmit={apply} className="space-y-4">
            <JourneyStepper status={shipment.status} selected={next} onSelect={setNext} />

            {quickActions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    onClick={() => setNext(action.status)}
                    aria-pressed={next === action.status}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full border bg-card px-3 text-[11px] font-semibold transition",
                      action.tone,
                      next === action.status && "ring-2 ring-primary/30",
                    )}
                  >
                    <StatusIcon status={action.status} />
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="next-status"
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                New status
              </label>
              <Select value={next} onValueChange={(value) => setNext(value as ShipmentStatus)}>
                <SelectTrigger id="next-status" className="h-11 rounded-xl">
                  <SelectValue placeholder="Choose next status…" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SHIPMENT_STATUSES.filter((status) => status !== shipment.status).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="status-location"
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Location (optional)
              </label>
              <Input
                id="status-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={120}
                className="h-11 rounded-xl"
                placeholder={`Defaults to ${shipment.currentLocation}`}
              />
            </div>

            {pendingPreview && (
              <div className="animate-rise-in rounded-xl border border-primary/25 bg-primary/[0.04] p-3">
                <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-foreground">
                  {shipment.status}
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  {pendingPreview.status}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  Recorded at <span className="font-medium text-foreground">{pendingPreview.location}</span> ·
                  route moves to{" "}
                  <span className="font-mono font-semibold text-primary">{pendingPreview.progress}%</span> ·{" "}
                  {customer?.fullName ?? "the customer"} is notified.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                disabled={applying || !next}
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-primary to-cyan-500 font-semibold text-white shadow-md shadow-primary/20"
              >
                {applying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Apply status update
                  </>
                )}
              </Button>
              {next && (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-xl"
                  onClick={() => {
                    setNext("");
                    setLocation("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            <p className="sr-only" aria-live="polite">
              {announcement}
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Inline icon per status — shared by the stage rail, quick actions and chips. */
function StatusIcon({ status }: { status: ShipmentStatus }) {
  switch (status) {
    case "Delivered":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
    case "In Transit":
      return <Truck className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />;
    case "Out for Delivery":
      return <Send className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
    case "Exception":
      return <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />;
    case "Arrived at Facility":
      return <Building2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />;
    default:
      return <CircleDot className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />;
  }
}

/** One at-a-glance fact inside the live route panel. */
function FactChip({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-card p-2.5 sm:p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span className="shrink-0 text-primary/80">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="truncate text-[13px] font-semibold leading-tight sm:text-sm">{value}</p>
      {sub && (
        <p
          className={cn(
            "mt-0.5 truncate text-[10px] font-medium",
            tone === "warn" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground",
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/**
 * The delivery journey as a stage rail: swipeable on phones, a compact 2-up grid
 * in the desktop side column. Picking a stage stages it for the update form.
 */
function JourneyStepper({
  status,
  selected,
  onSelect,
}: {
  status: ShipmentStatus;
  selected: ShipmentStatus | "";
  onSelect: (status: ShipmentStatus) => void;
}) {
  const currentIdx = SHIPMENT_JOURNEY.indexOf(status);

  return (
    <div
      role="group"
      aria-label="Delivery stages"
      className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-2 lg:overflow-visible"
    >
      {SHIPMENT_JOURNEY.map((stage, idx) => {
        const reached = currentIdx >= 0 && idx <= currentIdx;
        const isCurrent = stage === status;
        const isSelected = selected === stage;
        return (
          <button
            key={stage}
            type="button"
            onClick={() => onSelect(stage)}
            aria-pressed={isSelected}
            className={cn(
              "flex min-w-[104px] shrink-0 flex-col items-start gap-1 rounded-xl border px-2.5 py-2 text-left transition lg:min-w-0",
              isSelected
                ? "border-primary bg-primary/10 shadow-sm"
                : reached
                  ? "border-primary/25 bg-primary/[0.03] hover:border-primary/40"
                  : "border-border bg-card hover:border-primary/30",
            )}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {reached && !isCurrent ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              {isCurrent && (
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">Now</span>
              )}
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold leading-tight",
                reached ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {stage}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Person card: customer account, sender or recipient. */
function PartyCard({
  role,
  icon,
  name,
  email,
  phone,
  address,
  href,
  hrefLabel,
}: {
  role: string;
  icon: React.ReactNode;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <AdminPanel
      title={role}
      icon={icon}
      className="animate-rise-in"
      contentClassName="p-4 space-y-3"
      action={
        href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            {hrefLabel}
            <ArrowRight className="h-3 w-3" />
          </Link>
        ) : undefined
      }
    >
      <p className="text-sm font-semibold leading-tight">{name}</p>
      <div className="space-y-2.5">
        {phone && (
          <ContactLine
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Phone"
            value={
              <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="hover:text-primary hover:underline">
                {phone}
              </a>
            }
          />
        )}
        {email && (
          <ContactLine
            icon={<Mail className="h-3.5 w-3.5" />}
            label="Email"
            value={
              <a href={`mailto:${email}`} className="hover:text-primary hover:underline">
                {email}
              </a>
            }
          />
        )}
        {address && <ContactLine icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={address} />}
      </div>
    </AdminPanel>
  );
}

function ContactLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="break-words text-xs font-medium leading-snug text-foreground">{value}</p>
      </div>
    </div>
  );
}

/** Label/value pair used in the package & cost grid. */
function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-muted/20 p-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {icon && <span className="shrink-0 text-primary/80">{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <p className="break-words text-[13px] font-semibold leading-snug">{value}</p>
    </div>
  );
}
