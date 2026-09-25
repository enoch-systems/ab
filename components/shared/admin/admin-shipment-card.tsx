"use client";

import * as React from "react";
import {
  ChevronRight,
  Clock,
  MapPin,
  Truck,
  Users,
} from "lucide-react";
import { StatusBadge, formatCurrency, formatDate, formatDateTime } from "@/components/shared/status-badge";
import { CopyTrackingId } from "@/components/shared/copy-tracking-id";
import type { Customer, Shipment } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AdminShipmentCardProps {
  shipment: Shipment;
  customer?: Customer;
  onClick?: () => void;
  showCustomer?: boolean;
  showCost?: boolean;
  className?: string;
}

interface MetaProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  align?: "left" | "right";
}

function Meta({ label, value, icon, align = "left" }: MetaProps) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className={cn("text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold flex items-center gap-1", align === "right" && "justify-end")}>
        {icon}
        {label}
      </p>
      {typeof value === "string" ? <p className="text-xs font-semibold truncate mt-0.5 leading-snug">{value}</p> : value}
    </div>
  );
}

/**
 * Mobile-first shipment card. On touch devices the whole card is a large, comfortable target.
 * Shows: tracking number, customer, route, status, ETA, last update, method + optional cost.
 */
export function AdminShipmentCard({
  shipment,
  customer,
  onClick,
  showCustomer = true,
  showCost = true,
  className,
}: AdminShipmentCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border border-border bg-card p-3.5 sm:p-4",
        "hover:border-primary/30 hover:shadow-sm transition active:scale-[0.99]",
        className,
      )}
      aria-label={`View shipment ${shipment.trackingNumber}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <p className="font-mono text-xs sm:text-[13px] font-semibold text-primary truncate">{shipment.trackingNumber}<CopyTrackingId value={shipment.trackingNumber} className="ml-1.5 !h-6 !w-6 !rounded-md" /></p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(shipment.createdAt)}</p>
        </div>
        <StatusBadge status={shipment.status} className="max-w-[9rem] shrink-0 truncate" />
      </div>

      {showCustomer && customer && (
        <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-lg bg-primary/10 text-primary font-serif text-[10px] flex items-center justify-center">
            {customer.fullName[0]}
          </span>
          <span className="text-sm font-medium truncate">{customer.fullName}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0 mb-3">
        <MapPin className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span className="truncate">
          {shipment.origin.split(",")[0]} → <span className="font-medium text-foreground/90">{shipment.destination.split(",")[0]}</span>
        </span>
      </div>

      <div className={cn("grid gap-2.5 pt-3 border-t border-border/60", showCost ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
        <Meta
          label="ETA"
          value={formatDate(shipment.estimatedDelivery)}
          icon={<Clock className="w-3 h-3 opacity-80" />}
        />
        <Meta label="Method" value={shipment.shippingMethod} icon={<Truck className="w-3 h-3 opacity-80" />} />
        {showCost && (
          <Meta
            label="Cost"
            value={formatCurrency(shipment.cost, shipment.currency)}
            align="right"
          />
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground truncate inline-flex items-center gap-1.5">
          <Clock className="w-3 h-3 shrink-0 opacity-80" />
          <span className="truncate">Updated {formatDateTime(shipment.lastUpdated)}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary shrink-0">
          View
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  );
}