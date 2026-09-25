"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/lib/app-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/components/shared/status-badge";
import type { ActivityType } from "@/lib/types";
import { AdminPageHeader } from "@/components/shared/admin/admin-page-header";
import { AdminSearch } from "@/components/shared/admin/admin-search";
import {
  Shield,
  Users,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Search,
  Activity as ActivityIcon,
  Clock,
  ArrowRight,
  Filter,
  X,
} from "lucide-react";

const FILTERS: {
  key: "all" | ActivityType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { key: "all", label: "All Events", icon: <ActivityIcon className="w-4 h-4" /> },
  { key: "admin_logged_in", label: "Admin Login", icon: <Shield className="w-4 h-4" /> },
  { key: "admin_profile_updated", label: "Profile Updated", icon: <Edit3 className="w-4 h-4" /> },
  { key: "admin_password_changed", label: "Password Changed", icon: <Shield className="w-4 h-4" /> },
  {
    key: "customer_registered",
    label: "Customer Signup",
    icon: <Users className="w-4 h-4" />,
  },
  {
    key: "shipment_created",
    label: "Shipment Created",
    icon: <Package className="w-4 h-4" />,
  },
  {
    key: "shipment_status_changed",
    label: "Status Changed",
    icon: <Truck className="w-4 h-4" />,
  },
  {
    key: "tracking_event_added",
    label: "Tracking Event",
    icon: <Edit3 className="w-4 h-4" />,
  },
  { key: "shipment_delivered", label: "Delivered", icon: <CheckCircle2 className="w-4 h-4" /> },
  { key: "customer_updated", label: "Customer Update", icon: <Users className="w-4 h-4" /> },
];

const TYPE_ICON: Record<ActivityType, React.ReactNode> = {
  admin_logged_in: <Shield className="w-4 h-4" />,
  admin_profile_updated: <Edit3 className="w-4 h-4" />,
  admin_password_changed: <Shield className="w-4 h-4" />,
  customer_registered: <Users className="w-4 h-4" />,
  shipment_created: <Package className="w-4 h-4" />,
  shipment_status_changed: <Truck className="w-4 h-4" />,
  tracking_event_added: <Edit3 className="w-4 h-4" />,
  shipment_delivered: <CheckCircle2 className="w-4 h-4" />,
  customer_updated: <Users className="w-4 h-4" />,
};

const TYPE_TONE: Record<
  ActivityType,
  { tile: string; dot: string; text: string }
