"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, formatDate, formatDateTime } from "@/components/shared/status-badge";
import { CopyTrackingId } from "@/components/shared/copy-tracking-id";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Truck, MapPin, Clock, AlertTriangle, Send, Package, ArrowRight, Activity as ActivityIcon,
  Building2, CircleDot, ChevronLeft,
} from "lucide-react";
import type { Shipment, ShipmentStatus } from "@/lib/types";
import { AdminPageHeader } from "@/components/shared/admin/admin-page-header";

const SECTIONS: {
  key: string;
  label: string;
  icon: React.ReactNode;
  tone: string;
  activeTone: string;
  match: (s: Shipment) => boolean;
}[] = [
  {
    key: "active",
    label: "Active",
    icon: <Package className="w-4 h-4" />,
    tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    activeTone:
      "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25 dark:bg-blue-500 dark:border-blue-500",
    match: (s) => s.status !== "Delivered" && s.status !== "Exception",
  },
  {
    key: "transit",
    label: "In Transit",
    icon: <Truck className="w-4 h-4" />,
    tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    activeTone:
      "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-600/25 dark:bg-violet-500 dark:border-violet-500",
    match: (s) => s.status === "In Transit",
  },
  {
    key: "facility",
    label: "At Facility",
    icon: <Building2 className="w-4 h-4" />,
    tone: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
    activeTone:
      "bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-600/25 dark:bg-cyan-500 dark:border-cyan-500",
    match: (s) => s.status === "Arrived at Facility" || s.status === "Confirmed",
  },
  {
    key: "ofd",
    label: "Out for Delivery",
    icon: <Send className="w-4 h-4" />,
    tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    activeTone:
      "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/25 dark:bg-amber-500 dark:border-amber-500",
    match: (s) => s.status === "Out for Delivery",
  },
  {
    key: "delayed",
    label: "Delayed",
    icon: <Clock className="w-4 h-4" />,
    tone: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    activeTone:
      "bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-600/25 dark:bg-orange-500 dark:border-orange-500",
    match: (s) => {
      if (s.status === "Delivered") return false;
      const eta = new Date(s.estimatedDelivery).getTime();
      return Date.now() > eta;
    },
  },
  {
    key: "exception",
    label: "Exceptions",
    icon: <AlertTriangle className="w-4 h-4" />,
    tone: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    activeTone:
      "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/25 dark:bg-rose-500 dark:border-rose-500",
    match: (s) => s.status === "Exception",
  },
];

type SectionKey = (typeof SECTIONS)[number]["key"];

export default function AdminTrackingPage() {
  const router = useRouter();
  const { shipments } = useAppState();
  const [section, setSection] = useState<SectionKey>("active");
  const current = SECTIONS.find((s) => s.key === section)!;

  const count = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of SECTIONS) map[s.key] = shipments.filter(s.match).length;
    return map;
  }, [shipments]);

  const rows = useMemo(() => {
    return shipments
      .filter(current.match)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [shipments, current]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-6 pb-10 sm:pb-14">
      <AdminPageHeader
        title="Tracking Monitor"
        subtitle="Live operational monitoring of active shipments, deliveries and exceptions."
        actions={
          <Link
            href="/admin"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-muted-foreground transition hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
        }
      />

      {/* Section filters — two columns on phones, then progressively wider grids */}
      <div className="mb-4 sm:mb-5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          {SECTIONS.map((s) => {
            const isActive = section === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`min-w-0 rounded-2xl border p-3.5 text-left transition sm:p-4 ${isActive ? `${s.activeTone}` : "bg-card hover:bg-muted/40 border-border"}`}
              >
                <div
                  className={`inline-flex w-9 h-9 rounded-xl items-center justify-center mb-2 ${isActive ? "bg-white/20 text-white" : s.tone}`}
                >
                  {s.icon}
                </div>
                <p
                  className={`text-[10px] leading-tight uppercase tracking-[0.12em] font-semibold sm:text-[11px] sm:tracking-[0.14em] ${isActive ? "text-white/80" : "text-muted-foreground"}`}
                >
                  {s.label}
                </p>
                <p
                  className={`text-2xl sm:text-[28px] font-serif font-semibold leading-none mt-1 ${isActive ? "text-white" : ""}`}
                >
                  {count[s.key] ?? 0}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content card */}
      <Card className="border rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/15 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${section === "all" ? "bg-primary/10 text-primary" : current.tone}`}>
                <ActivityIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <CardTitle className="font-serif text-base sm:text-lg truncate">
                  {current.label} Shipments
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs sm:text-sm truncate">
                  {rows.length} shipments · sorted by most recent update
                </CardDescription>
              </div>
            </div>
            {rows.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Tracking</TableHead>
                  <TableHead>Current Location</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead className="text-right w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!rows.length && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-40 text-center text-muted-foreground text-sm"
                    >
                      <EmptyState label={`No shipments in "${current.label}"`} />
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => router.push(`/admin/shipments/${s.id}`)}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-primary whitespace-nowrap">
                      {s.trackingNumber}
                      <CopyTrackingId value={s.trackingNumber} className="ml-1.5 !h-6 !w-6 !rounded-md" />
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                        <span className="truncate">{s.currentLocation}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{s.destination}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(s.lastUpdated)}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(s.estimatedDelivery)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards — destination-focused operational cards */}
          <div className="divide-y divide-border/60 lg:hidden">
            {!rows.length && (
              <div className="p-8 sm:p-10">
                <EmptyState label={`No shipments in "${current.label}"`} />
              </div>
            )}
            {rows.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/admin/shipments/${s.id}`)}
                className="w-full text-left p-4 hover:bg-muted/20 transition active:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0">
                    <CircleDot className="w-3 h-3" />
                    <span className="font-mono tracking-tight">{s.trackingNumber}</span>
                    <CopyTrackingId value={s.trackingNumber} className="!h-5 !w-5 !rounded-md" />
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                {/* Current loc → Destination route */}
                <div className="relative pl-6 mb-3">
                  <div className="absolute left-2 top-1.5 bottom-1.5 w-[2px] bg-border/80 rounded-full" />
                  <div className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-emerald-500/15 border-2 border-card flex items-center justify-center">
                    <MapPin className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="absolute left-0 bottom-0.5 w-4 h-4 rounded-full bg-primary/15 border-2 border-card flex items-center justify-center">
                    <MapPin className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <div className="space-y-3.5">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-0.5">
                        Current
                      </p>
                      <p className="text-sm font-semibold truncate leading-snug">
                        {s.currentLocation}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-0.5">
                        Destination
                      </p>
                      <p className="text-sm font-semibold truncate leading-snug">{s.destination}</p>
                    </div>
                  </div>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-border/60 pt-3 sm:grid-cols-3">
                  <div>
                    <p className="uppercase tracking-[0.12em] text-muted-foreground font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated
                    </p>
                    <p className="font-semibold mt-1 text-foreground leading-snug">
                      {formatDate(s.lastUpdated)}
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.12em] text-muted-foreground font-semibold flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Method
                    </p>
                    <p className="font-semibold mt-1 text-foreground leading-snug">
                      {s.shippingMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="uppercase tracking-[0.12em] text-muted-foreground font-semibold flex items-center gap-1 justify-end">
                      ETA
                    </p>
                    <p className="font-semibold mt-1 text-primary leading-snug">
                      {formatDate(s.estimatedDelivery)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
        <Package className="w-6 h-6 text-muted-foreground/70" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
        Shipments will appear here when they match this category.
      </p>
    </div>
  );
}
