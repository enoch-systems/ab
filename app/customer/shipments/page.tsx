"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, formatCurrency, formatDate, formatDateTime } from "@/components/shared/status-badge";
import type { ShipmentStatus } from "@/lib/types";
import { Package, Search, ArrowRight, Truck, Filter, FolderKanban, ChevronLeft } from "lucide-react";
import { CopyTrackingId } from "@/components/shared/copy-tracking-id";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function CustomerShipmentsPage() {
  const router = useRouter();
  const { session, shipmentsByCustomer, shipmentStatsByCustomer } = useAppState();
  const all = shipmentsByCustomer(session?.userId || "");
  const stats = shipmentStatsByCustomer(session?.userId || "");
  const [q, setQ] = useState("");
  const [f, setF] = useState<ShipmentStatus | "All">("All");

  const shipments = useMemo(() => {
    return [...all]
      .filter((s) => f === "All" || s.status === f)
      .filter((s) => {
        if (!q.trim()) return true;
        const qt = q.trim().toLowerCase();
        return (
          s.trackingNumber.toLowerCase().includes(qt) ||
          s.origin.toLowerCase().includes(qt) ||
          s.destination.toLowerCase().includes(qt) ||
          s.shippingMethod.toLowerCase().includes(qt)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [all, q, f]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4 h-9 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>

        <div className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em]">
          <span className="text-muted-foreground">Account</span>
          <span className="text-muted-foreground/70">/</span>
          <span className="text-primary">Shipments</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl tracking-tight">My Shipments</h1>
            <p className="text-muted-foreground">
              {stats.total} total · {stats.active} active · {stats.delivered} delivered
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 sm:w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 rounded-full" placeholder="Search tracking, origin, destination…" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setF(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
              f === s
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-muted/40 hover:bg-muted text-muted-foreground"
            }`}
          >
            {s}
            <span className="ml-1.5 opacity-70">
              {s === "All" ? stats.total :
               s === "Order Created" ? stats.pending :
               s === "Delivered" ? stats.delivered :
               s === "Exception" ? stats.exception :
               stats.active}
            </span>
          </button>
        ))}
      </div>

      <Card className="boty-shadow border overflow-hidden">
        <CardHeader className="border-b hidden sm:flex sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="font-serif text-lg flex items-center gap-2"><FolderKanban className="w-4 h-4 text-primary" />All Shipments</CardTitle>
          <CardDescription>{shipments.length} of {all.length} shown</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    No shipments match your filters.
                  </TableCell></TableRow>
                )}
                {shipments.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => router.push(`/customer/shipments/${s.id}`)}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">{s.trackingNumber}<CopyTrackingId value={s.trackingNumber} className="ml-2 inline-flex align-middle" /></TableCell>
                    <TableCell className="min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="text-sm min-w-0">
                          <p className="truncate">{s.origin} → {s.destination}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-sm">{s.shippingMethod}</TableCell>
                    <TableCell className="text-sm">{formatDate(s.createdAt)}</TableCell>
                    <TableCell className="text-sm">{formatDate(s.estimatedDelivery)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCurrency(s.cost, s.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden divide-y">
            {shipments.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">No shipments match your filters.</div>
            )}
            {shipments.map((s) => (
              <button key={s.id} onClick={() => router.push(`/customer/shipments/${s.id}`)} className="w-full text-left p-4 hover:bg-muted/20 transition">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-mono text-xs font-semibold text-primary">{s.trackingNumber}<CopyTrackingId value={s.trackingNumber} className="ml-2 inline-flex align-middle" /></span>
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex items-center gap-2 text-sm mb-3"><Truck className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{s.origin} → {s.destination}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                  <p className="text-[10px] uppercase tracking-wide">Method</p>
                  <p className="text-foreground font-medium">{s.shippingMethod}</p>
                  </div>
                  <div>
                  <p className="text-[10px] uppercase tracking-wide">Created</p>
                  <p className="text-foreground font-medium">{formatDate(s.createdAt)}</p>
                  </div>
                  <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide">Cost</p>
                  <p className="text-foreground font-medium">{formatCurrency(s.cost, s.currency)}</p>
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