> = {
  admin_logged_in: {
    tile: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    dot: "bg-indigo-500",
    text: "text-indigo-700 dark:text-indigo-300",
  },
  admin_profile_updated: {
    tile: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
  },
  admin_password_changed: {
    tile: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-300",
  },
  customer_registered: {
    tile: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
  },
  shipment_created: {
    tile: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-300",
  },
  shipment_status_changed: {
    tile: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    dot: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-300",
  },
  tracking_event_added: {
    tile: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
    dot: "bg-cyan-500",
    text: "text-cyan-700 dark:text-cyan-300",
  },
  shipment_delivered: {
    tile: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  customer_updated: {
    tile: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
  },
};

export default function AdminActivityPage() {
  const { activities } = useAppState();
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | ActivityType>("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const list = useMemo(() => {
    return [...activities]
      .filter((a) => f === "all" || a.type === f)
      .filter((a) => {
        if (!q.trim()) return true;
        const t = q.trim().toLowerCase();
        return (
          a.action.toLowerCase().includes(t) ||
          a.actor.toLowerCase().includes(t) ||
          a.details?.toLowerCase().includes(t) ||
          a.referenceId?.toLowerCase().includes(t)
        );
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, q, f]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 pb-10 sm:pb-14">
      <AdminPageHeader
        title="Activity Log"
        subtitle={
          <>
            Full audit trail of admin actions, customer signups, and shipment events.{" "}
            <span className="font-semibold text-foreground">{activities.length}</span> total events.
          </>
        }
      />

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <AdminSearch
          value={q}
          onChange={setQ}
          placeholder="Search events, actors, references…"
          className="flex-1"
        />
        <button
          onClick={() => setMobileFilterOpen((v) => !v)}
          className="sm:hidden inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border bg-card hover:bg-muted/60 transition text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Filter className="w-4 h-4" />
          Filters · {f === "all" ? "All" : FILTERS.find((x) => x.key === f)?.label}
        </button>
      </div>

      {/* Desktop filter pills */}
      <div className="hidden sm:flex flex-wrap gap-2 mb-5">
        {FILTERS.map((ft) => {
          const c =
            ft.key === "all"
              ? activities.length
              : activities.filter((a) => a.type === ft.key).length;
          return (
            <button
              key={ft.key}
              onClick={() => setF(ft.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${f === ft.key ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {ft.icon}
              <span>{ft.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${f === ft.key ? "bg-white/20 text-white" : "bg-background/80 dark:bg-slate-900/60 text-muted-foreground"}`}
              >
                {c}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile filter sheet */}
      {mobileFilterOpen && (
        <div className="sm:hidden mb-4 border rounded-2xl overflow-hidden shadow-sm bg-card">
          <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="w-4 h-4" /> Filters
            </div>
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-3 flex flex-wrap gap-2 max-h-[50vh] overflow-y-auto">
            {FILTERS.map((ft) => {
              const c =
                ft.key === "all"
                  ? activities.length
                  : activities.filter((a) => a.type === ft.key).length;
              return (
                <button
                  key={ft.key}
                  onClick={() => {
                    setF(ft.key);
                    setMobileFilterOpen(false);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition shrink-0 ${f === ft.key ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {ft.icon}
                  <span>{ft.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${f === ft.key ? "bg-white/20 text-white" : "bg-background/80 dark:bg-slate-900/60 text-muted-foreground"}`}
                  >
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active filter label on mobile */}
      {f !== "all" && !mobileFilterOpen && (
        <div className="sm:hidden mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
          {FILTERS.find((x) => x.key === f)?.icon}
          Showing: {FILTERS.find((x) => x.key === f)?.label}
        </div>
      )}

      {/* Feed card */}
      <Card className="border rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="hidden sm:flex flex-row items-center justify-between border-b bg-muted/10 px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ActivityIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-serif text-base sm:text-lg truncate">
                Event Feed
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs sm:text-sm truncate">
                {list.length} matching events · chronological
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            {/* Timeline spine */}
            <div className="absolute left-[30px] sm:left-[38px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-primary/30 via-border/70 to-transparent rounded-full" />
            <ul>
              {!list.length && (
                <li className="p-10 sm:p-14 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <ActivityIcon className="w-7 h-7 text-muted-foreground/70" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No matching events
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
                      Try clearing your search or changing the active filter.
                    </p>
                  </div>
                </li>
              )}
              {list.map((a, i) => {
                const tone =
                  TYPE_TONE[a.type as ActivityType] ?? TYPE_TONE.shipment_created;
                return (
                  <li
                    key={a.id}
                    className={`relative px-3 sm:px-5 py-3.5 sm:py-4.5 ${i !== list.length - 1 ? "border-b border-border/40" : ""}`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Icon tile */}
                      <div
                        className={`shrink-0 relative z-10 w-[44px] sm:w-[52px] h-[44px] sm:h-[52px] rounded-2xl flex items-center justify-center border-2 border-card shadow-sm ${tone.tile}`}
                      >
                        {TYPE_ICON[a.type as ActivityType] || (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                            <p
                              className={`text-[13px] sm:text-sm font-semibold leading-snug ${tone.text}`}
                            >
                              {a.action}
                            </p>
                            <span className="text-[12px] text-muted-foreground inline-flex items-center gap-1">
                              <span className="text-[10px] opacity-60">by</span>
                              <span className="font-semibold text-foreground truncate">
                                {a.actor}
                              </span>
                            </span>
                          </div>
                          <div className="flex max-w-full items-center justify-end gap-1.5 text-[11px] text-muted-foreground sm:whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {formatDateTime(a.timestamp)}
                          </div>
                        </div>

                        {a.details && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 leading-snug">
                            {a.details}
                          </p>
                        )}

                        <div className="mt-2 sm:mt-2.5 flex flex-wrap gap-1.5 sm:gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono font-semibold">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${tone.dot}`}
                            />
                            {a.type}
                          </span>
                          {a.referenceId && (
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-semibold truncate max-w-[55%] sm:max-w-xs">
                              ref: {a.referenceId}
                              <ArrowRight className="w-3 h-3 shrink-0 opacity-70" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
