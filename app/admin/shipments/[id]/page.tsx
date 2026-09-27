"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ADMIN_TYPE } from "@/components/shared/admin/admin-type";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Banknote, Building2, Check, CheckCircle2, ChevronDown,
  CircleDot, Clock, Edit3, Hash, History, Loader2, Mail, MapPin, Package, Phone, Scale, Send,
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
    <div className="mx-auto w-full min-w-0 max-w-6xl pb-2">
      <AdminBreadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Orders", href: "/admin/shipments" },
          { label: shipment.trackingNumber },
        ]}
      />

      {/* Header — identity on one row, then the title, the one meta line and the two actions */}
      <header className="mb-4 sm:mb-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-full lg:hidden">
            <Link href="/admin/shipments" aria-label="Back to orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <AdminIdPill value={shipment.trackingNumber} icon={<Hash className="h-3 w-3" />} />
          <CopyTrackingId value={shipment.trackingNumber} />
          <StatusBadge status={shipment.status} />
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
              Shipment Operations
            </h1>
            <p className={cn(ADMIN_TYPE.meta, "mt-1.5")}>
              <span className="font-medium text-foreground/80">
                {shipment.shippingMethod} · {shipment.origin} → {shipment.destination}
              </span>
              {" · "}
              Updated {lastUpdatedLabel ?? formatDateTime(shipment.lastUpdated)}
            </p>
          </div>

          {/* Primary action first, equal halves on phones so both stay aligned */}
          <div className="grid grid-cols-2 gap-2 sm:w-auto sm:shrink-0">
            <Button
              type="button"
              onClick={() => setStatusOpen(true)}
              className="h-11 rounded-xl bg-gradient-to-r from-primary to-cyan-500 px-3 font-semibold text-white shadow-md shadow-primary/20 sm:px-4"
            >
              <Edit3 className="mr-2 h-4 w-4" /> Update status
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl px-3 sm:px-4">
              <Link href={`/track/${shipment.trackingNumber}`}>
                Public view
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 1 · Where is it right now — the live rail plus the two live facts nothing else repeats */}
      <ShipmentRouteProgress shipment={shipment} className="animate-rise-in mb-4 sm:mb-5">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
          <LiveFact
            icon={<Clock className="h-3.5 w-3.5" />}
            label="ETA"
            value={formatDate(shipment.estimatedDelivery)}
            sub={etaSubLabel ?? undefined}
            tone={etaOverdue ? "warn" : "default"}
          />
          <LiveFact
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Current location"
            value={shipment.currentLocation}
          />
        </dl>
      </ShipmentRouteProgress>

      {/* 2 · Cockpit — the live timeline sits next to the address & location controls */}
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-12">
        <AdminPanel
          title="Tracking timeline"
          icon={<Truck className="h-4 w-4" />}
          className="animate-rise-in lg:col-span-7"
          contentClassName="p-3 sm:p-5"
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusOpen(true)}
              className="h-9 gap-1.5 rounded-lg px-3 text-xs font-semibold"
            >
              <Edit3 className="h-3.5 w-3.5" /> Update
            </Button>
          }
        >
          <div className="mb-3 flex items-center gap-3 px-1">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-[width] duration-700 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <span className={cn(ADMIN_TYPE.help, "shrink-0 font-mono font-semibold")}>
              <span className="text-foreground">
                {completedScans}/{scanCount}
              </span>{" "}
              scans
            </span>
          </div>
          <TrackingTimeline events={shipment.trackingEvents} animate flashIds={flashIds} />
        </AdminPanel>

        <AdminPanel
          title="Address & location"
          subtitle="No lookup required — any clear location works."
          icon={<MapPin className="h-4 w-4" />}
          className="animate-rise-in lg:col-span-5"
          contentClassName="p-4 sm:p-5"
        >
          <div className="space-y-3.5">
            <div className="space-y-2">
              <label
                htmlFor="order-destination"
                className={cn(ADMIN_TYPE.label, "block")}
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
                className={cn(ADMIN_TYPE.label, "block")}
              >
                Delivery address
              </label>
              <Textarea
                id="order-address"
                value={drafts.address}
                onChange={(event) => setDrafts((d) => ({ ...d, address: event.target.value }))}
                maxLength={240}
                rows={2}
                className="resize-y rounded-xl text-base sm:text-sm"
                placeholder="Street, suite, city"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="order-current-location"
                className={cn(ADMIN_TYPE.label, "block")}
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

      {/* 3 · People on this order */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
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

      {/* 4 · Package, cost and the images that travelled with it */}
      <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-12">
        <AdminPanel
          title="Package & cost"
          subtitle={`${shipment.packageCount} × ${shipment.packageType} · ${shipment.shippingMethod}`}
          icon={<Package className="h-4 w-4" />}
          className={cn(
            "animate-rise-in",
            shipment.images?.length ? "lg:col-span-7" : "lg:col-span-12",
          )}
          contentClassName="p-4 sm:p-5 space-y-4"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5">
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
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className={cn(ADMIN_TYPE.label, "mb-1 text-amber-700 dark:text-amber-300")}>
                Handling instructions
              </p>
              <p className="text-[13px] leading-relaxed text-amber-900 dark:text-amber-100">
                {shipment.instructions}
              </p>
            </div>
          )}
        </AdminPanel>

        {shipment.images && shipment.images.length > 0 && (
          <AdminPanel
            title="Product & packing images"
            subtitle={`${shipment.images.length} uploaded with this order`}
            icon={<Package className="h-4 w-4" />}
            className="animate-rise-in lg:col-span-5"
            contentClassName="p-3 sm:p-4"
          >
            <div className="grid grid-cols-3 gap-2">
              {shipment.images.map((image) => (
                <a
                  key={image.id}
                  href={image.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group block overflow-hidden rounded-xl border border-border/70"
                >
                  <img
                    src={image.publicUrl}
                    alt={image.altText}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                  />
                </a>
              ))}
            </div>
          </AdminPanel>
        )}
      </div>

      {/* Status update dialog — everything behind it stays blurred while it's open */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto overscroll-contain sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center sm:justify-start">
              <Edit3 className="h-5 w-5 text-primary" />
              Update status
            </DialogTitle>
            <DialogDescription>Timeline, notifications and analytics update instantly.</DialogDescription>
          </DialogHeader>
          <form onSubmit={apply} className="space-y-4">
            {/* Phones: a 7-stage rail plus a chip row is nothing but sideways scrolling,
                so both collapse into one grouped chooser. */}
            <div className="sm:hidden">
              <MobileStatusChooser
                current={shipment.status}
                value={next}
                onSelect={setNext}
                quickActions={quickActions}
              />
            </div>

            {/* Tablet and up: the full journey rail, with the quick actions underneath */}
            <div className="hidden sm:block">
              <JourneyStepper status={shipment.status} selected={next} onSelect={setNext} />
            </div>

            {quickActions.length > 0 && (
              <div className="hidden flex-wrap gap-2 sm:flex">
                {quickActions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    onClick={() => setNext(action.status)}
                    aria-pressed={next === action.status}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full border bg-card px-3 text-xs font-semibold transition",
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

            {/* Tablet and up keep the labelled select — phones pick from the chooser above */}
            <div className="hidden space-y-2 sm:block">
              <label
                htmlFor="next-status"
                className={cn(ADMIN_TYPE.label, "block")}
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
                className={cn(ADMIN_TYPE.label, "block")}
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
                <p className={cn(ADMIN_TYPE.valueSmall, "flex flex-wrap items-center gap-1.5 font-semibold tracking-tight")}>
                  {shipment.status}
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  {pendingPreview.status}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Recorded at <span className="font-medium text-foreground">{pendingPreview.location}</span> ·
                  route moves to{" "}
                  <span className="font-mono font-semibold text-primary">{pendingPreview.progress}%</span> ·{" "}
                  {customer?.fullName ?? "the customer"} is notified.
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
              {next && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => {
                    setNext("");
                    setLocation("");
                  }}
                >
                  Clear
                </Button>
              )}
              <Button
                type="submit"
                disabled={applying || !next}
                className="h-11 rounded-xl bg-gradient-to-r from-primary to-cyan-500 px-6 font-semibold text-white shadow-md shadow-primary/20"
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

/**
 * Phone-sized status chooser.
 *
 * A 7-stage rail plus a chip row is two long lines of small targets on a narrow
 * screen, so on phones both collapse into one grouped menu: quick actions first,
 * then the remaining journey stages, then the exception branch.
 */
function MobileStatusChooser({
  current,
  value,
  onSelect,
  quickActions,
}: {
  current: ShipmentStatus;
  value: ShipmentStatus | "";
  onSelect: (status: ShipmentStatus) => void;
  quickActions: { status: ShipmentStatus; label: string; tone: string }[];
}) {
  const quick = new Set(quickActions.map((action) => action.status));
  const journey = SHIPMENT_JOURNEY.filter((stage) => stage !== current && !quick.has(stage));
  const others = ALL_SHIPMENT_STATUSES.filter(
    (status) => status !== current && !quick.has(status) && !SHIPMENT_JOURNEY.includes(status),
  );

  const menuItem = (status: ShipmentStatus, label: string) => (
    <DropdownMenuItem key={status} onSelect={() => onSelect(status)} className="gap-2 py-2">
      <StatusIcon status={status} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {value === status && <Check className="h-3.5 w-3.5 text-primary" />}
    </DropdownMenuItem>
  );

  return (
    <div className="space-y-2">
      <label
        htmlFor="next-status-mobile"
        className={cn(ADMIN_TYPE.label, "block")}
      >
        New status
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            id="next-status-mobile"
            type="button"
            variant="outline"
            className="h-11 w-full justify-between rounded-xl px-3"
          >
            <span className="flex min-w-0 items-center gap-2">
              {value ? (
                <>
                  <StatusIcon status={value} />
                  <span className="truncate text-sm font-semibold">{value}</span>
                </>
              ) : (
                <span className="truncate text-sm font-normal text-muted-foreground">
                  Choose next status…
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-(--radix-dropdown-menu-trigger-width) min-w-0"
        >
          {quickActions.length > 0 && (
            <>
              <DropdownMenuLabel className={ADMIN_TYPE.labelMicro}>
                Quick actions
              </DropdownMenuLabel>
              {quickActions.map((action) => menuItem(action.status, action.label))}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel className={ADMIN_TYPE.labelMicro}>
            Delivery journey
          </DropdownMenuLabel>
          {journey.map((stage) => menuItem(stage, stage))}
          {others.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {others.map((status) => menuItem(status, status))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-muted-foreground">
        Current status <span className="font-semibold text-foreground">{current}</span>
      </p>
    </div>
  );
}

/**
 * One live fact inside the route panel: label and value on one line on phones,
 * a tidy stacked pair from `sm` up. Kept flat on purpose — the panels further
 * down the page carry the full reference data.
 */
function LiveFact({
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
    <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-border/60 pt-2 first:border-t-0 first:pt-0 sm:block sm:border-t-0 sm:pt-0">
      <dt className={cn(ADMIN_TYPE.label, "flex min-w-0 items-center gap-1.5")}>
        <span className="shrink-0 text-primary/80">{icon}</span>
        <span className="truncate">{label}</span>
      </dt>
      <dd className={cn(ADMIN_TYPE.valueLarge, "min-w-0 text-right sm:mt-1 sm:text-left sm:text-base")}>
        <span className="block truncate">{value}</span>
        {sub && (
          <span
            className={cn(
              "mt-0.5 block truncate text-[11px] font-medium",
              tone === "warn" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground",
            )}
          >
            {sub}
          </span>
        )}
      </dd>
    </div>
  );
}

/**
 * The delivery journey as a stage rail. Rendered from `sm` up (phones use
 * `MobileStatusChooser`) as a grid, so all seven stages stay visible instead of
 * scrolling sideways. Picking a stage stages it for the update form.
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
      className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4"
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
              "flex min-w-0 flex-col items-start gap-1 rounded-xl border px-2.5 py-2 text-left transition",
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
                <span className={cn(ADMIN_TYPE.labelMicro, "font-bold text-primary")}>Now</span>
              )}
            </span>
            <span
              className={cn(
                "text-xs font-semibold leading-tight",
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
      <p className={ADMIN_TYPE.valueLarge}>{name}</p>
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

/** One contact on a person card: label on the left, value on the right. */
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
    <div className="flex min-w-0 items-baseline gap-2">
      <span className={cn(ADMIN_TYPE.label, "flex w-[5.25rem] shrink-0 items-center gap-1.5")}>
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <span className={cn(ADMIN_TYPE.valueSmall, "min-w-0 flex-1 break-words")}>
        {value}
      </span>
    </div>
  );
}

/** Label/value pair used in the package & cost grid: a row on phones, a box from `sm` up. */
function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2 sm:block sm:p-2.5">
      <div className={cn(ADMIN_TYPE.label, "flex min-w-0 items-center gap-1.5 sm:mb-1.5")}>
        {icon && <span className="shrink-0 text-primary/80">{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <p className="min-w-0 break-words text-right text-sm font-semibold leading-snug text-foreground sm:text-left">
        {value}
      </p>
    </div>
  );
}
