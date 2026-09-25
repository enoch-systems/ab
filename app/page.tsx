"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SmartImage } from "@/components/media/smart-image"
import {
  ArrowRight, Search, LocateFixed, Package, Truck, Plane, PlaneTakeoff, Ship, MapPin, Clock, Shield,
  CheckCircle2, Globe, BarChart3, Users, Star, ChevronDown, ChevronRight,
  Zap, Award, Headphones, ArrowUpDown, UserRoundPlus
} from "lucide-react"
import { SmartVideo } from "@/components/media/smart-video"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { LiveChatWidget } from "@/components/shared/live-chat"

function useOnVisible<T extends HTMLElement>(options = {}) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1, ...options },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

/** Rotating "live network activity" ticker shown under the hero tracking form. */
const liveFeed = [
  '📦 Shipment status updates are available in your ArcBest account',
  '✈️ Network updates are published as your shipment moves',
  '🚚 Support and tracking notifications stay together in one inbox',
  '🛃 Your tracking timeline records every shipment scan',
  '🚚 Same-day courier picked up · Manhattan',
  '🛃 Customs cleared · Frankfurt, DE',
  '🏙️ New business onboarded · Austin, TX',
]

function LiveTicker() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((v) => (v + 1) % liveFeed.length), 3000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <div className="mt-5 flex items-center gap-3 overflow-hidden rounded-full border border-border bg-card/70 px-4 py-2.5 logix-shadow">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <div className="relative h-5 flex-1 overflow-hidden">
        {liveFeed.map((message, i) => (
          <span key={i} className={`absolute inset-0 flex items-center whitespace-nowrap text-xs text-muted-foreground transition-all duration-500 ease-out ${i === index ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
            {message}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Scroll-triggered reveal: slides content in from `direction` once visible. */
function Reveal({ children, direction = 'up', delay = 0, className = '' }: { children: ReactNode; direction?: 'up' | 'down' | 'left' | 'right'; delay?: number; className?: string }) {
  const { ref, visible } = useOnVisible<HTMLDivElement>()
  const offset = { up: 'translate-y-8', down: '-translate-y-8', left: '-translate-x-10', right: 'translate-x-10' }[direction]
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out will-change-transform ${visible ? 'translate-x-0 translate-y-0 opacity-100' : `${offset} opacity-0`} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

function Section({ id, eyebrow, title, subtitle, children, reverse = false, className = "" }: any) {
  const { ref, visible } = useOnVisible<HTMLDivElement>()
  return (
    <section id={id} className={`py-16 sm:py-20 sm:py-24 scroll-mt-24 ${className}`}>
      <div ref={ref} className="max-w-7xl mx-auto px-6 lg:px-8">
        {(eyebrow || title || subtitle) && (
          <div className={`text-center mb-12 md:mb-16 ${visible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={visible ? { animationFillMode: 'forwards' } : {}}>
            {eyebrow && <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary font-semibold mb-4 block">{eyebrow}</span>}
            {title && <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground mb-4 text-balance leading-tight">{title}</h2>}
            {subtitle && <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
          </div>
        )}
        <div className={reverse ? '' : ''}>{children}</div>
      </div>
    </section>
  )
}

const heroVideoUrls = [
  "https://res.cloudinary.com/qz5m8bhg/video/upload/v1789495881/From_Klickpin.com-_371335931789711588-pin-id-371335931789711588_ng2her.mp4",
  "https://res.cloudinary.com/qz5m8bhg/video/upload/v1789495877/From_Klickpin.com-_94927504641887252-pin-id-94927504641887252_f0cwhx.mp4",
]

/** Looping clips behind the "How it works" cards (delivered lazily). */
const stepVideoUrls = [
  "https://res.cloudinary.com/qz5m8bhg/video/upload/v1789590320/a_3_zfkgen.mp4",
  "https://res.cloudinary.com/qz5m8bhg/video/upload/v1789590321/a_2_tvy7qo.mp4",
  "https://res.cloudinary.com/qz5m8bhg/video/upload/v1789590827/track_lahoqw.mp4",
  "https://res.cloudinary.com/qz5m8bhg/video/upload/v1789590320/a_1_r8qem5.mp4",
]

function Hero() {
  const router = useRouter()
  const [tracking, setTracking] = useState('')
  const [error, setError] = useState('')
  const [videoIndex, setVideoIndex] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handler = (event: Event) => {
      const target = event as CustomEvent<{ open: boolean }>
      setMobileMenuOpen(target.detail?.open ?? false)
    }

    window.addEventListener("mobile-menu-state", handler as EventListener)
    return () => window.removeEventListener("mobile-menu-state", handler as EventListener)
  }, [])

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    const q = tracking.trim()
    if (!q) { setError('Enter a tracking number'); return }
    router.push(`/track/${q.toUpperCase()}`)
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/*
         * Hero clip. The raw upload is now streamed through Cloudinary as a
         * ~720p `q_auto:eco` MP4 (a fraction of the original bytes), started
         * only after the page has loaded and the main thread is idle so it can
         * never delay the LCP text, and paused automatically off-screen.
         *
         * The full-screen inline `blur(0.4px)` filter was also removed: a CSS
         * filter over a decoding video forces the compositor to read back the
         * whole viewport every frame — the single biggest source of scroll jank
         * on this page.
         */}
        <SmartVideo
          key={videoIndex}
          src={heroVideoUrls[videoIndex]}
          width={1280}
          posterWidth={1280}
          loop={false}
          eager
          deferUntilIdle
          onEnded={() => setVideoIndex((current) => (current + 1) % heroVideoUrls.length)}
          className="absolute inset-0 h-full w-full object-cover opacity-70 dark:opacity-35 mix-blend-multiply dark:mix-blend-screen grayscale brightness-110 dark:brightness-75 contrast-110 dark:contrast-125 saturate-0"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/35 via-background/55 to-background/70 dark:from-background/90 dark:via-background/75 dark:to-background/80" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '32px 32px',
          color: 'currentColor',
        }} />
        <div className="absolute top-24 -left-20 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-12 -right-20 w-80 h-80 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="w-full">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary animate-blur-in opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
                TRUSTED BY 25,000+ BUSINESSES
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-foreground mt-6 text-balance animate-blur-in opacity-0" style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}>
                Ship smarter. <br />
                <span className="animate-gradient-pan bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Track faster.</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl leading-relaxed text-slate-800 dark:text-muted-foreground mt-6 max-w-xl animate-blur-in opacity-0" style={{ animationDelay: '0.45s', animationFillMode: 'forwards' }}>
                A trusted US logistics platform for domestic and international shipping. Real-time tracking, reliable delivery, transparent pricing.
              </p>

              {/* Tracking form */}
              <form onSubmit={handleTrack} id="track" className="mt-8 animate-blur-in opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                <label className="block text-sm font-semibold text-foreground mb-3">Track your shipment</label>
                <div className="flex flex-col sm:flex-row gap-3 p-2 sm:p-2 bg-card rounded-2xl border border-border logix-shadow">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 sm:py-1 rounded-xl sm:rounded-lg">
                    <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <input
                      value={tracking}
                      onChange={(e) => { setTracking(e.target.value); if (error) setError('') }}
                      type="text"
                      placeholder="Enter your tracking number"
                      className="flex-1 w-full bg-transparent outline-none text-sm sm:text-base placeholder:text-muted-foreground/60 text-foreground"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm sm:text-base font-medium boty-transition hover:bg-primary/90 shadow-md shadow-primary/30 cursor-pointer whitespace-nowrap"
                  >
                    Track Shipment <LocateFixed className="w-4 h-4" />
                  </button>
                </div>
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
                <LiveTicker />
              </form>

              {!mobileMenuOpen && (
                <div className="flex flex-nowrap items-center gap-2 mt-10 animate-blur-in opacity-0 sm:gap-6" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
                  <Link
                    href="/customer/signup"
                      className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 px-3 py-3 rounded-full border border-border bg-card text-foreground font-medium boty-transition hover:bg-accent/10 cursor-pointer text-xs whitespace-nowrap sm:flex-none sm:gap-2 sm:px-7 sm:py-3.5 sm:text-base"
                  >
                    <PlaneTakeoff className="w-4 h-4" /> Start Shipping
                  </Link>
                  <Link
                    href="/#how-it-works"
                      className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 px-3 py-3 rounded-full border border-border/90 bg-transparent text-foreground font-medium boty-transition hover:bg-accent/10 cursor-pointer text-xs whitespace-nowrap sm:flex-none sm:gap-2 sm:px-7 sm:py-3.5 sm:text-base"
                  >
                    How it works <ChevronDown className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Right side: featured shipment status card */}
            <div className="relative animate-blur-in opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              {/* Floating "network event" pills orbiting the card. */}
              <div className="animate-float-y absolute -left-3 top-6 z-20 hidden rounded-2xl border border-border bg-card/90 px-3.5 py-2 text-[11px] font-semibold shadow-lg shadow-slate-950/10 backdrop-blur logix-shadow sm:block">
                ✈️ Departed DXB · 04:20
              </div>
              <div className="animate-float-y-slow absolute -right-4 top-1/3 z-20 hidden rounded-2xl border border-border bg-card/90 px-3.5 py-2 text-[11px] font-semibold shadow-lg shadow-slate-950/10 backdrop-blur logix-shadow sm:block">
                🛃 Customs cleared · DXB
              </div>
              <div className="animate-float-y absolute -left-2 bottom-8 z-20 hidden rounded-2xl border border-border bg-card/90 px-3.5 py-2 text-[11px] font-semibold shadow-lg shadow-slate-950/10 backdrop-blur logix-shadow sm:block" style={{ animationDelay: '1.2s' }}>
                📦 Out for delivery · Queens
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-xl shadow-slate-950/10 sm:p-8">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">ARCBEST · LIVE</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="truncate font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Enter tracking ID</div>
                  </div>
                  <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/20 dark:text-violet-300">
                    <ArrowUpDown className="w-3 h-3" /> In Transit
                  </div>
                </div>

                <div className="relative mb-6 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:mb-8 sm:p-5">
                  <div className="mb-3 flex items-end justify-between gap-3 text-xs sm:text-sm">
                    <div className="min-w-0">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Origin</p>
                      <p className="truncate font-semibold text-foreground">Origin</p>
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Destination</p>
                      <p className="truncate font-semibold text-foreground">Destination</p>
                    </div>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="absolute inset-y-0 left-0 w-[62%] rounded-full bg-gradient-to-r from-primary via-accent to-primary" />
                    <div className="route-dash absolute inset-y-0 left-[62%] right-0 text-primary/50" />
                    <div className="absolute top-1/2 -translate-y-1/2 left-[58%] w-5 h-5 rounded-full bg-primary border-4 border-card shadow-md shadow-primary/30 flex items-center justify-center">
                      <Plane className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  </div>
                  <p className="mt-3 text-center text-xs text-muted-foreground">Live shipment progress appears here after you enter your tracking ID.</p>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="min-w-0 rounded-2xl border border-border bg-background/80 p-3 sm:p-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Est. Delivery</p>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">Not available yet</p>
                  </div>
                  <div className="min-w-0 rounded-2xl border border-border bg-background/80 p-3 sm:p-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Current Location</p>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">Enter tracking ID</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs leading-5 text-muted-foreground">Your shipment updates will appear here after tracking.</span>
                  <Link href="/track" className="inline-flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline sm:self-auto">
                    View details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="absolute -top-4 -left-4 rotate-[-6deg] bg-card border border-border rounded-2xl p-3 logix-shadow hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">100% Insured</p>
                  <p className="text-[10px] text-muted-foreground">Full cargo coverage</p>
                </div>
              </div>

              <div className="absolute -bottom-5 -right-3 rotate-[5deg] bg-card border border-border rounded-2xl p-3 logix-shadow hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Avg 2.4 days</p>
                  <p className="text-[10px] text-muted-foreground">US delivery</p>
                </div>
              </div>
            </div>
          </div>
          {/* Scroll cue */}
          <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-0.5 md:flex">
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Scroll</span>
            <ChevronDown className="animate-scroll-cue h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsStrip() {
  const stats = [
    { label: 'Shipments Delivered', target: 1.2, suffix: 'M+', Icon: Package },
    { label: 'Cities Covered', target: 2400, suffix: '+', Icon: MapPin },
    { label: 'Happy Customers', target: 25000, suffix: '+', Icon: Users },
    { label: 'On-Time Rate', target: 98.6, suffix: '%', Icon: CheckCircle2 },
  ]
  return (
    <div className="relative -mt-12 z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="bg-card rounded-3xl border border-border logix-shadow grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/60 overflow-hidden">
          {stats.map((stat, i) => <AnimatedStat key={stat.label} {...stat} index={i} />)}
        </div>
      </div>
    </div>
  )
}

