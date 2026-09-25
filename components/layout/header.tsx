"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, Package, LogOut, User, Bell, LayoutDashboard, Truck, BarChart3, Activity, Settings, Users, Home, Route, CircleHelp, Phone, ShieldCheck, MoveLeft, Compass, ChevronDown, LogIn, Rocket, BriefcaseBusiness, FileQuestion } from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { BrandLogo } from "@/components/shared/brand-logo"
import { navigation } from "@/lib/navigation"
import { cn } from "@/lib/utils"

type Variant = "default" | "admin" | "customer"

export function Header({ variant = "default" }: { variant?: Variant } = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const exploreRef = useRef<HTMLDivElement>(null)
  const { session, currentCustomer, logout, unreadCount } = useAppState()
  const router = useRouter()
  const pathname = usePathname()

  const isAdmin = variant === "admin"
  const isCustomer = variant === "customer" || (session?.role === "customer" && variant === "default")
  const unread = session?.role === "customer" ? unreadCount(session.userId) : 0
  const adminDesktopClass = isAdmin ? "xl:flex" : "lg:flex"
  const adminMobileClass = isAdmin ? "xl:hidden" : "lg:hidden"
  const onPublicAuthPage = pathname === "/customer/login" || pathname === "/customer/signup"
  const [currentHash, setCurrentHash] = useState("")

  // Remember which section/page the visitor picked so the light "you are here"
  // pill survives menu close + reopen. Next.js hash links use pushState (no
  // `hashchange` fires), so we sync from the URL, set state on click, and
  // scroll-spy the homepage sections while reading.
  const rememberExplore = (href: string) => {
    setCurrentHash(href.startsWith("/#") ? href.slice(2) : "")
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const syncFromUrl = () => setCurrentHash(window.location.hash.replace(/^#/, ""))
    syncFromUrl()
    window.addEventListener("hashchange", syncFromUrl)
    return () => window.removeEventListener("hashchange", syncFromUrl)
  }, [pathname])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (pathname !== "/") return
    const ids = navigation.explore
      .map((item) => (item.href.startsWith("/#") ? item.href.slice(2) : null))
      .filter((id): id is string => id !== null)
    if (ids.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrentHash(entry.target.id)
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [pathname])

  useEffect(() => {
    if (typeof window === "undefined") return

    const root = document.documentElement
    const body = document.body

    if (isMenuOpen) {
      root.classList.add("mobile-menu-open")
      body.classList.add("mobile-menu-open")
      window.dispatchEvent(new CustomEvent("mobile-menu-state", { detail: { open: true } }))
    } else {
      root.classList.remove("mobile-menu-open")
      body.classList.remove("mobile-menu-open")
      window.dispatchEvent(new CustomEvent("mobile-menu-state", { detail: { open: false } }))
    }

    return () => {
      root.classList.remove("mobile-menu-open")
      body.classList.remove("mobile-menu-open")
    }
  }, [isMenuOpen])

  useEffect(() => {
    setIsMenuOpen(false)
    setExploreOpen(false)
  }, [pathname])

  // Close the Explore dropdown on outside click / Escape.
  useEffect(() => {
    if (!exploreOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setExploreOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExploreOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [exploreOpen])

  const handleLogout = async () => {
    await logout()
    setShowLogoutModal(false)
    router.push(isAdmin ? "/admin/login" : "/")
    router.refresh()
  }

  const navLinks: { name: string; href: string; badge?: number }[] = navigation.shared
    .filter((link) => {
      // Hide customer-only links for logged-out / non-customer visitors.
      // This prevents e.g. "Notifications 0" leaking into the public header.
      if (!isCustomer && (link.name === "Notifications" || link.name === "Inbox" || link.name === "Overview" || link.name === "Profile")) {
        return false
      }
      return true
    })
    .map((link) => {
      if (link.name === "Notifications") {
        return { ...link, badge: unread }
      }
      return link
    })

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname?.startsWith(href))
  }

  // An Explore child is active when its page, or its homepage section, is current.
  const isExploreItemActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/" && currentHash === href.slice(2)
    return isActive(href)
  }

  // Light creative "you are here" pill: soft sky-tinted gradient, ink-blue
  // text, hairline ring. Shared by every nav link — desktop, dropdown, mobile.
  const activePill =
    "bg-gradient-to-r from-primary/[0.16] to-primary/[0.06] text-primary font-semibold ring-1 ring-inset ring-primary/25"

  const exploreParentActive = navigation.explore.some((item) => isExploreItemActive(item.href))

  const Brand = ({ centered = false }: { centered?: boolean }) => (
    <Link href="/" onClick={() => setCurrentHash("")} className={cn(centered && "lg:absolute lg:left-1/2 lg:-translate-x-1/2")}>
      <div className="flex items-center gap-2">
        <BrandLogo className="h-8 w-8 rounded-lg object-contain sm:h-9 sm:w-9" />
        <span className="font-serif text-xl sm:text-2xl tracking-wide text-foreground font-semibold">
          ArcBest
        </span>
      </div>
    </Link>
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 pt-3 sm:pt-4">
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <nav className="relative z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 backdrop-blur-md rounded-2xl animate-scale-fade-in bg-background/70 border border-border/60 logix-shadow">
        <div className="relative z-50 flex items-center justify-between h-[68px] gap-2">
          {/* Mobile menu button */}
          <button
            type="button"
            className={cn(adminMobileClass, "p-2 text-foreground/80 hover:text-foreground boty-transition cursor-pointer rounded-lg")}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Left: Brand */}
          <div className={cn("flex-shrink-0", adminMobileClass)}>
            <Brand />
          </div>
          <div className={cn("hidden items-center gap-8", adminDesktopClass)}>
            <Brand />
          </div>

          {/* Center Nav for public */}
          <div className="hidden lg:flex items-center gap-1 ml-6">
            {!isAdmin && (
              <Link
                href="/"
                onClick={() => setCurrentHash("")}
                aria-current={pathname === "/" && currentHash === "" ? "page" : undefined}
                className={cn(
                  "relative px-3 py-2 rounded-lg text-sm tracking-wide boty-transition whitespace-nowrap inline-flex items-center gap-2",
                  pathname === '/' && currentHash === ''
                    ? activePill
                    : "text-foreground/70 hover:bg-accent/10 hover:text-primary",
                )}
              >
                Home
              </Link>
            )}
            {!isAdmin && (
              <div ref={exploreRef} className="relative">
                <button
                  type="button"
                  onClick={() => setExploreOpen((v) => !v)}
                  aria-expanded={exploreOpen}
                  aria-haspopup="true"
                  className={cn(
                    "relative px-3 py-2 rounded-lg text-sm tracking-wide boty-transition whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer",
                    exploreOpen || exploreParentActive
                      ? activePill
                      : "text-foreground/70 hover:bg-accent/10 hover:text-primary",
                  )}
                >
                  <Compass className="w-4 h-4" />
                  Explore
                  <ChevronDown className={cn("w-3.5 h-3.5 boty-transition", exploreOpen && "rotate-180")} />
                </button>
                {exploreOpen && (
                  <div className="absolute left-0 top-[calc(100%+10px)] w-[320px] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md logix-shadow p-2 animate-scale-fade-in">
                    {navigation.explore.map((item) => {
                      const itemActive = isExploreItemActive(item.href)
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => {
                            rememberExplore(item.href)
                            setExploreOpen(false)
                          }}
                          aria-current={itemActive ? "page" : undefined}
                          className={cn(
                            "flex items-start gap-3 px-3 py-2.5 rounded-xl boty-transition group",
                            itemActive
                              ? activePill
                              : "hover:bg-accent/10",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 boty-transition",
                              itemActive
                                ? "text-primary/70"
                                : "text-primary/70 group-hover:text-primary",
                            )}
                          >
                            <NavIcon name={item.name} />
                          </span>
                          <span>
                            <span
                              className={cn(
                                "block text-sm font-medium boty-transition",
                                itemActive
                                  ? "text-primary"
                                  : "text-foreground group-hover:text-primary",
                              )}
                            >
                              {item.name}
                            </span>
                            <span
                              className={cn(
                                "block text-xs",
                                itemActive
                                  ? "text-primary/70"
                                  : "text-muted-foreground",
                              )}
                            >
                              {item.blurb}
                            </span>
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "relative px-3 py-2 rounded-lg text-sm tracking-wide boty-transition whitespace-nowrap inline-flex items-center gap-2",
                  isActive(link.href)
                    ? activePill
                    : "text-foreground/70 hover:bg-accent/10 hover:text-primary",
                )}
              >
                {link.name}
                {link.badge != null && link.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle size="sm" />

            {variant === "default" && !session && !onPublicAuthPage && (
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <Link
                  href="/customer/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm tracking-wide text-foreground/80 hover:text-primary hover:bg-accent/10 boty-transition"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
                <Link
                  href="/customer/signup"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90 boty-transition"
                >
                  <Rocket className="w-4 h-4" /> Get Started
                </Link>
              </div>
            )}

            {variant === "default" && !session && onPublicAuthPage && (
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm tracking-wide text-foreground/80 hover:text-primary hover:bg-accent/10 boty-transition"
                >
                  <MoveLeft className="w-4 h-4" /> Back to Home
                </Link>
              </div>
            )}

            {variant === "default" && session?.role === "customer" && (
              <div className="hidden sm:flex items-center gap-1 ml-2">
                <Link
                  href="/customer/notifications"
                  className="relative p-2 rounded-full text-foreground/70 hover:text-primary hover:bg-accent/10 boty-transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </Link>
                <Link
                  href="/customer/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm tracking-wide bg-primary/10 text-primary hover:bg-primary/20 boty-transition"
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              </div>
            )}

            {(isAdmin || isCustomer) && (
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className={cn("hidden", adminDesktopClass, "items-center gap-2 ml-1 sm:ml-2 bg-destructive/10 text-destructive px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm tracking-wide boty-transition hover:bg-destructive/20 cursor-pointer")}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
              adminMobileClass,
              "overflow-hidden boty-transition relative z-[60]",
              isMenuOpen ? "max-h-[calc(100vh-110px)] overflow-y-auto pb-6 pointer-events-auto" : "max-h-0 pointer-events-none",
          )}
        >
          <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
            {/* Mobile: Home + Explore section links (replaces the old bare "Tracking" link). */}
            {!isAdmin && (
              <>
                <Link
                  href="/"
                  onClick={() => {
                    setCurrentHash("")
                    setIsMenuOpen(false)
                  }}
                  aria-current={pathname === "/" && currentHash === "" ? "page" : undefined}
                  className={cn(
                    "relative z-[60] flex items-center justify-between px-4 py-3 rounded-xl text-sm tracking-wide boty-transition cursor-pointer",
                    pathname === "/" && currentHash === ""
                      ? activePill
                      : "text-foreground/80 hover:bg-accent/10 hover:text-primary",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <NavIcon name="Homepage" />
                    Home
                  </span>
                </Link>
                <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Explore ArcBest
                </p>
                {navigation.explore.map((item) => {
                  const itemActive = isExploreItemActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => {
                        rememberExplore(item.href)
                        setIsMenuOpen(false)
                      }}
                      aria-current={itemActive ? "page" : undefined}
                      className={cn(
                        "relative z-[60] flex items-center justify-between px-4 py-3 rounded-xl text-sm tracking-wide boty-transition cursor-pointer",
                        itemActive
                          ? activePill
                          : "text-foreground/80 hover:bg-accent/10 hover:text-primary",
                      )}
                    >
                    <span className="flex items-center gap-3">
                      <NavIcon name={item.name} />
                      <span>
                        <span className="block">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">{item.blurb}</span>
                      </span>
                    </span>
                    </Link>
                  )
                })}
              </>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "relative z-[60] flex items-center justify-between px-4 py-3 rounded-xl text-sm tracking-wide boty-transition cursor-pointer",
                  isActive(link.href)
                    ? activePill
                    : "text-foreground/80 hover:bg-accent/10 hover:text-primary",
                )}
              >
                <span className="flex items-center gap-3">
                  <NavIcon name={link.name} />
                  {link.name}
                </span>
                {link.badge != null && link.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-border/50 px-4 space-y-3">
              {variant === "default" && !session && (
                <>
                  {!onPublicAuthPage && (
                    <Link
                      href="/customer/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-md shadow-primary/30 boty-transition hover:bg-primary/90"
                    >
                      <Rocket className="w-4 h-4" />
                      Get Started
                    </Link>
                  )}
                  <p className="text-center text-sm text-muted-foreground">
                    Already shipping with us?{" "}
                    <Link
                      href="/customer/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </>
              )}

              {variant === "default" && session?.role === "customer" && (
                <Link
                  href="/customer/dashboard"
                  className="flex w-full items-center justify-center gap-2 py-3 rounded-full bg-primary/10 text-primary text-sm boty-transition hover:bg-primary/15"
                >
                  <MoveLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex w-full items-center justify-center gap-2 py-3 rounded-full bg-primary/10 text-primary text-sm boty-transition hover:bg-primary/15"
                >
                  <MoveLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              )}

              {(isAdmin || isCustomer) && (
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full py-3 rounded-full bg-destructive/10 text-destructive text-sm boty-transition hover:bg-destructive/20 cursor-pointer"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>

      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30"
            onClick={() => setShowLogoutModal(false)}
          />
          <div
            className="relative bg-card rounded-2xl max-w-md w-full logix-shadow border border-border/50 p-6 animate-scale-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-2xl text-foreground mb-3">Confirm Logout</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-transparent border border-foreground/20 text-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-foreground/5 cursor-pointer"
              >
                No, Stay logged in
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-destructive/10 text-destructive px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-destructive/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function NavIcon({ name }: { name: string }) {
  const icons = {
    Home,
    Overview: LayoutDashboard,
    Homepage: Home,
    Dashboard: LayoutDashboard,
    Services: BriefcaseBusiness,
    "Our Services": BriefcaseBusiness,
    "How It Works": Route,
    "Delivery Coverage": Truck,
    Coverage: Truck,
    "Why ArcBest": FileQuestion,
    FAQ: CircleHelp,
    "Contact Us": Phone,
    Contact: Phone,
    Shipments: Package,
    Users,
    Analytics: BarChart3,
    Activity,
    Settings,
    "New Shipment": Package,
    Notifications: Bell,
    Inbox: Bell,
    Profile: User,
  }
  const Icon = icons[name as keyof typeof icons] || ShieldCheck
  return <Icon className="h-4 w-4 shrink-0" />
}
