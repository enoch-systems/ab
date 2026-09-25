"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/lib/app-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, formatCurrency, formatDate, formatDateTime } from "@/components/shared/status-badge";
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
  Users, Mail, Phone, MapPin, ArrowLeft, Package, CreditCard, Activity as ActivityIcon,
  TrendingUp, ArrowRight, Calendar, Shield, Globe2, Hash, ChevronRight,
} from "lucide-react";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const { customers, shipmentsByCustomer, shipmentStatsByCustomer, recentActivity } = useAppState();
  const c = customers.find((x) => x.id === id);
  const stats = shipmentStatsByCustomer(id);
  const userShipments = shipmentsByCustomer(id);
  const total = userShipments.reduce((a, s) => a + s.cost, 0);
  const activity = recentActivity(12).filter(
    (a) => a.customerId === id || a.referenceId === id,
  );

  if (!c) {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-12 sm:py-16 text-center">
        <Card className="border rounded-2xl shadow-sm">
          <CardContent className="pt-10 pb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <h1 className="font-serif text-2xl mb-2">User Not Found</h1>
            <p className="text-muted-foreground text-sm mb-5">
              This customer does not exist or has been removed.
            </p>
            <Button asChild variant="outline" className="rounded-full h-11">
              <Link href="/admin/users">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pb-10 sm:pb-14">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 mt-1">
        <Link href="/admin" className="hover:text-foreground transition">
          Dashboard
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/admin/users" className="hover:text-foreground transition">
          Users
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate">{c.fullName}</span>
      </div>

      {/* Header / identity card */}
      <Card className="border rounded-2xl shadow-sm mb-4 sm:mb-5 overflow-hidden bg-gradient-to-br from-primary/[0.035] via-background to-cyan-500/[0.04]">
        <CardContent className="pt-5 sm:pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5 sm:mb-6">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <Button asChild variant="outline" size="sm" className="rounded-full h-10 w-10 p-0 shrink-0">
                <Link href="/admin/users" aria-label="Back">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 text-primary font-serif text-2xl sm:text-3xl flex items-center justify-center border border-primary/15 shrink-0 shadow-sm">
                  {c.fullName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl tracking-tight leading-tight truncate">
                      {c.fullName}
                    </h1>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                        c.accountStatus === "Active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                      }`}
                    >
                      {c.accountStatus}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">{c.email}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span className="truncate">{c.phone}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {c.city}, {c.country}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button asChild variant="outline" size="sm" className="rounded-full h-11 flex-1 sm:flex-none">
                <Link href="/admin/shipments">
                  View all orders <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* 2×2+ stat grid compact */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            <MiniStat label="Total Shipments" value={String(stats.total)} icon={<Package className="w-3.5 h-3.5" />} tone="bg-primary/10 text-primary" />
            <MiniStat label="Delivered" value={String(stats.delivered)} icon={<TrendingUp className="w-3.5 h-3.5" />} tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
            <MiniStat label="Active" value={String(stats.active)} icon={<Package className="w-3.5 h-3.5" />} tone="bg-violet-500/10 text-violet-600 dark:text-violet-400" />
            <MiniStat label="Exceptions" value={String(stats.exception)} icon={<ActivityIcon className="w-3.5 h-3.5" />} tone="bg-rose-500/10 text-rose-600 dark:text-rose-400" />
            <MiniStat label="Total Spend" value={formatCurrency(total, "USD")} icon={<CreditCard className="w-3.5 h-3.5" />} tone="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" span2OnMobile />
          </div>
        </CardContent>
      </Card>

      {/* Section cards in order */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
        {/* Left column sections */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          {/* Section 1: Profile */}
          <SectionCard title="Customer Profile" icon={<Users className="w-4 h-4" />} subtitle="Personal and contact information">
            <div className="space-y-3.5">
              <InfoRow label="Full Name" value={c.fullName} />
              <InfoRow label="Email" value={c.email} icon={<Mail className="w-3.5 h-3.5" />} />
              <InfoRow label="Phone" value={c.phone} icon={<Phone className="w-3.5 h-3.5" />} />
              <InfoRow label="Street Address" value={c.address} icon={<MapPin className="w-3.5 h-3.5" />} />
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-border/60 sm:grid-cols-3">
              <SmallInfo label="City" value={c.city} />
              <SmallInfo label="State" value={c.state} />
              <SmallInfo label="Country" value={c.country} />
            </div>
          </SectionCard>

          {/* Section 2: Account Info */}
          <SectionCard title="Account Information" icon={<Shield className="w-4 h-4" />} subtitle="Account status, created & last active">
            <div className="space-y-3.5">
              <InfoRow label="Customer ID" value={c.id} mono />
              <InfoRow label="Registered" value={formatDate(c.createdAt)} icon={<Calendar className="w-3.5 h-3.5" />} />
              <InfoRow label="Last Active" value={formatDateTime(c.lastActive)} icon={<ActivityIcon className="w-3.5 h-3.5" />} />
              <InfoRow label="Account Status" value={c.accountStatus} />
              <InfoRow label="Shipments" value={`${stats.total} total · ${stats.active} active`} icon={<Package className="w-3.5 h-3.5" />} />
            </div>
          </SectionCard>

          {/* Section 3: Shipment Stats (KPI deep) */}
          <SectionCard title="Shipment Statistics" icon={<TrendingUp className="w-4 h-4" />} subtitle={`Aggregated stats across ${stats.total} shipments`}>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <StatTile value={String(stats.total)} label="Total" tone="bg-primary/10 text-primary" />
              <StatTile value={String(stats.delivered)} label="Delivered" tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
              <StatTile value={String(stats.active)} label="Active" tone="bg-violet-500/10 text-violet-600 dark:text-violet-400" />
              <StatTile value={String(stats.exception)} label="Exceptions" tone="bg-rose-500/10 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-medium">Success Rate</span>
                  <span className="font-mono text-foreground font-semibold">
                    {stats.total
                      ? Math.round((stats.delivered / Math.max(1, stats.delivered + stats.exception)) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${stats.total ? Math.round((stats.delivered / Math.max(1, stats.delivered + stats.exception)) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <SmallInfo label="Total Revenue" value={formatCurrency(total, "NGN")} />
                <SmallInfo
                  label="Avg. Order"
                  value={formatCurrency(Math.round(total / Math.max(1, stats.total)), "NGN")}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right column sections */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* Section 4: Shipment History */}
          <SectionCard
            title={`Shipment History (${userShipments.length})`}
            icon={<Package className="w-4 h-4" />}
            subtitle="Click a shipment to open details"
            action={
              <Button asChild variant="ghost" size="sm" className="rounded-full h-8 text-xs">
                <Link href="/admin/shipments">
                  All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            }
          >
            <div className="-mx-2 sm:-mx-4 -mt-1">
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!userShipments.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                          No shipments yet for this customer.
                        </TableCell>
                      </TableRow>
                    )}
                    {userShipments.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => router.push(`/admin/shipments/${s.id}`)}
                      >
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {s.trackingNumber}
                          <CopyTrackingId value={s.trackingNumber} className="ml-1.5 !h-6 !w-6 !rounded-md" />
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.origin.split(",")[0]} → {s.destination.split(",")[0]}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} />
                        </TableCell>
                        <TableCell className="text-sm">{s.shippingMethod}</TableCell>
                        <TableCell className="text-sm">{formatDate(s.createdAt)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(s.cost, s.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden divide-y divide-border/60">
                {!userShipments.length && (
                  <div className="p-8 sm:p-10 text-center text-muted-foreground text-sm">
                    No shipments yet.
                  </div>
                )}
                {userShipments.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/admin/shipments/${s.id}`)}
                    className="w-full text-left p-4 sm:p-4.5 hover:bg-muted/25 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                        <Hash className="w-3 h-3" />
                        <span className="font-mono">{s.trackingNumber}</span>
                        <CopyTrackingId value={s.trackingNumber} className="!h-5 !w-5 !rounded-md" />
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Globe2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">
                        {s.origin.split(",")[0]} → {s.destination.split(",")[0]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
                      <div>
                        <p className="uppercase tracking-[0.12em] text-muted-foreground font-semibold">
                          Method
                        </p>
                        <p className="font-semibold mt-0.5 text-foreground">{s.shippingMethod}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-[0.12em] text-muted-foreground font-semibold">
                          Created
                        </p>
                        <p className="font-semibold mt-0.5 text-foreground">{formatDate(s.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="uppercase tracking-[0.12em] text-muted-foreground font-semibold">
                          Cost
                        </p>
                        <p className="font-semibold mt-0.5 text-primary">
                          {formatCurrency(s.cost, s.currency)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Section 5: Recent Activity */}
          <SectionCard
            title={`Recent Activity (${activity.length})`}
            icon={<ActivityIcon className="w-4 h-4" />}
            subtitle="Chronological audit trail for this customer"
          >
            <div className="-mx-2 sm:-mx-4 -mt-1">
              <div className="relative">
                <div className="absolute left-[22px] sm:left-[26px] top-3 bottom-3 w-[2px] bg-border/70 rounded-full" />
                <ul className="space-y-1">
                  {!activity.length && (
                    <li className="p-6 sm:p-8 text-center text-muted-foreground text-sm">
                      No recent activity for this customer.
                    </li>
                  )}
                  {activity.map((a) => (
                    <li key={a.id} className="relative flex items-start gap-3 sm:gap-4 px-2 sm:px-4 py-3 sm:py-3.5">
                      <div className="shrink-0 relative z-10 mt-0.5 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border-2 border-card shadow-sm">
                        <ActivityIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug">{a.action}</p>
                          <span className="max-w-full text-[11px] text-muted-foreground sm:whitespace-nowrap">
                            {formatDateTime(a.timestamp)}
                          </span>
                        </div>
                        {a.details && (
                          <p className="text-xs text-muted-foreground mt-1 leading-snug">{a.details}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted font-mono text-muted-foreground">
                            {a.type}
                          </span>
                          {a.referenceId && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono truncate max-w-[60%]">
                              ref {a.referenceId}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
  tone,
  span2OnMobile,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
  span2OnMobile?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card dark:bg-muted/10 p-3 sm:p-3.5 ${span2OnMobile ? "col-span-2 sm:col-span-1" : ""}`}
    >
      <div className="flex items-center gap-3">
        <span className={`inline-flex w-9 h-9 rounded-xl items-center justify-center shrink-0 ${tone}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] sm:text-base font-serif font-semibold leading-tight truncate">
            {value}
          </p>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mt-0.5 truncate">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-muted/10 px-5 sm:px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-9 h-9 rounded-xl bg-primary/10 text-primary items-center justify-center shrink-0">
              {icon}
            </span>
            <div className="min-w-0">
              <CardTitle className="font-serif text-base sm:text-lg leading-tight truncate">
                {title}
              </CardTitle>
              {subtitle && (
                <CardDescription className="mt-0.5 text-xs sm:text-sm truncate">
                  {subtitle}
                </CardDescription>
              )}
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}

function StatTile({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border ${tone} p-3.5`}>
      <p className="text-2xl font-serif font-semibold leading-tight">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.14em] font-semibold opacity-85 mt-0.5">
        {label}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-muted-foreground shrink-0 w-4 h-4 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
          {label}
        </p>
        <p className={`text-sm font-medium break-words leading-snug ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-2.5 sm:p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
        {label}
      </p>
      <p className="text-xs sm:text-sm font-medium truncate mt-0.5 leading-snug">{value}</p>
    </div>
  );
}
