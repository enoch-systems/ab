"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { formatCurrency, formatDate } from "@/components/shared/status-badge";
import type { Customer } from "@/lib/types";
import { AdminPageHeader } from "@/components/shared/admin/admin-page-header";
import { AdminSearch } from "@/components/shared/admin/admin-search";
import { AdminMiniStat } from "@/components/shared/admin/admin-stat";
import {
  Users, Mail, Phone, MapPin, ChevronRight, ChevronLeft, Clock, Package,
  User as UserIcon,
} from "lucide-react";

export default function AdminUsersPage() {
  const router = useRouter();
  const { customers, shipments } = useAppState();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const list = useMemo(() => {
    return [...customers]
      .filter((c) => {
        if (!q.trim()) return true;
        const t = q.trim().toLowerCase();
        return (
          c.fullName.toLowerCase().includes(t) ||
          c.email.toLowerCase().includes(t) ||
          c.phone.toLowerCase().includes(t) ||
          c.city.toLowerCase().includes(t) ||
          c.state.toLowerCase().includes(t) ||
          c.country.toLowerCase().includes(t)
        );
      })
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
  }, [customers, q]);

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleList = list.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstResult = list.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastResult = Math.min(currentPage * pageSize, list.length);

  const updateSearch = (value: string) => {
    setQ(value);
    setPage(1);
  };

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of shipments) map[s.customerId] = (map[s.customerId] || 0) + 1;
    return map;
  }, [shipments]);

  const active = customers.filter((c) => c.accountStatus === "Active").length;
  const totalSpend = useMemo(
    () => shipments.reduce((a, s) => a + s.cost, 0),
    [shipments]
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] pb-10 sm:pb-14">
      <AdminPageHeader
        title="Users"
        subtitle={
          <>
            {customers.length} total · {Object.values(counts).reduce((a, b) => a + b, 0)} orders ·{" "}
            {formatCurrency(totalSpend, "USD")} total spend
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mb-5 sm:mb-6">
        <AdminMiniStat label="Total" value={String(customers.length)} tone="text-indigo-600 dark:text-indigo-300 bg-indigo-500/10" icon={<Users className="w-4 h-4" />} />
        <AdminMiniStat label="Active" value={String(active)} tone="text-emerald-600 dark:text-emerald-300 bg-emerald-500/10" icon={<UserIcon className="w-4 h-4" />} />
        <AdminMiniStat label="Avg. Shipments" value={(Object.values(counts).reduce((a, b) => a + b, 0) / Math.max(1, customers.length)).toFixed(1)} tone="text-sky-600 dark:text-sky-300 bg-sky-500/10" icon={<Package className="w-4 h-4" />} />
        <AdminMiniStat label="Avg. Spend" value={formatCurrency(totalSpend / Math.max(1, customers.length), "USD")} tone="text-amber-600 dark:text-amber-300 bg-amber-500/10" icon={<Clock className="w-4 h-4" />} />
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <AdminSearch
          value={q}
          onChange={updateSearch}
          placeholder="Search name, email, phone, city…"
          className="sm:max-w-md w-full"
        />
        <p className="text-xs sm:text-sm text-muted-foreground sm:text-right">
          <span className="text-foreground font-semibold">{list.length}</span> users
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <th className="text-left font-medium px-5 py-3.5">User</th>
                <th className="text-left font-medium px-5 py-3.5">Contact</th>
                <th className="text-left font-medium px-5 py-3.5">Location</th>
                <th className="text-left font-medium px-5 py-3.5">Shipments</th>
                <th className="text-left font-medium px-5 py-3.5">Registered</th>
                <th className="text-left font-medium px-5 py-3.5">Last Active</th>
                <th className="text-left font-medium px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {!list.length && (
                <tr><td colSpan={7} className="h-40 text-center text-sm text-muted-foreground">No users match.</td></tr>
              )}
              {visibleList.map((c) => (
                <UserRow key={c.id} c={c} count={counts[c.id] || 0} onClick={() => router.push(`/admin/users/${c.id}`)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile user cards */}
      <div className="lg:hidden space-y-2.5">
        {!list.length && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No users match your search.
          </div>
        )}
        {visibleList.map((c) => {
          const count = counts[c.id] || 0;
          return (
            <button
              key={c.id}
              onClick={() => router.push(`/admin/users/${c.id}`)}
              className="w-full text-left rounded-2xl border border-border bg-card p-3.5 hover:border-border/80 transition active:scale-[0.995]"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary font-serif text-base flex items-center justify-center shrink-0">
                  {c.fullName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">{c.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                      c.accountStatus === "Active"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : c.accountStatus === "Pending"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    }`}>
                      {c.accountStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3 shrink-0" />
                    <span className="truncate">{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{c.city}, {c.country}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/60 sm:grid-cols-3">
                    <InfoCell label="Shipments" value={String(count)} />
                    <InfoCell label="Joined" value={formatDate(c.createdAt)} />
                    <InfoCell label="Active" value={formatDate(c.lastActive)} align="right" />
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {list.length > 0 && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <p className="text-xs text-muted-foreground sm:text-sm">
            Showing <span className="font-semibold text-foreground">{firstResult}–{lastResult}</span> of{" "}
            <span className="font-semibold text-foreground">{list.length}</span> users
          </p>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              aria-label="Previous users page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <div className="flex max-w-full items-center justify-between gap-1 overflow-x-auto admin-scroll">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  aria-current={pageNumber === currentPage ? "page" : undefined}
                  className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${pageNumber === currentPage ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              aria-label="Next users page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, tone, icon }: { label: string; value: string; tone: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-8 h-8 rounded-lg inline-flex items-center justify-center ${tone}`}>{icon}</div>
      </div>
      <p className="text-xl sm:text-[22px] font-serif font-semibold tracking-tight leading-none mb-1 truncate">{value}</p>
      <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoCell({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xs font-semibold truncate">{value}</p>
    </div>
  );
}

function UserRow({ c, count, onClick }: { c: Customer; count: number; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="border-b border-border/40 last:border-b-0 hover:bg-accent/5 cursor-pointer transition"
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-serif flex items-center justify-center shrink-0">
            {c.fullName[0]}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate leading-tight">{c.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="text-sm space-y-0.5">
          <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{c.email}</div>
          <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3.5 h-3.5 shrink-0" />{c.phone}</div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-start gap-1.5 text-sm"><MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" /><span className="truncate">{c.city}, {c.state}, {c.country}</span></div>
      </td>
      <td className="px-5 py-3.5">
        <div className="inline-flex items-center gap-1.5 font-medium">
          <Package className="w-4 h-4 text-primary" />
          <span>{count}</span>
        </div>
      </td>
      <td className="px-5 py-3.5 text-muted-foreground text-sm">{formatDate(c.createdAt)}</td>
      <td className="px-5 py-3.5 text-muted-foreground text-sm">{formatDate(c.lastActive)}</td>
      <td className="px-5 py-3.5">
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${c.accountStatus === "Active" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"}`}>
          {c.accountStatus}
        </span>
      </td>
    </tr>
  );
}
