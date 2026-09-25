"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo } from "react";
import type { Customer, Shipment } from "@/lib/types";
import { useAppState } from "@/lib/app-state";
import { AdminPageHeader } from "@/components/shared/admin/admin-page-header";
import { StatusBadge, formatDate } from "@/components/shared/status-badge";
import { CopyTrackingId } from "@/components/shared/copy-tracking-id";
import { ArrowRight, CheckCircle2, MapPin, Package, Send, Truck, Users } from "lucide-react";

export default function AdminOverviewPage() {
  const { adminStats, shipments, customers } = useAppState();
  const stats = adminStats();
  const recentShipments = useMemo(
    () => [...shipments].sort((a, b) => +new Date(b.lastUpdated) - +new Date(a.lastUpdated)).slice(0, 6),
    [shipments],
  );
  const recentUsers = useMemo(
    () => [...customers].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6),
    [customers],
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1200px] pb-10 sm:pb-14">
      <AdminPageHeader
        title="Overview"
        subtitle={`${customers.length} users · ${shipments.length} orders`}
        actions={<Link href="/admin/shipments" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/92"><Package className="h-4 w-4" /> Manage orders</Link>}
      />
      <div className="mb-5 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
        <Summary label="Total users" value={customers.length} sub="Registered accounts" icon={<Users className="h-5 w-5" />} tone="indigo" />
        <Summary label="Total orders" value={shipments.length} sub={`${stats.active} active`} icon={<Package className="h-5 w-5" />} tone="blue" />
        <Summary label="Out for delivery" value={stats.outForDelivery} sub="Ready today" icon={<Send className="h-5 w-5" />} tone="amber" />
        <Summary label="Delivered" value={stats.delivered} sub={`${stats.successRate}% on time`} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <SectionHeader icon={<Truck className="h-4 w-4 text-primary" />} title="Recent orders" subtitle="Open an order to edit its address or status" href="/admin/shipments" link="All" />
          <div className="divide-y">
            {recentShipments.map((shipment) => <OrderRow key={shipment.id} shipment={shipment} customerName={customers.find((item) => item.id === shipment.customerId)?.fullName || "Unknown user"} />)}
            {!recentShipments.length && <Empty text="No orders yet." />}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <SectionHeader icon={<Users className="h-4 w-4 text-primary" />} title="Users" subtitle={`Total registered: ${customers.length}`} href="/admin/users" link="View" />
          <div className="divide-y">
            {recentUsers.map((customer) => <UserRow key={customer.id} customer={customer} />)}
            {!recentUsers.length && <Empty text="No users yet." />}
          </div>
        </section>
      </div>
      <div className="mt-5 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/[0.05] px-4 py-3 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 break-words">Open any order to update its delivery address, destination, or current parcel location.</span></div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, href, link }: { icon: ReactNode; title: string; subtitle: string; href: string; link: string }) {
  return <div className="flex min-w-0 items-center justify-between gap-3 border-b px-4 py-4 sm:px-5"><div className="flex min-w-0 items-center gap-2">{icon}<div className="min-w-0"><h2 className="truncate font-serif text-lg">{title}</h2><p className="truncate text-xs text-muted-foreground">{subtitle}</p></div></div><Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">{link}<ArrowRight className="h-3.5 w-3.5" /></Link></div>;
}

function OrderRow({ shipment, customerName }: { shipment: Shipment; customerName: string }) {
  return <Link href={`/admin/shipments/${shipment.id}`} className="flex min-w-0 items-center gap-3 px-4 py-3.5 transition hover:bg-muted/30 sm:px-5"><div className="min-w-0 flex-1"><p className="truncate font-mono text-xs font-semibold text-primary">{shipment.trackingNumber}<CopyTrackingId value={shipment.trackingNumber} className="ml-1.5 !h-6 !w-6 !rounded-md" /></p><p className="truncate text-sm">{customerName}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{shipment.origin} → {shipment.destination}</p></div><StatusBadge status={shipment.status} className="max-w-[8.5rem] truncate sm:max-w-none" /><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" /></Link>;
}

function UserRow({ customer }: { customer: Customer }) {
  return <Link href={`/admin/users/${customer.id}`} className="flex min-w-0 items-center gap-3 px-4 py-3 transition hover:bg-muted/30 sm:px-5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-serif text-primary">{customer.fullName[0]}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{customer.fullName}</p><p className="truncate text-xs text-muted-foreground">{customer.email}</p></div><span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{formatDate(customer.createdAt)}</span></Link>;
}

function Summary({ label, value, sub, icon, tone }: { label: string; value: number; sub: string; icon: ReactNode; tone: "indigo" | "blue" | "amber" | "green" }) {
  const tones = { indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300", blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300", amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300", green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" };
  return <div className="rounded-2xl border bg-card p-4"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div><p className="font-serif text-2xl font-semibold leading-none">{value}</p><p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1 text-xs text-muted-foreground">{sub}</p></div>;
}

function Empty({ text }: { text: string }) { return <p className="p-8 text-center text-sm text-muted-foreground">{text}</p>; }
