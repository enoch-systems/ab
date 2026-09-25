"use client";

import Link from "next/link";
import { useAppState } from "@/lib/app-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, formatDateTime } from "@/components/shared/status-badge";
import { CopyTrackingId, richTrackingText } from "@/components/shared/copy-tracking-id";
import { Bell, Check, Mail, PackageCheck, Truck, AlertTriangle, Package, ArrowRight, Inbox, ChevronLeft } from "lucide-react";
import type { NotificationType } from "@/lib/types";

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  "shipment_created": <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  "shipment_confirmed": <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
  "package_picked_up": <PackageCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
  "shipment_in_transit": <Truck className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
  "shipment_arrived_facility": <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
  "shipment_out_for_delivery": <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
  "shipment_delivered": <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
  "delivery_exception": <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
  "account_welcome": <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
};

export default function CustomerNotificationsPage() {
  const { session, notificationsByCustomer, markNotificationRead, markAllCustomerNotificationsRead, unreadCount } = useAppState();
  const all = notificationsByCustomer(session?.userId || "").sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const unread = unreadCount(session?.userId || "");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
          <span className="text-primary">Notifications</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">{unread} unread · {all.length} total</p>
          </div>
          <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full"><Link href="/customer/shipments">Shipments <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
            <Button variant="outline" size="sm" className="rounded-full" disabled={unread === 0} onClick={() => markAllCustomerNotificationsRead(session?.userId || "")}>
              <Check className="w-4 h-4 mr-1" />Mark all read
            </Button>
          </div>
        </div>
      </div>

      <Card className="boty-shadow border">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2"><Bell className="w-4 h-4 text-primary" />Activity & Updates</CardTitle>
          <CardDescription>Shipment status updates, delivery confirmations, and delivery alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          {!all.length ? (
            <EmptyState />
          ) : (
            <ul className="divide-y -mx-6 -my-2">
              {all.map((n) => (
                <li key={n.id}>
                  <div
                    onClick={() => markNotificationRead(n.id)}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer w-full text-left p-5 sm:p-6 transition hover:bg-muted/30 ${n.read ? "" : "bg-primary/5"}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${n.read ? "bg-muted/50 border-border" : "bg-card border-primary/20 shadow-sm"}`}>
                        {TYPE_ICON[n.type] || <Mail className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold">{n.title}</p>
                          {!n.read && <span className="inline-flex w-2 h-2 rounded-full bg-primary" />}
                          {n.trackingNumber && <span className="hidden sm:inline-flex items-center gap-1 rounded-full border bg-primary/10 text-primary font-mono text-[10px] px-2 py-0.5 opacity-90">{n.trackingNumber}<CopyTrackingId value={n.trackingNumber} className="!h-5 !w-5 !rounded-full" /></span>}
                        </div>
                        <p className="text-sm text-muted-foreground">{richTrackingText(n.message)}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed py-14 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3"><Inbox className="w-7 h-7" /></div>
      <p className="font-medium text-lg">All caught up</p>
      <p className="text-sm text-muted-foreground mt-1">You have no notifications yet.</p>
    </div>
  );
}
