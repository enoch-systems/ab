"use client";

import * as React from "react";
import type { Shipment, ShipmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { routeProgress, routeStageCaption } from "@/lib/shipment-progress";
import { AlertTriangle, CircleDot, Flag, Truck } from "lucide-react";

const TONES = {
  moving: {
    bar: "from-primary via-cyan-400 to-emerald-400",
    marker: "from-primary to-cyan-500 shadow-primary/30",
    halo: "bg-primary/25",
  },
  delivered: {
    bar: "from-emerald-500 via-emerald-400 to-emerald-300",
    marker: "from-emerald-600 to-emerald-400 shadow-emerald-500/30",
    halo: "bg-emerald-500/25",
  },
  exception: {
    bar: "from-rose-500 via-rose-400 to-amber-400",
    marker: "from-rose-600 to-rose-400 shadow-rose-500/30",
    halo: "bg-rose-500/25",
  },
} as const;

/**
 * "Live / Complete / Delayed" pill with a pulsing dot and a shimmer sweep.
 *
 * Rendered on the operations console *and* the public tracking page so a
 * customer sees exactly the state an operator is looking at.
 */
export function RouteStatusChip({ status, className }: { status: ShipmentStatus; className?: string }) {
  const delivered = status === "Delivered";
  const exception = status === "Exception";

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-2.5 py-1 text-[11px] font-semibold",
        delivered
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
          : exception
            ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
            : "bg-primary/10 text-primary",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {delivered ? "Complete" : exception ? "Delayed" : "Live"}
      {!delivered && !exception && (
        <span
          aria-hidden
          className="animate-shimmer-sweep pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/20"
        />
      )}
    </span>
  );
}

interface ShipmentRouteRailProps {
  shipment: Shipment;
  className?: string;
}


/**
 * Origin → animated route rail → destination, with the completion percentage and
 * the current-leg caption underneath.
 *
 * The percentage comes from the shipment's status (`routeProgress`), never from
 * the number of stamped scans, so the operator console and the public tracker
 * always report the same progress for the same parcel. Pass `children` for
 * anything that belongs directly under the caption.
 */
export function ShipmentRouteRail({
  shipment,
  className,
  children,
}: React.PropsWithChildren<ShipmentRouteRailProps>) {
  const progress = routeProgress(shipment);
  const delivered = shipment.status === "Delivered";
  const exception = shipment.status === "Exception";
  const tone = exception ? TONES.exception : delivered ? TONES.delivered : TONES.moving;
  const settled = delivered || progress >= 100;

  return (
    <div className={className}>
      {/* Origin and destination */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CircleDot className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Origin</p>
            <p className="truncate text-sm font-semibold leading-tight sm:text-base">
              {shipment.sender.city}, {shipment.sender.country}
            </p>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{shipment.sender.address}</p>
          </div>
        </div>

        <div className="flex min-w-0 items-start justify-end gap-2.5 text-right">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Destination
            </p>
            <p className="truncate text-sm font-semibold leading-tight sm:text-base">
              {shipment.recipient.city}, {shipment.recipient.country}
            </p>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{shipment.recipient.address}</p>
          </div>
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Flag className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Rail: filled = covered, dashed = still to run, marker = the parcel now */}
      <div className="relative mt-5 flex h-14 items-center sm:h-16" aria-hidden>
        <div className="relative mx-5 flex-1 sm:mx-8">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
            <span
              className={cn("route-dash-forward absolute inset-0 text-muted-foreground/35", settled && "opacity-0")}
            />
            <span
              className={cn(
                "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-[width] duration-1000 ease-out",
                tone.bar,
              )}
              style={{ width: `${progress}%` }}
            >
              <span className="absolute inset-0 overflow-hidden rounded-full">
                <span className="animate-rail-sheen absolute inset-y-0 w-1/2 bg-white/50 blur-[2px]" />
              </span>
            </span>
          </div>

          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-1000 ease-out"
            style={{ left: `${progress}%` }}
          >
            <span className={cn("absolute inset-0 rounded-full", tone.halo, !settled && "animate-pulse-halo")} />
            <span
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-card bg-gradient-to-br text-white shadow-lg sm:h-11 sm:w-11",
                tone.marker,
                !settled && !exception && "animate-idler-bob",
              )}
            >
              {exception ? (
                <AlertTriangle className="h-4 w-4" />
              ) : delivered ? (
                <Flag className="h-4 w-4" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Progress caption */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] text-muted-foreground sm:text-xs" role="status" aria-live="polite">
          <span className="font-mono font-semibold text-foreground">{progress}%</span> of route completed
        </p>
        <p className="text-[11px] text-muted-foreground sm:text-xs">
          {routeStageCaption(shipment.status, shipment.currentLocation)}
        </p>
      </div>

      {children}
    </div>
  );
}
