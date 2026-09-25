"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  ArrowLeft,
  LayoutDashboard,
  MapPinned,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Users,
  Inbox,
} from "lucide-react";

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

const NAV_ITEMS = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/shipments", icon: Package },
  { name: "Delivery", href: "/admin/tracking", icon: MapPinned },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Inbox", href: "/admin/inbox", icon: Inbox },
  { name: "Settings", href: "/admin/settings", icon: Settings },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
    } catch {
      // Ignore storage restrictions and use the expanded default.
    }
  }, []);

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // The visual toggle still works when storage is unavailable.
      }
      return next;
    });
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname?.startsWith(href));

  const runSearch = (value: string) => {
    const query = value.trim();
    router.push(query ? `/admin/shipments?q=${encodeURIComponent(query)}` : "/admin/shipments");
  };

  return (
    <div className="admin-shell min-h-screen min-w-0 overflow-x-clip bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex ${collapsed ? "w-20" : "w-64 xl:w-72"}`}>
        <div className="flex h-full flex-col">
          <div className={`flex items-center border-b border-sidebar-border/60 ${collapsed ? "justify-center px-3 py-5" : "justify-between px-5 py-5"}`}>
            <Link href="/admin" className="flex min-w-0 items-center gap-3" aria-label="ArcBest admin overview">
              <BrandLogo className="h-10 w-10 shrink-0 rounded-xl object-contain" />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="font-serif text-xl font-semibold leading-none tracking-wide">ArcBest</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Operations</p>
                </div>
              )}
            </Link>
            {!collapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Collapse admin sidebar"
                title="Collapse sidebar"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <div className="flex justify-center border-b border-sidebar-border/60 px-3 py-2">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Expand admin sidebar"
                title="Expand sidebar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </div>
          )}
          <nav className={`flex-1 py-5 ${collapsed ? "px-2" : "px-3"}`} aria-label="Admin navigation">
            {!collapsed && <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>}
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={item.name}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-3"} ${active ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className={`border-t border-sidebar-border/60 ${collapsed ? "p-2" : "p-4"}`}>
            {collapsed ? (
              <div className="space-y-1">
                <Link href="/admin/settings" aria-label="Account settings" title="Account settings" className="flex items-center justify-center rounded-xl px-2 py-3 text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground">
                  <Settings className="h-4 w-4" />
                </Link>
                <Link href="/" aria-label="Back to site" title="Back to site" className="flex items-center justify-center rounded-xl px-2 py-3 text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/50 px-4 py-3">
                  <p className="text-sm font-semibold">Admin workspace</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Manage users, orders and delivery</p>
                </div>
                <Link href="/admin/settings" className="mt-3 inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground">
                  <Settings className="h-3.5 w-3.5" /> Account settings
                </Link>
                <Link href="/" className="mt-1 inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to site
                </Link>
              </>
            )}
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background lg:hidden">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
              <BrandLogo className="h-9 w-9 shrink-0 rounded-xl object-contain" />
              <div className="min-w-0">
                <p className="font-serif text-lg font-semibold leading-none">ArcBest</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Operations</p>
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle size="sm" />
              <Link href="/" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Site
              </Link>
            </div>
          </div>
      </header>

      <div className={`sticky top-0 z-20 hidden border-b border-border/60 bg-background transition-[padding] duration-200 lg:block ${collapsed ? "lg:pl-20" : "lg:pl-64 xl:pl-72"}`}>
        <div className="flex h-16 items-center justify-between gap-4 px-6 lg:px-8">
          <div className="relative min-w-0 flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search orders, tracking numbers, or users…"
              onKeyDown={(event) => { if (event.key === "Enter") runSearch(event.currentTarget.value); }}
              className="h-10 w-full rounded-xl border border-border bg-muted/30 pl-10 pr-4 text-sm transition placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <ThemeToggle size="sm" />
        </div>
      </div>

      <main className={`min-w-0 pb-28 transition-[padding] duration-200 lg:pb-10 ${collapsed ? "lg:pl-20" : "lg:pl-64 xl:pl-72"}`}>
        <div className="min-w-0 px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pt-7">{children}</div>
      </main>

      <nav aria-label="Admin navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 pb-safe backdrop-blur-sm lg:hidden">
        <div className="grid h-16 grid-cols-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href} aria-current={active ? "page" : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" />}
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