function AnimatedStat({ label, target, suffix, Icon, index }: { label: string; target: number; suffix: string; Icon: typeof Package; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.35 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let frame = 0
    let start = 0
    let loop: number

    const runCounter = () => {
      window.cancelAnimationFrame(frame)
      start = 0
      setValue(0)
      const animate = (time: number) => {
        if (!start) start = time
        const progress = Math.min((time - start) / 1300, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(target * eased)
        if (progress < 1) frame = requestAnimationFrame(animate)
      }
      frame = requestAnimationFrame(animate)
    }

    const delay = window.setTimeout(() => {
      runCounter()
      loop = window.setInterval(runCounter, 10000)
    }, index * 140)

    return () => {
      window.clearTimeout(delay)
      window.clearInterval(loop)
      window.cancelAnimationFrame(frame)
    }
  }, [index, target, visible])

  const display = target < 100 ? value.toFixed(1) : Math.round(value).toLocaleString()
  const entrance = ['-translate-x-5', 'translate-y-5', 'translate-x-5', 'translate-y-5'][index]

  return (
    <div ref={ref} className={`p-5 text-center transition-all duration-700 sm:p-8 ${visible ? 'translate-x-0 translate-y-0 opacity-100' : `${entrance} opacity-0`}`}>
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="font-serif text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">{display}{suffix}</div>
      <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</div>
    </div>
  )
}

