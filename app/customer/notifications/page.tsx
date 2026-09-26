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
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip px-3 py-6 sm:container sm:px-4 sm:py-8">
      <div className="mb-5 sm:mb-6">
        <Button asChild variant="ghost" className="mb-3 h-9 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground sm:mb-4">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-2">
            <ChevronLeft className="h-4 w-4 shrink-0" />
            Back
          </Link>
        </Button>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em]">
          <span className="text-muted-foreground">Account</span>
          <span className="text-muted-foreground/70">/</span>
          <span className="text-primary">Notifications</span>
        </div>

        <div className="flex min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:items-end min-[480px]:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-[1.7rem] leading-tight tracking-tight sm:text-3xl">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">{unread} unread · {all.length} total</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 min-[480px]:flex min-[480px]:w-auto">
          <Button asChild variant="outline" size="sm" className="h-9 min-w-0 rounded-full px-3"><Link href="/customer/shipments" className="inline-flex min-w-0 items-center justify-center gap-1">Shipments <ArrowRight className="w-3.5 h-3.5 shrink-0" /></Link></Button>
            <Button variant="outline" size="sm" className="h-9 min-w-0 rounded-full px-3" disabled={unread === 0} onClick={() => markAllCustomerNotificationsRead(session?.userId || "")}>
              <Check className="w-4 h-4 shrink-0" /><span className="truncate">Mark all read</span>
            </Button>
          </div>
        </div>
      </div>

      <Card className="boty-shadow min-w-0 border">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex min-w-0 items-center gap-2 font-serif text-base sm:text-lg"><Bell className="w-4 h-4 shrink-0 text-primary" /><span className="truncate">Activity & Updates</span></CardTitle>
          <CardDescription className="text-sm leading-relaxed">Shipment status updates, delivery confirmations, and delivery alerts.</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 px-2 sm:px-6">
          {!all.length ? (
            <EmptyState />
          ) : (
            <ul className="min-w-0 divide-y">
              {all.map((n) => (
                <li key={n.id} className="min-w-0">
                  <div
                    onClick={() => markNotificationRead(n.id)}
                    role="button"
                    tabIndex={0}
                    className={`w-full min-w-0 cursor-pointer px-2 py-4 text-left transition hover:bg-muted/30 sm:p-5 sm:px-4 ${n.read ? "" : "bg-primary/5"}`}
                  >
                    <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border sm:h-11 sm:w-11 ${n.read ? "bg-muted/50 border-border" : "bg-card border-primary/20 shadow-sm"}`}>
                        {TYPE_ICON[n.type] || <Mail className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                          <p className="min-w-0 flex-1 basis-40 font-semibold leading-snug">{n.title}</p>
                          {!n.read && <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          {n.trackingNumber && <span className="inline-flex max-w-full items-center gap-1 rounded-full border bg-primary/10 text-primary font-mono text-[10px] px-2 py-0.5 opacity-90"><span className="truncate">{n.trackingNumber}</span><CopyTrackingId value={n.trackingNumber} className="!h-5 !w-5 shrink-0 !rounded-full" /></span>}
                        </div>
                        <p className="break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{richTrackingText(n.message)}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
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
    <div className="rounded-2xl border border-dashed px-4 py-10 text-center sm:py-14">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="h-7 w-7" /></div>
      <p className="font-medium text-lg">All caught up</p>
      <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">You have no notifications yet.</p>
    </div>
  );
}
