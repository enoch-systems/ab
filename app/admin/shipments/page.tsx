"use client";

import React, { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { StatusBadge, formatCurrency, formatDate } from "@/components/shared/status-badge";
import type { ShipmentStatus } from "@/lib/types";
import { AdminPageHeader } from "@/components/shared/admin/admin-page-header";
import { AdminSearch } from "@/components/shared/admin/admin-search";
import { AdminShipmentCard } from "@/components/shared/admin/admin-shipment-card";
import { CopyTrackingId } from "@/components/shared/copy-tracking-id";
import {
  Package, Truck, ChevronLeft, ChevronRight, Send, AlertTriangle,
  X, Filter as FilterIcon, ArrowDownUp, RotateCcw, Plus,
} from "lucide-react";

const STATUS_ORDER: ShipmentStatus[] = [
  "Order Created", "Confirmed", "Picked Up", "In Transit",
  "Arrived at Facility", "Out for Delivery", "Delivered", "Exception",
];

type SortMode = "updated-desc" | "updated-asc" | "eta-asc" | "status";

const STATUSES: (ShipmentStatus | "All")[] = [
  "All",
  "Order Created",
  "Confirmed",
  "Picked Up",
  "In Transit",
  "Arrived at Facility",
  "Out for Delivery",
  "Delivered",
  "Exception",
];

function AdminShipmentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { shipments, customers, adminStats } = useAppState();
  const s = adminStats();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [f, setF] = useState<ShipmentStatus | "All">("All");
  const [sort, setSort] = useState<SortMode>("updated-desc");
  const [sheetOpen, setSheetOpen] = useState(false);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<ShipmentStatus | "All", number>> = { All: shipments.length };
    for (const status of STATUSES.slice(1)) {
      counts[status] = shipments.filter((shipment) => shipment.status === status).length;
    }
    return counts;
  }, [shipments]);

  const list = useMemo(() => {
    return [...shipments]
      .filter((sh) => f === "All" || sh.status === f)
      .filter((sh) => {
        if (!q.trim()) return true;
        const t = q.trim().toLowerCase();
        const cust = customers.find((c) => c.id === sh.customerId);
        return (
          sh.trackingNumber.toLowerCase().includes(t) ||
          sh.destination.toLowerCase().includes(t) ||
          sh.origin.toLowerCase().includes(t) ||
          cust?.fullName.toLowerCase().includes(t) ||
          cust?.email.toLowerCase().includes(t)
        );
      })
      .sort((a, b) => {
        if (sort === "updated-asc") return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
        if (sort === "eta-asc") return new Date(a.estimatedDelivery).getTime() - new Date(b.estimatedDelivery).getTime();
        if (sort === "status") return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      });
  }, [shipments, f, q, customers, sort]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] pb-10 sm:pb-14">
      <AdminPageHeader
        title="Orders"
        subtitle="Manage customer shipments, delivery stages, and fulfilment details."
        actions={
          <>
            <Link
              href="/admin/shipments/new"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Create shipment
            </Link>
            <Link
              href="/admin"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-muted-foreground transition hover:bg-accent/10 hover:text-foreground sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to overview</span>
            </Link>
          </>
        }
      />

      <section className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3" aria-label="Order summary">
        <OrderMetric label="Total" value={s.totalShipments} icon={<Package className="h-4 w-4" />} tone="text-blue-600 dark:text-blue-300 bg-blue-500/10" />
        <OrderMetric label="Active" value={s.active} icon={<Truck className="h-4 w-4" />} tone="text-violet-600 dark:text-violet-300 bg-violet-500/10" />
        <OrderMetric label="Out for delivery" value={s.outForDelivery} icon={<Send className="h-4 w-4" />} tone="text-amber-600 dark:text-amber-300 bg-amber-500/10" />
        <OrderMetric label="Exceptions" value={s.exception} icon={<AlertTriangle className="h-4 w-4" />} tone="text-rose-600 dark:text-rose-300 bg-rose-500/10" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-label="Order filters and search">
        <div className="grid gap-3 p-3.5 sm:p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <AdminSearch
            value={q}
            onChange={setQ}
            placeholder="Search tracking, customer, origin, or destination…"
            className="w-full"
            ariaLabel="Search orders"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
              <span className="sr-only sm:not-sr-only">Sort</span>
              <span className="relative min-w-0 flex-1 sm:flex-none">
                <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortMode)}
                  className="h-10 w-full min-w-0 rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 sm:w-[190px]"
                  aria-label="Sort orders"
                >
                  <option value="updated-desc">Recently updated</option>
                  <option value="updated-asc">Oldest updated</option>
                  <option value="eta-asc">ETA: soonest</option>
                  <option value="status">Status order</option>
                </select>
              </span>
            </label>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3.5 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
              aria-expanded={sheetOpen}
              aria-controls="orders-filter-sheet"
            >
              <FilterIcon className="h-4 w-4" />
              Filters{f !== "All" && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">1</span>}
            </button>
          </div>
        </div>

        <div className="hidden border-t border-border/60 bg-muted/15 px-4 py-3 lg:block">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <StatusFilter
                key={status}
                status={status}
                count={statusCounts[status] ?? 0}
                active={f === status}
                onClick={() => setF(status)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/15 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <FilterIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-sm font-medium">{f === "All" ? "All orders" : f}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span><span className="font-semibold text-foreground">{list.length}</span> results</span>
            {(f !== "All" || q) && (
              <button
                type="button"
                onClick={() => { setF("All"); setQ(""); }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-primary hover:bg-primary/10"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mt-3 hidden items-center justify-between px-1 lg:flex">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{list.length}</span> of {shipments.length} orders
        </p>
        {(f !== "All" || q) && (
          <button
            type="button"
            onClick={() => { setF("All"); setQ(""); }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/10"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Desktop Table */}
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="text-left font-medium px-5 py-3.5">Tracking</th>
                <th className="text-left font-medium px-5 py-3.5">Customer</th>
                <th className="text-left font-medium px-5 py-3.5">Route</th>
                <th className="text-left font-medium px-5 py-3.5">Status</th>
                <th className="text-left font-medium px-5 py-3.5">Method</th>
                <th className="text-left font-medium px-5 py-3.5">Created</th>
                <th className="text-left font-medium px-5 py-3.5">ETA</th>
                <th className="text-right font-medium px-5 py-3.5">Cost</th>
              </tr>
            </thead>
            <tbody>
              {!list.length && (
                <tr>
                  <td colSpan={8} className="h-40 text-center text-sm text-muted-foreground">
                    No shipments match your filters.
                  </td>
                </tr>
              )}
              {list.map((sh) => {
                const cust = customers.find((c) => c.id === sh.customerId);
                return (
                  <tr
                    key={sh.id}
                    onClick={() => router.push(`/admin/shipments/${sh.id}`)}
                    className="group cursor-pointer border-b border-border/40 transition last:border-b-0 hover:bg-muted/35"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-primary">{sh.trackingNumber}<CopyTrackingId value={sh.trackingNumber} className="ml-1.5 !h-6 !w-6 !rounded-md" /></span>
                    </td>
                    <td className="min-w-[190px] px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-serif text-[11px] flex items-center justify-center shrink-0">
                          {cust?.fullName?.[0] || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate leading-tight">{cust?.fullName || "—"}</p>
                          <p className="text-xs text-muted-foreground truncate">{cust?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="min-w-[180px] px-5 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Truck className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span>{sh.origin.split(",")[0]} → {sh.destination.split(",")[0]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={sh.status} /></td>
                    <td className="px-5 py-4 text-muted-foreground">{sh.shippingMethod}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(sh.createdAt)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(sh.estimatedDelivery)}</td>
                    <td className="px-5 py-4 text-right font-medium">{formatCurrency(sh.cost, sh.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile shipment cards */}
      <div className="lg:hidden space-y-2.5">
        {!list.length && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No shipments match.
          </div>
        )}
        {list.map((sh) => (
          <AdminShipmentCard
            key={sh.id}
            shipment={sh}
            customer={customers.find((c) => c.id === sh.customerId)}
            onClick={() => router.push(`/admin/shipments/${sh.id}`)}
          />
        ))}
      </div>

      {/* Mobile filter sheet */}
      {sheetOpen && (
        <div id="orders-filter-sheet" className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-4 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/20" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl">Filter orders</h3>
                <p className="mt-1 text-xs text-muted-foreground">Choose a status to refine the list.</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close filter panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {STATUSES.map((status) => (
                <StatusFilter
                  key={status}
                  status={status}
                  count={statusCounts[status] ?? 0}
                  active={f === status}
                  onClick={() => { setF(status); setSheetOpen(false); }}
                  className="h-11 w-full justify-between !rounded-xl px-4"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-6 h-11 w-full rounded-xl border border-border text-sm font-medium transition hover:bg-muted"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderMetric({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm sm:p-4">
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="font-serif text-xl font-semibold leading-none sm:text-2xl">{value}</p>
        <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function StatusFilter({
  status,
  count,
  active,
  onClick,
  className = "",
}: {
  status: ShipmentStatus | "All";
  count: number;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-xs font-medium transition ${active ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20" : "border-border/70 bg-background text-foreground/80 hover:bg-muted hover:text-foreground"} ${className}`}
    >
      <span>{status}</span>
      <span className={active ? "opacity-80" : "text-muted-foreground"}>{count}</span>
    </button>
  );
}

export default function AdminShipmentsPage() {
  return (
    <Suspense fallback={null}>
      <AdminShipmentsPageContent />
    </Suspense>
  );
}
