"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, PackageSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const SAVED_TRACKING_KEY = "arcbest-saved-tracking-ids"

export default function TrackIndexPage() {
  const router = useRouter()
  const [tracking, setTracking] = useState("")
  const [saved, setSaved] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_TRACKING_KEY)
      if (raw) setSaved(JSON.parse(raw) as string[])
    } catch { /* ignore unavailable storage */ }
  }, [])

  const saveTracking = (value: string) => {
    const next = [value, ...saved.filter((item) => item !== value)].slice(0, 8)
    setSaved(next)
    try { window.localStorage.setItem(SAVED_TRACKING_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const value = tracking.trim().toUpperCase()
    if (!value) return
    saveTracking(value)
    router.push(`/track/${value}`)
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <PackageSearch className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Tracking</p>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Track your shipment</h1>
            </div>
          </div>

          <p className="text-sm text-muted-foreground sm:text-base">
            Enter your tracking number to see live route progress, every recorded scan and the
            expected delivery date.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="sr-only" htmlFor="tracking-number">
              Tracking number
            </label>
            <Input
              id="tracking-number"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="e.g. your tracking number"
              autoComplete="off"
              className="h-12 rounded-2xl border-border bg-background text-base text-foreground placeholder:text-muted-foreground/80"
            />
            <Button
              type="submit"
              className="h-12 w-full rounded-2xl text-sm font-medium sm:text-base"
            >
              Track shipment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {saved.length > 0 && <div className="mt-6 border-t border-border/70 pt-5"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Recently tracked</p><div className="flex flex-wrap gap-2">{saved.map((code) => <button key={code} type="button" onClick={() => { setTracking(code); saveTracking(code); router.push(`/track/${code}`) }} className="rounded-full border border-border bg-muted/40 px-3 py-1.5 font-mono text-xs text-foreground transition hover:border-primary/40 hover:bg-primary/5">{code}</button>)}</div></div>}
          <p className="mt-6 text-center text-sm text-muted-foreground">Tracking numbers are provided by ArcBest when your shipment is created.</p>
        </div>
      </main>
    </div>
  )
}