function Services() {
  const services = [
    { title: 'Domestic Delivery', desc: 'Fast door-to-door shipping across all 50 states within 1-3 business days.', image: 'https://res.cloudinary.com/qz5m8bhg/image/upload/v1789537779/van_keybjj.png', tag: '01 · Last mile' },
    { title: 'International Shipping', desc: 'Worldwide delivery via air, sea and express partners. Customs cleared to 190+ countries.', image: 'https://res.cloudinary.com/qz5m8bhg/image/upload/v1789536860/1_3_efyhqf.png', tag: '02 · Global network' },
    { title: 'Sea Freight', desc: 'Cost-effective bulk cargo and container shipping for commercial import / export.', image: 'https://res.cloudinary.com/qz5m8bhg/image/upload/v1789536854/1_4_oeat8u.png', tag: '03 · Ocean lanes' },
    { title: 'Warehousing', desc: 'Secure storage, inventory management, and fulfilment services across our network hubs.', image: 'https://res.cloudinary.com/qz5m8bhg/image/upload/v1789537776/warehouse_wnzrat.png', tag: '04 · Fulfilment' },
    { title: 'Express Courier', desc: 'Same-day and next-day urgent deliveries in major US metropolitan areas.', image: 'https://res.cloudinary.com/qz5m8bhg/image/upload/v1789536854/1_2_kxe8pc.png', tag: '05 · Priority' },
    { title: 'Cargo Insurance', desc: 'Optional comprehensive insurance for loss, damage, theft with every shipment.', image: 'https://res.cloudinary.com/qz5m8bhg/image/upload/v1789536865/1_1_xyjovj.png', tag: '06 · Protection' },
  ]
  return (
    <Section id="services" eyebrow="Our Services" title="Everything logistics, one platform" subtitle="From small envelopes to full containers, we handle every stage of your supply chain with reliability and visibility.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
        {services.map(({ title, desc, image, tag }, i) => (
          <Reveal key={title} direction={(['up', 'left', 'right', 'down'] as const)[i % 4]} delay={(i % 3) * 100} className={i < 2 ? 'lg:col-span-6' : 'lg:col-span-4'}>
            <article className="group relative h-full overflow-hidden rounded-[26px] border border-border/80 bg-card transition duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
            <div className={`relative flex items-center justify-center overflow-hidden border-b border-border/70 bg-primary/[0.035] ${i < 2 ? 'h-44 sm:h-52' : 'h-36 sm:h-40'}`}>
              <div className="absolute left-5 top-4 z-10 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/75">{tag}</div>
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-primary/10 transition duration-700 group-hover:scale-150" />
              {/*
                * These six service illustrations were previously served as raw,
                * untransformed Cloudinary PNGs — often several hundred KB each.
                * SmartImage now requests a `w_800,f_auto,q_auto:eco` variant
                * (typically WebP/AVIF at a fraction of the bytes), keeps the
                * first two preloaded for the LCP window, and paints a blurred
                * backdrop so the cards never flash empty.
                */}
              <SmartImage
                src={image}
                alt=""
                fill
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 31vw"
                aboveTheFold={i < 2}
                cloudinaryWidth={800}
                blurClassName="object-contain p-[14%] scale-100"
                className="object-contain p-[14%] transition duration-700 ease-out group-hover:scale-110"
              />
            </div>
            <div className="flex-1 p-5 sm:p-6">
              <h3 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{desc}</p>
            </div>
          </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

function HowItWorks() {
  const { ref: railRef, visible: railVisible } = useOnVisible<HTMLDivElement>()
  const steps = [
    { n: '01', title: 'Create a shipment', desc: 'Enter sender, recipient and package details on our simple form.', Icon: Package },
    { n: '02', title: 'We pick it up', desc: 'Our courier arrives at your door within scheduled pickup window.', Icon: Truck },
    { n: '03', title: 'Track in real-time', desc: 'Live location updates, status timelines, and SMS/email alerts.', Icon: Globe },
    { n: '04', title: 'Delivered', desc: 'Proof of delivery with signature capture, and delivery photos.', Icon: CheckCircle2 },
  ]
  return (
    <Section id="how-it-works" eyebrow="How It Works" title="4 steps from pickup to doorstep" subtitle="Our simplified workflow is designed so you focus on your business while we handle the logistics.">
      <div className="relative" ref={railRef}>
        <div className="hidden md:block absolute left-16 right-16 top-16 h-0.5 overflow-hidden rounded-full bg-primary/15">
          {/* Rail draws itself left→right once the section scrolls into view. */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-[1600ms] ease-out"
            style={{ width: railVisible ? '100%' : '0%' }}
          />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4">
          {steps.map(({ n, title, desc }, i) => (
            <div key={title} className={`relative text-center ${i < 4 ? 'min-h-[250px] overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-950 px-4 py-6 shadow-xl shadow-slate-950/15 sm:min-h-[290px] sm:px-6 sm:py-7' : ''}`}>
              {i < 4 && (
                <>
                  {/*
                   * Four looping background clips. To feel instant on scroll:
                   * tiny 480px WebM-first files (MP4 fallback for Safari),
                   * trimmed to a 6s looping taste with the muted audio track
                   * stripped (~cent KB each), poster frame painted immediately
                   * (+ preloaded in <head>), low-priority fetch right after
                   * page load + idle, and playback starting a full viewport
                   * early — so frames are already buffered when the card is
                   * seen. Off-screen clips still stop decoding entirely.
                   */}
                  <SmartVideo
                    src={stepVideoUrls[i]}
                    width={480}
                    posterWidth={480}
                    prefetchOnIdle
                    loopDuration={6}
                    viewportMargin="1000px"
                    className="absolute inset-0 h-full w-full scale-100 object-cover object-center opacity-80"
                  />
                  <div className="absolute inset-0 bg-slate-950/35" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-slate-900/20" />
                </>
              )}
              <div className="relative z-10 flex min-h-[198px] flex-col justify-end text-center sm:min-h-[234px]">
                <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 font-serif text-[10px] font-bold sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-xs ${i < 4 ? 'border border-white/20 bg-white/15 text-white' : 'border border-primary/20 bg-primary/10 text-primary'}`}>{n}</span>
                <h3 className={`mb-1.5 font-serif text-base font-semibold sm:mb-2 sm:text-lg ${i < 4 ? 'text-white' : 'text-foreground'}`}>{title}</h3>
                <p className={`mx-auto max-w-xs text-xs leading-5 sm:text-sm sm:leading-relaxed ${i < 4 ? 'text-white/75' : 'text-muted-foreground'}`}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

function Coverage() {
  /**
   * 15 flagship lanes (major global trade partners — none in Africa, per the
   * brief). `volume` is a relative trade-volume score that drives the animated
   * bar on each card, `mode` is the dominant freight mode (✈️ air / 🚢 sea /
   * 🚚 road) shown as a floating emoji.
   */
  const countries = [
    { flag: '🇺🇸', country: 'United States', hub: 'New York · JFK', days: '1–3 days', volume: 96, mode: '🚚', modeLabel: 'Road & Air' },
    { flag: '🇨🇦', country: 'Canada', hub: 'Toronto · YYZ', days: '2–4 days', volume: 84, mode: '🚚', modeLabel: 'Road' },
    { flag: '🇲🇽', country: 'Mexico', hub: 'Mexico City · MEX', days: '2–4 days', volume: 78, mode: '🚚', modeLabel: 'Road' },
    { flag: '🇬🇧', country: 'United Kingdom', hub: 'London · LHR', days: '3–5 days', volume: 90, mode: '✈️', modeLabel: 'Air' },
    { flag: '🇩🇪', country: 'Germany', hub: 'Frankfurt · FRA', days: '3–5 days', volume: 87, mode: '✈️', modeLabel: 'Air' },
    { flag: '🇳🇱', country: 'Netherlands', hub: 'Amsterdam · AMS', days: '3–5 days', volume: 82, mode: '🚢', modeLabel: 'Sea' },
    { flag: '🇫🇷', country: 'France', hub: 'Paris · CDG', days: '3–6 days', volume: 80, mode: '✈️', modeLabel: 'Air' },
    { flag: '🇦🇪', country: 'UAE', hub: 'Dubai · DXB', days: '4–6 days', volume: 86, mode: '✈️', modeLabel: 'Air' },
    { flag: '🇮🇳', country: 'India', hub: 'Mumbai · BOM', days: '4–7 days', volume: 74, mode: '🚢', modeLabel: 'Sea' },
    { flag: '🇨🇳', country: 'China', hub: 'Shanghai · PVG', days: '5–8 days', volume: 92, mode: '🚢', modeLabel: 'Sea' },
    { flag: '🇯🇵', country: 'Japan', hub: 'Tokyo · NRT', days: '5–8 days', volume: 83, mode: '✈️', modeLabel: 'Air' },
    { flag: '🇰🇷', country: 'South Korea', hub: 'Seoul · ICN', days: '5–8 days', volume: 77, mode: '🚢', modeLabel: 'Sea' },
    { flag: '🇸🇬', country: 'Singapore', hub: 'Singapore · SIN', days: '5–9 days', volume: 81, mode: '🚢', modeLabel: 'Sea' },
    { flag: '🇭🇰', country: 'Hong Kong', hub: 'Hong Kong · HKG', days: '5–9 days', volume: 79, mode: '✈️', modeLabel: 'Air' },
    { flag: '🇦🇺', country: 'Australia', hub: 'Sydney · SYD', days: '6–10 days', volume: 72, mode: '🚢', modeLabel: 'Sea' },
  ]
  return (
    <Section id="coverage" eyebrow="Delivery Coverage" title="Reach everywhere that matters" subtitle="Live lanes to 15 of the world's biggest trade partners — plus our partner network spanning 190+ countries.">
      {/* Air & sea lanes: a plane flies one way, a container ship sails back. */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-card/70 px-4 py-1 logix-shadow">
        <div className="relative h-12">
          <div className="absolute left-0 right-0 top-2.5 border-t-2 border-dashed border-primary/30" />
          <span className="animate-plane absolute left-0 top-0 text-xl sm:text-2xl" aria-hidden="true">
            <span className="inline-block -rotate-6">✈️</span>
          </span>
          <div className="absolute bottom-1.5 left-0 right-0 border-t-2 border-dashed border-accent/30" />
          <span className="animate-ship absolute bottom-0 right-0 text-xl sm:text-2xl" aria-hidden="true">
            <span className="animate-float-emoji inline-block">🚢</span>
          </span>
        </div>
        <p className="pb-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground">
          <span className="text-primary">Live air corridor</span> ·· <span className="text-accent">Ocean lane</span> — cargo moving right now
        </p>
      </div>

      {/* Two infinite marquees gliding in opposite directions. */}
      <CoverageMarquee countries={countries} />
      <CoverageMarquee countries={countries} reverse />

      {/* 15 country cards, each sliding in from a different direction. */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
        {countries.map((c, i) => (
          <CountryCard key={c.country} country={c} index={i} />
        ))}
      </div>
    </Section>
  )
}

/** Endless horizontal ticker of country pills. `reverse` glides left → right. */
function CoverageMarquee({ countries, reverse = false }: { countries: CoverageCountry[]; reverse?: boolean }) {
  const items = reverse ? [...countries].reverse() : countries
  return (
    <div
      className="marquee-mask relative mb-4 overflow-hidden rounded-2xl border border-border bg-card/60 py-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      aria-hidden="true"
    >
      <div className={`flex w-max gap-3 ${reverse ? 'animate-marquee-r' : 'animate-marquee-l'}`}>
        {/* List is duplicated so the -50% translate loops without a visible seam. */}
        {[...items, ...items].map((c, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground/90 sm:text-sm">
            <span className="text-base">{c.flag}</span>
            {c.country}
            <span className="animate-float-emoji text-sm">{c.mode}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

type CoverageCountry = {
  flag: string
  country: string
  hub: string
  days: string
  volume: number
  mode: string
  modeLabel: string
}

/**
 * One lane card. Entrance slides from a direction that cycles per index
 * (left → right → top → bottom), and the volume bar fills once the card
 * scrolls into view.
 */
function CountryCard({ country: c, index }: { country: CoverageCountry; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.25 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const offsets = ['-translate-x-12', 'translate-x-12', '-translate-y-10', 'translate-y-10']
  const hidden = offsets[index % 4]

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-md shadow-slate-950/5 transition-all duration-700 ease-out hover:border-primary/50 hover:shadow-lg sm:p-5 ${visible ? 'translate-x-0 translate-y-0 opacity-100' : `${hidden} opacity-0`}`}
      style={{ transitionDelay: `${(index % 3) * 90}ms` }}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <span className="text-2xl sm:text-3xl" role="img" aria-label={c.country}>{c.flag}</span>
        <span className="animate-float-emoji text-lg sm:text-xl" title={c.modeLabel} aria-label={c.modeLabel}>{c.mode}</span>
      </div>
      <h3 className="relative mt-2 font-serif text-sm font-semibold text-foreground sm:text-base">{c.country}</h3>
      <p className="relative text-[11px] text-muted-foreground sm:text-xs">{c.hub}</p>

      <div className="relative mt-3 flex items-center justify-between text-[11px] sm:text-xs">
        <span className="text-muted-foreground">Transit</span>
        <span className="font-semibold text-primary">{c.days}</span>
      </div>
      <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-border/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-1000 ease-out"
          style={{ width: visible ? `${c.volume}%` : '0%', transitionDelay: `${(index % 3) * 120 + 200}ms` }}
        />
      </div>
      <div className="relative mt-1 flex items-center justify-between text-[10px] text-muted-foreground sm:text-[11px]">
        <span>{c.modeLabel} volume</span>
        <span className="font-mono font-semibold text-foreground/80">{c.volume}%</span>
      </div>
    </div>
  )
}

function WhyUs() {
  const rows = [
    { title: 'Real-time tracking on every shipment', desc: 'Never wonder where your package is. Live GPS tracking, scan events, and a visual timeline.', Icon: BarChart3 },
    { title: 'Award-winning operations team', desc: 'ISO 9001 certified operations with trained logistics professionals handling your cargo.', Icon: Award },
    { title: '24/7 Customer support', desc: 'Round-the-clock phone, email and live chat support for all your shipment inquiries.', Icon: Headphones },
    { title: 'Transparent pricing', desc: 'Upfront quotes with no hidden fees. Clear breakdown of shipping, insurance and customs.', Icon: Globe },
  ]
  return (
    <Section id="why-us" eyebrow="Why ArcBest" title="Why thousands of companies choose us" subtitle="Built for the way US businesses ship today — reliable, fast, and technology-first.">
      <div className="overflow-hidden border-y border-border/70">
        {rows.map(({ title, desc }, index) => (
          <AnimatedWhyRow key={title} title={title} desc={desc} index={index} />
        ))}
      </div>
    </Section>
  )
}

function AnimatedWhyRow({ title, desc, index }: { title: string; desc: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const fromLeft = index % 2 === 0

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.2 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`group grid gap-4 border-b border-border/70 py-6 transition-all duration-700 ease-out last:border-b-0 sm:grid-cols-[72px_minmax(180px,0.75fr)_1.25fr] sm:items-center sm:gap-6 sm:py-8 lg:grid-cols-[96px_minmax(260px,0.8fr)_1.2fr] lg:gap-10 ${visible ? 'translate-x-0 opacity-100' : `${fromLeft ? '-translate-x-12' : 'translate-x-12'} opacity-0`}`}
    >
      <div className="flex items-center justify-between sm:block">
        <span className="font-mono text-xs tracking-[0.2em] text-primary/70">0{index + 1}</span>
      </div>
      <h3 className="max-w-sm font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">{title}</h3>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{desc}</p>
    </div>
  )
}

function ScrollReveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [fromLeft, setFromLeft] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    lastScrollY.current = window.scrollY
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setFromLeft(window.scrollY < lastScrollY.current)
        setVisible(false)
        requestAnimationFrame(() => setVisible(true))
      } else {
        setVisible(false)
      }
      lastScrollY.current = window.scrollY
    }, { threshold: 0.15 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? 'translate-x-0 opacity-100' : `${fromLeft ? '-translate-x-12' : 'translate-x-12'} opacity-0`} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

function FAQSection() {
  const faqs = [
    { q: 'How can I track my shipment?', a: 'Enter your tracking number in the search box at the top of the page, or log in to your customer dashboard for a complete list of your shipments with full timeline details. Tracking numbers are emailed to you immediately after creating a shipment.' },
    { q: 'What are the domestic delivery times?', a: 'Standard shipping: 2–3 business days between major cities and 3–5 days for remote areas. Express shipping: next-day delivery in major metropolitan areas. Premium shipping: same-day delivery in select service hubs.' },
    { q: 'Which international countries do you ship to?', a: 'We ship to over 190 countries worldwide via our air and sea freight partners, with reliable service to North America, Europe, Asia, and beyond.' },
    { q: 'How is shipping cost calculated?', a: 'Pricing is based on the shipment details recorded by the ArcBest operations team, including package type, weight, dimensions, route, and service level.' },
    { q: 'Is my shipment insured?', a: 'Every shipment includes base carrier liability. Optional comprehensive cargo insurance is available at checkout covering loss, theft, and damage up to the full declared value of your goods.' },
    { q: 'What happens if my delivery is delayed?', a: 'Our operations team monitors every shipment proactively. If we detect a delay, we notify you immediately via your preferred channel. Late express deliveries qualify for service refunds as per our SLA.' },
  ]
  return (
    <Section id="faq" eyebrow="FAQ" title="Frequently asked questions" subtitle="Can't find the answer you're looking for? Reach out to our support team anytime.">
      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
        {faqs.map((f, i) => {
          const [open, setOpen] = useState(false)
          return (
            <ScrollReveal key={i} delay={i * 75}>
              <details className="group bg-card rounded-2xl logix-shadow overflow-hidden boty-transition border border-border" open={open}>
                <summary
                  onClick={(e) => { e.preventDefault(); setOpen(!open) }}
                  className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 cursor-pointer list-none text-foreground font-semibold hover:text-primary boty-transition"
                >
                  <span className="text-sm sm:text-base">{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 boty-transition ${open ? 'rotate-180' : ''}`} />
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{f.a}</p>
                </div>
              </details>
            </ScrollReveal>
          )
        })}
      </div>
    </Section>
  )
}

function CTA() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handler = (event: Event) => {
      const target = event as CustomEvent<{ open: boolean }>
      setMobileMenuOpen(target.detail?.open ?? false)
    }

    window.addEventListener("mobile-menu-state", handler as EventListener)
    return () => window.removeEventListener("mobile-menu-state", handler as EventListener)
  }, [])

  return (
    <section id="contact" className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-slate-950 shadow-2xl shadow-slate-950/10 dark:border-slate-700/80 dark:bg-[linear-gradient(135deg,#0f172a_0%,#111827_58%,#172033_100%)] dark:text-white dark:shadow-slate-950/20 sm:p-8 md:p-10 lg:p-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(15,23,42,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.6) 1px, transparent 1px)', backgroundSize: '34px 34px' }} />
          <div className="relative">
            <ScrollReveal className="text-center lg:text-left">
              {!mobileMenuOpen && (
                <div className="mb-5 inline-flex items-center gap-2 border-b border-slate-300 pb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-600 dark:border-white/20 dark:text-slate-300 sm:text-sm">
                  <Star className="h-4 w-4 fill-amber-300 text-amber-300" /> Rated 4.9 / 5 by 5,000+ shippers
                </div>
              )}
              <h2 className="mb-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-slate-950 text-balance dark:text-white sm:text-4xl md:text-5xl">
                Ready to ship with confidence?
              </h2>
              <p className="mx-auto mb-7 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:mb-8 sm:text-base lg:mx-0">
                Create your first shipment today. No contracts, no long-term commitments, no surprises. Pay only for what you ship.
              </p>
              <div className="mx-auto flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row lg:mx-0">
                <Link
                  href="/customer/signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:w-auto sm:text-base"
                >
                  <UserRoundPlus className="w-4 h-4" /> Create Account
                </Link>
                <a
                  href="tel:+18005550147"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-transparent px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-white/25 dark:text-white dark:hover:bg-white/10 sm:w-auto sm:text-base"
                >
                  <Headphones className="w-4 h-4" /> Talk to Sales
                </a>
              </div>
              <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400 lg:justify-start sm:text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" /> Free pickup</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" /> Cancel anytime</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" /> Insurance included</li>
              </ul>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <main className="overflow-x-clip">
      <Header />
      <Hero />
      <StatsStrip />
      <Services />
      <HowItWorks />
      <Coverage />
      <WhyUs />
      <FAQSection />
      <CTA />
      <Footer />
      <LiveChatWidget />
    </main>
  )
}
