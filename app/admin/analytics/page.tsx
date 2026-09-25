"use client";

import { useMemo } from "react";
import { useAppState } from "@/lib/app-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, formatCurrency } from "@/components/shared/status-badge";
import type { ShipmentStatus, ShippingMethod } from "@/lib/types";
import { AdminPageHeader } from "@/components/shared/admin/admin-page-header";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  Package,
  Truck,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Globe2,
  Activity as ActivityIcon,
  CircleDot,
} from "lucide-react";

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  "Order Created": "#3b82f6",
  Confirmed: "#6366f1",
  "Picked Up": "#0ea5e9",
  "In Transit": "#8b5cf6",
  "Arrived at Facility": "#06b6d4",
  "Out for Delivery": "#f59e0b",
  Delivered: "#10b981",
  Exception: "#ef4444",
};

export default function AdminAnalyticsPage() {
  const { adminStats, shipments, customers } = useAppState();
  const s = adminStats();

  const statusDistribution = useMemo(() => {
    const statuses: ShipmentStatus[] = [
      "Order Created",
      "Confirmed",
      "Picked Up",
      "In Transit",
      "Arrived at Facility",
      "Out for Delivery",
      "Delivered",
      "Exception",
    ];
    return statuses
      .map((st) => ({
        name: st,
        value: shipments.filter((x) => x.status === st).length,
        color: STATUS_COLORS[st],
      }))
      .filter((x) => x.value > 0);
  }, [shipments]);

  const methods = useMemo(() => {
    const map: Record<
      ShippingMethod,
      { method: ShippingMethod; count: number; revenue: number }
    > = {
      Standard: { method: "Standard", count: 0, revenue: 0 },
      Express: { method: "Express", count: 0, revenue: 0 },
      Premium: { method: "Premium", count: 0, revenue: 0 },
      International: { method: "International", count: 0, revenue: 0 },
    };
    for (const sh of shipments) {
      map[sh.shippingMethod].count++;
      map[sh.shippingMethod].revenue += sh.cost;
    }
    return Object.values(map);
  }, [shipments]);

  const perf = useMemo(
    () => [
      { name: "On-time", value: s.successRate },
      { name: "Delayed", value: Math.max(0, 100 - s.successRate - s.exceptionRate) },
      { name: "Exception", value: s.exceptionRate },
    ],
    [s],
  );

  const radar = useMemo(
    () =>
      s.topDestinations.slice(0, 6).map((x, i) => ({
        destination: x.name,
        shipments: x.count,
        revenue: x.count * 48000,
        index: i,
      })),
    [s],
  );

  const monthlyGrowth = useMemo(() => {
    const months = s.monthlyVolume.map((m, i) => ({
      ...m,
      growth:
        i === 0
          ? 0
          : Math.round(
              ((m.shipments - s.monthlyVolume[i - 1].shipments) /
                Math.max(1, s.monthlyVolume[i - 1].shipments)) *
                100,
            ),
    }));
    return months;
  }, [s]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-10 sm:pb-14">
      <AdminPageHeader
        title="Analytics"
        subtitle="Operational performance, shipment trends and delivery metrics."
        actions={
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {shipments.length} shipments · {customers.length} customers
          </span>
        }
      />

      {/* Row 1: Primary KPI cards (4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 mb-4 sm:mb-5">
        <Kpi
          icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Success Rate"
          value={`${s.successRate}%`}
          tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          delta="+2.4%"
        />
        <Kpi
          icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Avg Delivery"
          value={`${s.avgDeliveryDays}d`}
          tone="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
          delta="-0.6d"
          positive
        />
        <Kpi
          icon={<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Exception Rate"
          value={`${s.exceptionRate}%`}
          tone="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
          delta="-1.1%"
          positive
        />
        <Kpi
          icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Total Revenue"
              value={formatCurrency(s.revenue, "USD")}
          tone="bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
          delta="+12%"
        />
      </div>

      {/* Row 2: Secondary KPI tiles (4) — compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 mb-5 sm:mb-6">
        <MiniKpi
          label="Shipments"
          value={String(s.totalShipments)}
          icon={<Package className="w-3.5 h-3.5" />}
        />
        <MiniKpi
          label="Active"
          value={String(s.active)}
          icon={<Truck className="w-3.5 h-3.5" />}
        />
        <MiniKpi
          label="Delivered"
          value={String(s.delivered)}
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        />
        <MiniKpi
          label="Customers"
          value={String(s.totalUsers)}
          icon={<Users className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Row 3: Volume/Revenue line + Status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-5 sm:mb-6">
        <ChartCard
          className="lg:col-span-2"
          title="Volume & Revenue (6M)"
          subtitle="Monthly shipments and revenue trend"
          icon={<TrendingUp className="w-4 h-4" />}
        >
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyGrowth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#88888822" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                    background: "hsl(var(--card))",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Line
                  type="monotone"
                  dataKey="shipments"
                  name="Shipments"
                  stroke="#0B5FFF"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, strokeWidth: 2, fill: "hsl(var(--card))" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, strokeWidth: 2, fill: "hsl(var(--card))" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Status Distribution"
          subtitle="Current shipment status mix"
          icon={<CircleDot className="w-4 h-4" />}
        >
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {statusDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                    background: "hsl(var(--card))",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={56}
                  wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 4: Methods bar + Delivery perf */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 mb-5 sm:mb-6">
        <ChartCard
          className="lg:col-span-3"
          title="Shipping Methods"
          subtitle="Volume and revenue breakdown by method"
          icon={<Truck className="w-4 h-4" />}
        >
          <div className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methods} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#88888822" vertical={false} />
                <XAxis
                  dataKey="method"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <Tooltip
                  formatter={(v: any) =>
                    typeof v === "number" && v > 999 ? formatCurrency(v, "USD") : v
                  }
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                    background: "hsl(var(--card))",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar
                  dataKey="count"
                  name="Shipments"
                  radius={[6, 6, 0, 0]}
                  fill="#0B5FFF"
                  barSize={22}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  radius={[6, 6, 0, 0]}
                  fill="#06B6D4"
                  barSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Delivery Performance"
          subtitle="On-time, delayed & exception rates"
          icon={<ActivityIcon className="w-4 h-4" />}
        >
          <div className="space-y-4">
            {perf.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1.5 text-xs sm:text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {p.value}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.name === "On-time"
                        ? "bg-emerald-500"
                        : p.name === "Delayed"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{ width: `${p.value}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border/60">
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                  Delayed
                </p>
                <p className="font-serif text-xl sm:text-2xl font-semibold mt-0.5 leading-tight">
                  {Math.max(0, shipments.length - s.delivered - s.exception) - s.active}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                  Exceptions
                </p>
                <p className="font-serif text-xl sm:text-2xl font-semibold mt-0.5 leading-tight">
                  {s.exception}
                </p>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 5: Destinations bar + Customer growth line */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-5 sm:mb-6">
        <ChartCard
          className="lg:col-span-2"
          title="Top Destinations"
          subtitle="Shipment count by destination city"
          icon={<Globe2 className="w-4 h-4" />}
        >
          <div className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={s.topDestinations}
                layout="vertical"
                margin={{ top: 8, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#88888822" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={95}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                    background: "hsl(var(--card))",
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Shipments"
                  radius={[0, 6, 6, 0]}
                  fill="#0B5FFF"
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Customer Growth"
          subtitle="Monthly new customer registrations"
          icon={<Users className="w-4 h-4" />}
        >
          <div className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={s.monthlyVolume}
                margin={{ top: 8, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid stroke="#88888822" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                    background: "hsl(var(--card))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="customers"
                  name="Customers"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={{
                    r: 3.5,
                    strokeWidth: 2,
                    fill: "hsl(var(--card))",
                    stroke: "#8b5cf6",
                  }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 6: Radar */}
      <ChartCard
        title="Destination Radar"
        subtitle="Top 6 destinations by relative volume"
        icon={<Globe2 className="w-4 h-4" />}
      >
        <div className="h-[280px] sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar} outerRadius="70%">
              <PolarGrid stroke="#88888833" />
              <PolarAngleAxis dataKey="destination" stroke="#888" fontSize={11} />
              <PolarRadiusAxis stroke="#888" fontSize={10} />
              <Radar
                name="Shipments"
                dataKey="shipments"
                stroke="#0B5FFF"
                fill="#0B5FFF"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border))",
                  fontSize: 12,
                  background: "hsl(var(--card))",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone,
  delta,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
  delta?: string;
  positive?: boolean;
}) {
  return (
    <Card className="border rounded-2xl shadow-sm overflow-hidden">
      <CardContent className="pt-4 sm:pt-5 pb-4 px-4 sm:px-5">
        <div className="flex items-start justify-between mb-2.5 sm:mb-3">
          <span className={`inline-flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl items-center justify-center ${tone}`}>
            {icon}
          </span>
          {delta && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                positive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {delta}
            </span>
          )}
        </div>
        <p className="text-xl sm:text-2xl lg:text-3xl font-serif font-semibold tracking-tight leading-tight truncate">
          {value}
        </p>
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mt-1 truncate">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

function MiniKpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-card dark:bg-muted/10 p-3 sm:p-3.5">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className="inline-flex w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl items-center justify-center bg-primary/10 text-primary shrink-0">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg sm:text-xl font-serif font-semibold leading-none truncate">
            {value}
          </p>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mt-1 truncate">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border rounded-2xl shadow-sm overflow-hidden ${className ?? ""}`}>
      <CardHeader className="border-b bg-muted/10 px-4 sm:px-5 py-3 sm:py-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex w-9 h-9 rounded-xl bg-primary/10 text-primary items-center justify-center shrink-0">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="font-serif text-base sm:text-lg truncate">
              {title}
            </CardTitle>
            {subtitle && (
              <CardDescription className="mt-0.5 text-xs sm:text-sm truncate">
                {subtitle}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-5">{children}</CardContent>
    </Card>
  );
}
