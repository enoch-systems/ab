"use client";

import * as React from "react";
import type { Shipment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AdminPanel } from "@/components/shared/admin/admin-panel";
import { RouteStatusChip, ShipmentRouteRail } from "@/components/shared/shipment-route-rail";
import { Navigation } from "lucide-react";

interface ShipmentRouteProgressProps {
  shipment: Shipment;
  /** Extra content rendered under the rail (key facts, live captions, …). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Operator console wrapper around the shared route rail.
 *
 * The rail, the completion percentage, the current-leg caption and the
 * "Live / Complete / Delayed" chip all come from the same modules the public
 * /track page renders, so what an operator sees is what the customer sees —
 * only the chrome (admin panel + key facts slot) differs.
 */
export function ShipmentRouteProgress({ shipment, children, className }: ShipmentRouteProgressProps) {
  return (
    <AdminPanel
      title="Live route"
      icon={<Navigation className="h-4 w-4" />}
      className={cn("bg-gradient-to-br from-primary/[0.04] via-card to-cyan-500/[0.05]", className)}
      contentClassName="p-4 sm:p-6"
      action={<RouteStatusChip status={shipment.status} />}
    >
      <ShipmentRouteRail shipment={shipment}>
        {children && <div className="mt-4 border-t border-border/70 pt-4">{children}</div>}
      </ShipmentRouteRail>
    </AdminPanel>
  );
}
